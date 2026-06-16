import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import formsRouter from './routes/forms';
import applicationsRouter from './routes/applications';
import notificationsRouter from './routes/notifications';
import metricsRouter from './routes/metrics';
import auditRouter from './routes/audit';
import usersRouter from './routes/users';
import branchesRouter from './routes/branches';
import configRouter from './routes/config';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();
function resolveAssetsDir(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'assets'),
    path.join(process.cwd(), 'packages', 'backend', 'public', 'assets')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

const assetsDir = resolveAssetsDir();
fs.mkdirSync(path.join(assetsDir, 'uploads'), { recursive: true });

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(assetsDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/forms', formsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/users', usersRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/config', configRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`LoanAP backend listening on port ${config.port}`);
});
