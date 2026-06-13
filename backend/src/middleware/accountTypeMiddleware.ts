/**
 * 账号类型校验中间件
 * 确保学生端和企业端接口的访问隔离
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * 校验学生账号
 * 用于 /api/v1/student/* 路径
 */
export function requireStudentAccount(req: Request, res: Response, next: NextFunction) {
  const accountType = req.user?.accountType;

  if (!accountType) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '未提供认证令牌'
    });
  }

  if (accountType !== 'student') {
    logger.warn('Enterprise account attempted to access student endpoint', {
      userId: req.user?.userId,
      path: req.path
    });

    return res.status(403).json({
      success: false,
      code: 'WRONG_ACCOUNT_TYPE',
      message: '该接口仅限学生账号访问，请使用学生端登录'
    });
  }

  next();
}

/**
 * 校验企业账号
 * 用于 /api/v1/enterprise/* 路径
 */
export function requireEnterpriseAccount(req: Request, res: Response, next: NextFunction) {
  const accountType = req.user?.accountType;

  if (!accountType) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '未提供认证令牌'
    });
  }

  if (accountType !== 'enterprise') {
    logger.warn('Student account attempted to access enterprise endpoint', {
      userId: req.user?.userId,
      path: req.path
    });

    return res.status(403).json({
      success: false,
      code: 'WRONG_ACCOUNT_TYPE',
      message: '该接口仅限企业账号访问，请使用企业端登录'
    });
  }

  next();
}

/**
 * 校验赛道选择状态
 * 确保学生已选择赛道后才能访问某些功能
 */
export function requireTrackSelected(req: Request, res: Response, next: NextFunction) {
  const selectedTrack = req.user?.selectedTrack;

  if (!selectedTrack) {
    return res.status(403).json({
      success: false,
      code: 'TRACK_NOT_SELECTED',
      message: '请先选择您的赛道',
      redirectTo: '/track-selection'
    });
  }

  next();
}
