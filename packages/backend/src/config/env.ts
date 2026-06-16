import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const config = {
  databaseUrl: requireEnv('DATABASE_URL'),
  odkBaseUrl: requireEnv('ODK_CENTRAL_BASE_URL'),
  odkProjectId: requireEnv('ODK_CENTRAL_PROJECT_ID'),
  odkEmail: requireEnv('ODK_CENTRAL_EMAIL'),
  odkPassword: requireEnv('ODK_CENTRAL_PASSWORD'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
