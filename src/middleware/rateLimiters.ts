import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
});
