import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

/**
 * 用户个人资料控制器
 *
 * 功能：
 * 1. 获取个人资料
 * 2. 更新昵称
 * 3. 更新头像
 * 4. 更新完整资料
 * 5. 绑定手机号
 */

// ============================================
// GET /user/profile
// 获取当前用户资料
// ============================================
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    const user = await queryOne(
      `SELECT
        u.id, u.role, u.user_type, u.phone, u.nickname, u.avatar,
        u.wechat_openid, u.created_at, u.last_login_at
      FROM users u
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );

    if (!user) {
      throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
    }

    // 根据用户类型获取额外信息
    let profileData: any = { ...user };

    if (user.user_type === 'student') {
      const studentProfile = await queryOne(
        `SELECT
          sp.real_name, sp.gender, sp.birth_date, sp.university, sp.major,
          sp.grade, sp.student_id, sp.id_card, sp.bio,
          sb.balance, sb.frozen_balance, sb.total_earned
        FROM student_profiles sp
        LEFT JOIN student_balances sb ON sp.user_id = sb.user_id
        WHERE sp.user_id = $1`,
        [userId]
      );
      profileData.studentProfile = studentProfile;
    } else if (user.user_type === 'company') {
      const companyProfile = await queryOne(
        `SELECT
          company_name, contact_name, contact_phone, industry, company_size,
          business_license, verification_status, credit_code
        FROM company_profiles
        WHERE user_id = $1`,
        [userId]
      );
      profileData.companyProfile = companyProfile;
    }

    res.json({
      success: true,
      data: profileData,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// PUT /user/profile/nickname
// 更新昵称
// ============================================
export async function updateNickname(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { nickname } = req.body;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    if (!nickname || nickname.trim().length === 0) {
      throw new AppError(400, '昵称不能为空', 'INVALID_NICKNAME');
    }

    if (nickname.length > 20) {
      throw new AppError(400, '昵称不能超过20个字符', 'NICKNAME_TOO_LONG');
    }

    // 检查昵称是否包含敏感词（简单示例）
    const sensitiveWords = ['管理员', 'admin', '客服', '官方'];
    if (sensitiveWords.some(word => nickname.toLowerCase().includes(word))) {
      throw new AppError(400, '昵称包含敏感词', 'SENSITIVE_NICKNAME');
    }

    await query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname.trim(), userId]);

    logger.info('User nickname updated', { userId, nickname });

    res.json({
      success: true,
      message: '昵称更新成功',
      data: { nickname: nickname.trim() },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// PUT /user/profile/avatar
// 更新头像
// ============================================
export async function updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { avatar } = req.body;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    if (!avatar || !avatar.startsWith('http')) {
      throw new AppError(400, '请提供有效的头像URL', 'INVALID_AVATAR');
    }

    await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, userId]);

    logger.info('User avatar updated', { userId });

    res.json({
      success: true,
      message: '头像更新成功',
      data: { avatar },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// PUT /user/profile
// 更新完整资料
// ============================================
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { nickname, avatar, studentProfile, companyProfile } = req.body;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    const user = await queryOne<{ user_type: string }>(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
    }

    // 更新基本信息
    if (nickname || avatar) {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (nickname) {
        if (nickname.length > 20) {
          throw new AppError(400, '昵称不能超过20个字符', 'NICKNAME_TOO_LONG');
        }
        updates.push(`nickname = $${paramIndex++}`);
        values.push(nickname.trim());
      }

      if (avatar) {
        if (!avatar.startsWith('http')) {
          throw new AppError(400, '请提供有效的头像URL', 'INVALID_AVATAR');
        }
        updates.push(`avatar = $${paramIndex++}`);
        values.push(avatar);
      }

      if (updates.length > 0) {
        values.push(userId);
        await query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    }

    // 更新学生资料
    if (user.user_type === 'student' && studentProfile) {
      const {
        real_name,
        gender,
        birth_date,
        university,
        major,
        grade,
        student_id,
        id_card,
        bio,
      } = studentProfile;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (real_name !== undefined) {
        updates.push(`real_name = $${paramIndex++}`);
        values.push(real_name);
      }
      if (gender !== undefined) {
        updates.push(`gender = $${paramIndex++}`);
        values.push(gender);
      }
      if (birth_date !== undefined) {
        updates.push(`birth_date = $${paramIndex++}`);
        values.push(birth_date);
      }
      if (university !== undefined) {
        updates.push(`university = $${paramIndex++}`);
        values.push(university);
      }
      if (major !== undefined) {
        updates.push(`major = $${paramIndex++}`);
        values.push(major);
      }
      if (grade !== undefined) {
        updates.push(`grade = $${paramIndex++}`);
        values.push(grade);
      }
      if (student_id !== undefined) {
        updates.push(`student_id = $${paramIndex++}`);
        values.push(student_id);
      }
      if (id_card !== undefined) {
        updates.push(`id_card = $${paramIndex++}`);
        values.push(id_card);
      }
      if (bio !== undefined) {
        updates.push(`bio = $${paramIndex++}`);
        values.push(bio);
      }

      if (updates.length > 0) {
        values.push(userId);
        await query(
          `UPDATE student_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      }
    }

    // 更新企业资料
    if (user.user_type === 'company' && companyProfile) {
      const {
        company_name,
        contact_name,
        contact_phone,
        industry,
        company_size,
        business_license,
        credit_code,
      } = companyProfile;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (company_name !== undefined) {
        updates.push(`company_name = $${paramIndex++}`);
        values.push(company_name);
      }
      if (contact_name !== undefined) {
        updates.push(`contact_name = $${paramIndex++}`);
        values.push(contact_name);
      }
      if (contact_phone !== undefined) {
        updates.push(`contact_phone = $${paramIndex++}`);
        values.push(contact_phone);
      }
      if (industry !== undefined) {
        updates.push(`industry = $${paramIndex++}`);
        values.push(industry);
      }
      if (company_size !== undefined) {
        updates.push(`company_size = $${paramIndex++}`);
        values.push(company_size);
      }
      if (business_license !== undefined) {
        updates.push(`business_license = $${paramIndex++}`);
        values.push(business_license);
      }
      if (credit_code !== undefined) {
        updates.push(`credit_code = $${paramIndex++}`);
        values.push(credit_code);
      }

      if (updates.length > 0) {
        values.push(userId);
        await query(
          `UPDATE company_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      }
    }

    logger.info('User profile updated', { userId });

    res.json({
      success: true,
      message: '资料更新成功',
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// POST /user/profile/upload-avatar
// 上传头像（返回上传URL或直接处理上传）
// ============================================
export async function getAvatarUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    // TODO: 集成云存储服务（阿里云OSS、腾讯云COS等）
    // 这里返回一个临时上传URL
    const uploadUrl = `https://your-cdn.com/upload/avatar/${userId}/${Date.now()}`;
    const cdnUrl = `https://your-cdn.com/avatars/${userId}/${Date.now()}.jpg`;

    res.json({
      success: true,
      data: {
        uploadUrl, // 前端使用这个URL上传图片
        cdnUrl, // 上传成功后使用这个URL更新头像
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// POST /user/bind-phone
// 绑定手机号
// ============================================
export async function bindPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { phone, code } = req.body;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    if (!phone || !code) {
      throw new AppError(400, '手机号和验证码不能为空', 'INVALID_INPUT');
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new AppError(400, '手机号格式不正确', 'INVALID_PHONE');
    }

    // TODO: 验证验证码（从Redis中获取并验证）
    // 这里简化处理，实际应该验证验证码是否正确
    logger.info('Binding phone', { userId, phone, code });

    // 检查手机号是否已被其他用户绑定
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE phone = $1 AND id != $2 AND deleted_at IS NULL',
      [phone, userId]
    );

    if (existingUser) {
      throw new AppError(400, '该手机号已被其他用户绑定', 'PHONE_ALREADY_BOUND');
    }

    // 更新用户手机号
    await query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);

    logger.info('Phone bound successfully', { userId, phone });

    res.json({
      success: true,
      message: '手机号绑定成功',
      data: { phone },
    });
  } catch (err) {
    next(err);
  }
}
