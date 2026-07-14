import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'task-planner-dev-secret-change-in-production';
const EXPIRES = process.env.JWT_EXPIRES || '7d';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
