import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';
import teamsRouter from './routes/teams.js';
import auditRouter from './routes/audit.js';
import recipesRouter from './routes/recipes.js';
import menusRouter from './routes/menus.js';
import fitnessRouter from './routes/fitness.js';
import assistantRouter from './routes/assistant.js';
import adminRouter from './routes/admin.js';
import profileRouter from './routes/profile.js';
import { seedSharedRecipeLibrary } from './seed/seedRecipes.js';
import { ensureDefaultAdminUser } from './seed/ensureDefaultAdmin.js';
import { ensureGnomdMedicationSchedule } from './seed/ensureGnomdMedicationSchedule.js';
import { ensureGnomdProfile } from './seed/ensureGnomdProfile.js';
import { ensurePlanAfternoonTea } from './seed/ensurePlanAfternoonTea.js';
import { ensurePlanLunchDinner } from './seed/ensurePlanLunchDinner.js';
import { ensureSoyMilkWeekMenu } from './seed/ensureSoyMilkWeekMenu.js';
import { stripHairCarePlanFromOtherUsers } from './seed/stripHairCareFromOtherUsers.js';
import { seedUserTasks } from './seed/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const db = getDb();
    const taskCount = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    res.json({ status: 'ok', database: 'sqlite', taskCount, userCount });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/teams', teamsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/recipes', recipesRouter);
  app.use('/api/menus', menusRouter);
  app.use('/api/fitness', fitnessRouter);
  app.use('/api/assistant', assistantRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/admin', adminRouter);

  if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST, {
      index: false,
      setHeaders(res, filePath) {
        if (/\.html$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'no-store');
        } else if (/\.(?:js|css|png|jpe?g|webp|svg|woff2?)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }

  app.use((err, _req, res, _next) => {
    console.error('[api]', err);
    res.status(500).json({ error: err.message || '服务器内部错误' });
  });

  return app;
}

export function initDatabase() {
  getDb();
  seedSharedRecipeLibrary();
  const admin = ensureDefaultAdminUser();
  seedUserTasks(admin.userId, { includeHairCare: true });
  ensureGnomdMedicationSchedule(admin.userId);
  ensureGnomdProfile();
  ensurePlanAfternoonTea();
  ensurePlanLunchDinner();
  ensureSoyMilkWeekMenu();
  stripHairCarePlanFromOtherUsers();
  return { initialized: true };
}
