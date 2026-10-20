import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load server/.env (cwd) first, then repo-root .env as fallback. Existing vars win.
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-insecure-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (!env.isProd && (env.jwtSecret.startsWith('dev-') || env.jwtRefreshSecret.startsWith('dev-'))) {
  console.warn('[env] Using default JWT secrets — set JWT_SECRET and JWT_REFRESH_SECRET in .env for anything non-local.');
}

export default env;
