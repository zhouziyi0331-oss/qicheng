import { Request, Response, NextFunction } from 'express';

/**
 * 角色检查中间件
 * 确保用户具有指定的角色
 */
export const requireRole = (role: 'student' | 'company' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    if (req.user!.role !== role) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }

    next();
  };
};

/**
 * 多角色检查中间件
 * 允许多个角色访问
 */
export const requireAnyRole = (roles: Array<'student' | 'company' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    if (!roles.includes(req.user!.role as any)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }

    next();
  };
};
