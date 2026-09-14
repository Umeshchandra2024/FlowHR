import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// /run is the one place abuse actually costs something (it can send real emails via Resend),
// so it gets a tighter limit than the rest of the API.
export const runRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.RUN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many run requests, please slow down' } },
});
