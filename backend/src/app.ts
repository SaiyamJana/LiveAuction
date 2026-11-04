import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import authRoutes from './routes/auth.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import tournamentRequestRoutes from './routes/tournamentRequest.routes.js';

const app = express();

// Behind a hosting proxy (Render, Railway, ...) the real client IP and HTTPS
// come from X-Forwarded-* headers. Needed for secure cookies and rate limiting.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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
app.use(cookieParser());

// No login and no database query: it only proves the server is running.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tournament-requests', tournamentRequestRoutes);

// Future routes (tournaments, ...) are registered ABOVE this line.

// Anything that did not match a route above becomes a JSON 404.
app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// The central error handler must be the very last middleware.
app.use(errorHandler);

export default app;