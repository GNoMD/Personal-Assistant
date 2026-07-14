import { createServer } from 'http';
import { createApp, initDatabase } from './app.js';
import { closeDb } from './db.js';
import { initSocket } from './socket.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

initDatabase();

const app = createApp();
const server = createServer(app);
initSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`Task Planner running at http://${HOST}:${PORT}`);
  if (HOST === '0.0.0.0') {
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://<your-server-ip>:${PORT}`);
  }
});

process.on('SIGINT', () => {
  server.close();
  closeDb();
  process.exit(0);
});

export default server;
