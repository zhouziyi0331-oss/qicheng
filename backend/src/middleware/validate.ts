import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Express-validator validation middleware
 * Checks for validation errors and returns 400 if any are found
 */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return next(
      new AppError(
        400,
        `${firstError.msg}`,
        'VALIDATION_ERROR',
        errors.array()
      )
    );
  }
  next();
}
