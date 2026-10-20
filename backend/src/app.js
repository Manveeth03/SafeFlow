import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import api from './routes/index.js';
import { HttpError } from './lib/errors.js';

export function createApp() {
  const app = express();
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8080')
    .split(',').map((o) => o.trim()).filter(Boolean);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', api);
  app.use((_req, _res, next) => next(new HttpError(404, 'Route not found')));

  // Centralized error handler: never leaks stack traces in production.
  app.use((err, _req, res, _next) => {
    let status = err.status || 500;
    let message = err.message;
    let details = err.details;
    if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
    else if (err.name === 'ValidationError') { status = 400; message = 'Validation failed'; details = Object.values(err.errors).map((e) => e.message); }
    else if (err.code === 11000) { status = 409; message = 'A record with that value already exists'; }
    if (status >= 500) {
      console.error(err);
      if (process.env.NODE_ENV === 'production') message = 'Internal server error';
    }
    const body = { error: { message, ...(details && { details }) } };
    if (status >= 500 && process.env.NODE_ENV !== 'production') body.error.stack = err.stack;
    res.status(status).json(body);
  });

  return app;
}
