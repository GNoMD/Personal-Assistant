import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep deployment secrets in task-planner/.env on every operating system.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
