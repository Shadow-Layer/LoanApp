import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '@loanap/shared';
import { config } from '../config/env';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export class AuthError extends Error {
  statusCode = 401;
}

export class ForbiddenError extends Error {
  statusCode = 403;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AuthError('Unauthorized'));
    return;
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = jwt.verify(token, config.jwtSecret) as JwtPayload;
    next();
  } catch {
    next(new AuthError('Unauthorized'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthError('Unauthorized'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Forbidden'));
      return;
    }
    next();
  };
}
