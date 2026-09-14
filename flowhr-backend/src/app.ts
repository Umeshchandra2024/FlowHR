import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigins } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { ApiError } from './utils/apiError';

// Split from index.ts so tests can import the app without binding a port.
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', routes);

  app.use((req, _res, next) => {
    next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
  });

  app.use(errorHandler);

  return app;
}
