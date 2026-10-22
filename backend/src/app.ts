import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

app.use(helmet());

// Only the frontend origin may call this API with cookies (credentials).
// Never use origin "*" together with credentials.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// No login and no database query: it only proves the server is running.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Future routes (auth, tournaments, ...) are registered ABOVE this line.

// Anything that did not match a route above becomes a JSON 404.
app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// The central error handler must be the very last middleware.
app.use(errorHandler);

export default app;
