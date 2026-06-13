import { JwtPayload as OriginalJwtPayload } from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    role: 'student' | 'company' | 'admin';
    phone?: string;
    email?: string;
    iat?: number;
    exp?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
