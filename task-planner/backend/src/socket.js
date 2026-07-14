import { Server } from 'socket.io';
import { verifyToken } from './auth/jwt.js';
import { getDb } from './db.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('未授权'));
    try {
      const payload = verifyToken(token);
      const user = getDb().prepare(
        'SELECT id, username, display_name FROM users WHERE id = ?'
      ).get(payload.sub);
      if (!user) return next(new Error('用户无效'));
      socket.user = user;
      next();
    } catch {
      next(new Error('令牌无效'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    const teams = getDb().prepare(
      'SELECT team_id FROM team_members WHERE user_id = ?'
    ).all(userId);
    teams.forEach((t) => socket.join(`team:${t.team_id}`));

    socket.to(`team:${teams[0]?.team_id}`).emit('team:presence', {
      userId,
      username: socket.user.username,
      status: 'online',
    });

    socket.on('disconnect', () => {
      teams.forEach((t) => {
        socket.to(`team:${t.team_id}`).emit('team:presence', {
          userId,
          username: socket.user.username,
          status: 'offline',
        });
      });
    });
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function getIO() {
  return io;
}
