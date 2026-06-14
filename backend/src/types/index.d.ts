import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id?: string;
    userId?: string;  // 兼容旧代码
    role?: 'student' | 'company' | 'admin';
    phone?: string;
    email?: string;
    iat?: number;
    exp?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        userId?: string;  // 兼容旧代码
        role?: 'student' | 'company' | 'admin';
        phone?: string;
        email?: string;
      };
    }
  }
}

export {};
