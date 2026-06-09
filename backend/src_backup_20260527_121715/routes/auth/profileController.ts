import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

// ============================================================
// POST /auth/complete-profile
// 完善用户资料
// ============================================================
export async function completeProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userType = req.user!.role; // 'student' or 'company'

    if (userType === 'student') {
      // 学生完善资料
      const { nickname, avatarUrl, bio, university, major, grade, city } = req.body;

      if (!nickname) {
        throw new AppError(400, '昵称不能为空', 'NICKNAME_REQUIRED');
      }

      // 更新用户基本信息（所有字段都在users表中）
      await query(
        `UPDATE users SET
          nickname = $1,
          avatar_url = $2,
          bio = $3,
          university = $4,
          major = $5,
          grade = $6,
          city = $7,
          profile_completed = TRUE,
          profile_completed_at = NOW()
         WHERE id = $8`,
        [nickname, avatarUrl || null, bio || null, university || null, major || null, grade || null, city || null, userId]
      );

      logger.info('Student profile completed', { userId, nickname });

      res.json({
        success: true,
        message: '资料完善成功',
        data: {
          profileCompleted: true,
          nextStep: 'onboarding' // 学生进入引导流程
        }
      });

    } else if (userType === 'company') {
      // 企业完善资料
      const { nickname, avatarUrl, bio, companyName, contactName, industry, companySize } = req.body;

      if (!nickname || !companyName || !contactName) {
        throw new AppError(400, '昵称、企业名称和联系人姓名不能为空', 'REQUIRED_FIELDS_MISSING');
      }

      // 更新用户基本信息
      await query(
        `UPDATE users SET
          nickname = $1,
          avatar_url = $2,
          bio = $3,
          profile_completed = TRUE,
          profile_completed_at = NOW()
         WHERE id = $4`,
        [nickname, avatarUrl || null, bio || null, userId]
      );

      // 更新企业档案
      await query(
        `UPDATE company_profiles SET
          company_name = $1,
          contact_name = $2,
          industry = $3,
          company_size = $4
         WHERE user_id = $5`,
        [companyName, contactName, industry || null, companySize || null, userId]
      );

      logger.info('Company profile completed', { userId, companyName });

      res.json({
        success: true,
        message: '资料完善成功，等待审核',
        data: {
          profileCompleted: true,
          nextStep: 'pending_review' // 企业需要等待审核
        }
      });

    } else {
      throw new AppError(400, '无效的用户类型', 'INVALID_USER_TYPE');
    }

  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /auth/profile-status
// 获取资料完善状态
// ============================================================
export async function getProfileStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await queryOne<{
      profile_completed: boolean;
      nickname: string;
      avatar_url: string;
      bio: string;
      university: string;
      major: string;
      grade: string;
      city: string;
      role: string;
    }>(
      `SELECT profile_completed, nickname, avatar_url, bio, university, major, grade, city, role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!user) {
      throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        profileCompleted: user.profile_completed || false,
        userType: user.role,
        profile: {
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          university: user.university,
          major: user.major,
          grade: user.grade,
          city: user.city
        }
      }
    });

  } catch (err) {
    next(err);
  }
}
