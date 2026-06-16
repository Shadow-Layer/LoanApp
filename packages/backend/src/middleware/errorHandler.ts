import { NextFunction, Request, Response } from 'express';
import { AuthError, ForbiddenError } from './auth';

export class WorkflowError extends Error {
  statusCode = 400;
}

export class NotFoundError extends Error {
  statusCode = 404;
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const err = error instanceof Error ? error : new Error('Internal Server Error');
  console.error(err);

  const statusCode =
    error instanceof WorkflowError
      ? 400
      : error instanceof NotFoundError
        ? 404
        : error instanceof AuthError
          ? 401
          : error instanceof ForbiddenError
            ? 403
            : (err as Error & { statusCode?: number }).statusCode || 500;

  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
}
