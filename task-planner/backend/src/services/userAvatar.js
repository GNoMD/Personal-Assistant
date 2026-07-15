import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 900 * 1024; // after client compress; hard cap ~900KB

function resolveAvatarDir() {
  const dbPath = typeof DB_PATH === 'function'
    ? DB_PATH()
    : (process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db'));
  return path.join(path.dirname(dbPath), 'avatars');
}

export function ensureAvatarDir() {
  const dir = resolveAvatarDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function avatarFilePath(userId) {
  return path.join(ensureAvatarDir(), `${Number(userId)}.jpg`);
}

export function hasUserAvatar(userId) {
  try {
    return fs.existsSync(avatarFilePath(userId));
  } catch {
    return false;
  }
}

export function getAvatarMeta(userId) {
  const filePath = avatarFilePath(userId);
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  return {
    hasAvatar: true,
    updatedAt: stat.mtime.toISOString(),
    // Client fetches with Authorization; version helps cache-bust local blob
    version: String(Math.floor(stat.mtimeMs)),
  };
}

/**
 * Save avatar from a data URL (image/jpeg|png|webp).
 * Always stores as .jpg bytes as provided when jpeg, otherwise raw bytes with .jpg name
 * only for jpeg; png/webp written with correct extension via converting expectation:
 * client should send JPEG data URL after canvas compress.
 */
export function saveUserAvatarFromDataUrl(userId, dataUrl) {
  const raw = String(dataUrl || '');
  const match = raw.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw Object.assign(new Error('头像格式无效，请上传 JPG / PNG / WebP'), { status: 400 });
  }
  const mime = match[1];
  if (!ALLOWED.has(mime)) {
    throw Object.assign(new Error('仅支持 JPG、PNG 或 WebP 图片'), { status: 400 });
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) {
    throw Object.assign(new Error('头像文件为空'), { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    throw Object.assign(new Error('头像过大，请选择更小的图片'), { status: 400 });
  }

  // Basic magic-byte check
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
  const isWebp = buffer.length > 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (
    (mime === 'image/jpeg' && !isJpeg)
    || (mime === 'image/png' && !isPng)
    || (mime === 'image/webp' && !isWebp)
  ) {
    throw Object.assign(new Error('头像内容与格式不符'), { status: 400 });
  }

  const filePath = avatarFilePath(userId);
  // Always persist as userId.jpg for a stable path; client converts to JPEG before upload.
  if (mime !== 'image/jpeg') {
    throw Object.assign(new Error('请上传 JPEG 头像（前端会自动压缩转换）'), { status: 400 });
  }
  fs.writeFileSync(filePath, buffer);
  return getAvatarMeta(userId);
}

export function readUserAvatar(userId) {
  const filePath = avatarFilePath(userId);
  if (!fs.existsSync(filePath)) return null;
  return {
    buffer: fs.readFileSync(filePath),
    contentType: 'image/jpeg',
    mtime: fs.statSync(filePath).mtime,
  };
}

export function deleteUserAvatar(userId) {
  const filePath = avatarFilePath(userId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
