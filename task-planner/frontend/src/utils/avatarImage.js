/**
 * Resize & compress an image File to a JPEG data URL for avatar upload.
 * @param {File} file
 * @param {{ maxSize?: number, quality?: number }} [options]
 * @returns {Promise<string>} data:image/jpeg;base64,...
 */
export function compressImageToJpegDataUrl(file, options = {}) {
  const maxSize = options.maxSize ?? 512;
  const quality = options.quality ?? 0.86;

  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('图片过大，请选择 8MB 以内的文件'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法处理图片'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (!dataUrl || dataUrl.length < 32) {
          reject(new Error('图片压缩失败'));
          return;
        }
        // Rough size guard (~base64 length * 0.75)
        if (dataUrl.length * 0.75 > 850 * 1024) {
          reject(new Error('压缩后仍过大，请换一张更小的图片'));
          return;
        }
        resolve(dataUrl);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('图片压缩失败'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('无法读取图片'));
    };
    img.src = objectUrl;
  });
}
