/**
 * 联系方式交换服务
 *
 * 核心功能：
 * 1. 第3次合作完成后，自动询问双方
 * 2. 双方都同意后，推送联系方式
 * 3. 建立长期合作关系
 */

import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

interface ExchangeRequest {
  id: string;
  studentId: string;
  companyId: string;
  taskId: string;
  studentAgreed: boolean;
  companyAgreed: boolean;
  exchanged: boolean;
  collaborationCount: number;
  createdAt: Date;
}

interface ContactInfo {
  userId: string;
  name: string;
  phone?: string;
  wechat?: string;
  qq?: string;
  email?: string;
}

interface CollaborationStats {
  count: number;
  ratings: Array<{ taskId: string; rating: number; completedAt: Date }>;
  avgRating: number;
}

// =====================================================
// ContactExchangeService 类
// =====================================================

class ContactExchangeService {
  /**
   * 任务完成后检查是否可以交换联系方式
   *
   * 在任务完成时自动调用
   */
  async checkAndPromptExchange(
    studentId: string,
    companyId: string,
    taskId: string
  ): Promise<{ shouldPrompt: boolean; reason?: string }> {
    try {
      // 1. 查询合作次数
      const count = await this.getCollaborationCount(studentId, companyId);
      logger.info(`Collaboration count: ${count} for student ${studentId} and company ${companyId}`);

      // 2. 检查是否已经交换过
      const alreadyExchanged = await this.hasExchanged(studentId, companyId);
      if (alreadyExchanged) {
        return {
          shouldPrompt: false,
          reason: 'Already exchanged contacts',
        };
      }

      // 3. 检查是否已经有pending的请求
      const existingRequest = await this.getExistingRequest(studentId, companyId);
      if (existingRequest) {
        return {
          shouldPrompt: false,
          reason: 'Exchange request already exists',
        };
      }

      // 4. 第3次合作完成，触发询问
      if (count === 3) {
        await this.createExchangeRequest(studentId, companyId, taskId, count);
        await this.promptBothSides(studentId, companyId, taskId);

        return {
          shouldPrompt: true,
        };
      }

      return {
        shouldPrompt: false,
        reason: `Collaboration count is ${count}, need 3`,
      };
    } catch (error: any) {
      logger.error('Failed to check exchange eligibility:', error);
      throw error;
    }
  }

  /**
   * 获取合作次数
   */
  private async getCollaborationCount(studentId: string, companyId: string): Promise<number> {
    const sql = `SELECT get_collaboration_count($1, $2) as count`;
    const result = await queryOne(sql, [studentId, companyId]);
    return result.count || 0;
  }

  /**
   * 检查是否已经交换过
   */
  private async hasExchanged(studentId: string, companyId: string): Promise<boolean> {
    const sql = `
      SELECT exchanged
      FROM contact_exchange_requests
      WHERE student_id = $1 AND company_id = $2
    `;

    const result = await queryOne(sql, [studentId, companyId]);
    return result?.exchanged === true;
  }

  /**
   * 获取现有的交换请求
   */
  private async getExistingRequest(studentId: string, companyId: string): Promise<ExchangeRequest | null> {
    const sql = `
      SELECT *
      FROM contact_exchange_requests
      WHERE student_id = $1 AND company_id = $2
    `;

    const result = await queryOne(sql, [studentId, companyId]);
    return result || null;
  }

  /**
   * 创建交换请求
   */
  private async createExchangeRequest(
    studentId: string,
    companyId: string,
    taskId: string,
    collaborationCount: number
  ): Promise<string> {
    const sql = `
      INSERT INTO contact_exchange_requests (
        student_id, company_id, task_id, collaboration_count
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (student_id, company_id) DO NOTHING
      RETURNING id
    `;

    const result = await queryOne(sql, [studentId, companyId, taskId, collaborationCount]);
    return result?.id as string;
  }

  /**
   * 询问双方是否愿意交换联系方式
   */
  private async promptBothSides(
    studentId: string,
    companyId: string,
    taskId: string
  ): Promise<void> {
    // 获取合作历史统计
    const studentStats = await this.getCollaborationStats(studentId, companyId, 'student');
    const companyStats = await this.getCollaborationStats(studentId, companyId, 'company');

    // 获取用户信息
    const student = await this.getUser(studentId);
    const company = await this.getUser(companyId);

    // 生成询问消息
    const studentMessage = this.generatePromptMessage('student', company.name, studentStats);
    const companyMessage = this.generatePromptMessage('company', student.name, companyStats);

    // 发送询问（这里应该集成通知系统）
    await this.sendPrompt(studentId, studentMessage, taskId);
    await this.sendPrompt(companyId, companyMessage, taskId);

    logger.info(`Sent exchange prompts to student ${studentId} and company ${companyId}`);
  }

  /**
   * 获取合作统计
   */
  private async getCollaborationStats(
    studentId: string,
    companyId: string,
    perspective: 'student' | 'company'
  ): Promise<CollaborationStats> {
    const ratingColumn = perspective === 'student' ? 'student_rating' : 'company_rating';

    const sql = `
      SELECT
        task_id,
        ${ratingColumn} as rating,
        completed_at
      FROM collaboration_history
      WHERE student_id = $1 AND company_id = $2 AND status = 'completed'
      ORDER BY completed_at DESC
    `;

    const results = await query(sql, [studentId, companyId]);

    const ratings = results.map((r: any) => ({
      taskId: r.task_id,
      rating: r.rating || 0,
      completedAt: r.completed_at,
    }));

    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return {
      count: ratings.length,
      ratings,
      avgRating,
    };
  }

  /**
   * 生成询问消息
   */
  private generatePromptMessage(
    role: 'student' | 'company',
    otherPartyName: string,
    stats: CollaborationStats
  ): string {
    const ratingsText = stats.ratings
      .map((r, i) => `- 第${i + 1}次任务：评分 ${r.rating.toFixed(1)}/5.0`)
      .join('\n');

    if (role === 'student') {
      return `恭喜！你和【${otherPartyName}】的第3次合作圆满完成 🎉

我注意到你们合作得很愉快：
${ratingsText}

你们是否愿意建立直接联系？
这样以后可以更方便地沟通。

如果你同意，我会询问企业，
双方都同意后，我会推送联系方式。

【同意】 【暂不需要】`;
    } else {
      return `恭喜！您和【${otherPartyName}】的第3次合作圆满完成 🎉

我注意到你们合作得很愉快：
${ratingsText}

您是否愿意和${otherPartyName}建立直接联系？
这样以后可以更方便地沟通。

如果您同意，我会询问学生，
双方都同意后，我会推送联系方式。

【同意】 【暂不需要】`;
    }
  }

  /**
   * 发送询问（集成通知系统）
   */
  private async sendPrompt(userId: string, message: string, taskId: string): Promise<void> {
    // TODO: 集成通知系统（WebSocket、推送、站内信等）
    logger.info(`Sending exchange prompt to user ${userId}: ${message}`);

    // 这里可以保存到系统消息表
    // await this.saveSystemMessage(userId, message, taskId);
  }

  /**
   * 用户同意交换联系方式
   */
  async agreeToExchange(
    userId: string,
    studentId: string,
    companyId: string
  ): Promise<{ success: boolean; exchanged: boolean; message: string }> {
    try {
      // 1. 获取用户角色
      const user = await this.getUser(userId);

      // 2. 更新同意状态
      const column = user.role === 'student' ? 'student_agreed' : 'company_agreed';
      const timestampColumn = user.role === 'student' ? 'student_agreed_at' : 'company_agreed_at';

      const sql = `
        UPDATE contact_exchange_requests
        SET ${column} = true, ${timestampColumn} = NOW()
        WHERE student_id = $1 AND company_id = $2
        RETURNING student_agreed, company_agreed
      `;

      const result = await queryOne(sql, [studentId, companyId]);

      if (!result) {
        throw new Error('Exchange request not found');
      }

      // 3. 检查双方是否都同意
      if (result.student_agreed && result.company_agreed) {
        // 双方都同意，执行交换
        await this.executeExchange(studentId, companyId);

        return {
          success: true,
          exchanged: true,
          message: '双方都同意了，联系方式已推送！',
        };
      } else {
        return {
          success: true,
          exchanged: false,
          message: '已记录你的同意，等待对方回复...',
        };
      }
    } catch (error: any) {
      logger.error('Failed to agree to exchange:', error);
      throw error;
    }
  }

  /**
   * 执行联系方式交换
   */
  private async executeExchange(studentId: string, companyId: string): Promise<void> {
    try {
      // 1. 获取双方联系方式
      const studentContact = await this.getContactInfo(studentId);
      const companyContact = await this.getContactInfo(companyId);

      // 2. 推送给对方
      await this.pushContactInfo(studentId, companyContact, 'company');
      await this.pushContactInfo(companyId, studentContact, 'student');

      // 3. 标记为已交换
      const sql = `
        UPDATE contact_exchange_requests
        SET exchanged = true, exchanged_at = NOW()
        WHERE student_id = $1 AND company_id = $2
      `;

      await query(sql, [studentId, companyId]);

      logger.info(`Successfully exchanged contacts between ${studentId} and ${companyId}`);
    } catch (error: any) {
      logger.error('Failed to execute exchange:', error);
      throw error;
    }
  }

  /**
   * 获取联系方式
   */
  private async getContactInfo(userId: string): Promise<ContactInfo> {
    const sql = `
      SELECT id, name, phone, wechat, qq, contact_email as email
      FROM users
      WHERE id = $1
    `;

    const user = await queryOne(sql, [userId]);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      userId: user.id as string,
      name: user.name as string,
      phone: user.phone as string | undefined,
      wechat: user.wechat as string | undefined,
      qq: user.qq as string | undefined,
      email: user.email as string | undefined,
    };
  }

  /**
   * 推送联系方式
   */
  private async pushContactInfo(
    toUserId: string,
    contactInfo: ContactInfo,
    contactType: 'student' | 'company'
  ): Promise<void> {
    const message = this.generateContactMessage(contactInfo, contactType);

    // TODO: 集成通知系统
    logger.info(`Pushing contact info to user ${toUserId}: ${message}`);

    // 这里可以保存到系统消息表
    // await this.saveSystemMessage(toUserId, message);
  }

  /**
   * 生成联系方式推送消息
   */
  private generateContactMessage(contactInfo: ContactInfo, contactType: 'student' | 'company'): string {
    const typeText = contactType === 'student' ? '学生' : '企业';

    let contactDetails = `- 姓名：${contactInfo.name}\n`;

    if (contactInfo.phone) {
      const maskedPhone = this.maskPhone(contactInfo.phone);
      contactDetails += `- 手机：${maskedPhone}（点击查看完整号码）\n`;
    }

    if (contactInfo.wechat) {
      contactDetails += `- 微信：${contactInfo.wechat}（点击复制）\n`;
    }

    if (contactInfo.qq) {
      contactDetails += `- QQ：${contactInfo.qq}（点击复制）\n`;
    }

    if (contactInfo.email) {
      contactDetails += `- 邮箱：${contactInfo.email}\n`;
    }

    return `好消息！【${contactInfo.name}】也同意建立直接联系 🎉

${typeText}联系方式：
${contactDetails}

温馨提示：
- 以后你们可以直接沟通了
- 但建议重要事项还是在平台留记录
- 这样有问题时平台可以帮忙协调`;
  }

  /**
   * 脱敏手机号
   */
  private maskPhone(phone: string): string {
    if (phone.length === 11) {
      return phone.substring(0, 3) + '****' + phone.substring(7);
    }
    return phone;
  }

  /**
   * 获取用户信息
   */
  private async getUser(userId: string): Promise<{ id: string; name: string; role: string }> {
    const sql = `SELECT id, name, role FROM users WHERE id = $1`;
    const user = await queryOne(sql, [userId]);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return user;
  }

  /**
   * 获取交换请求状态
   */
  async getExchangeStatus(
    studentId: string,
    companyId: string
  ): Promise<ExchangeRequest | null> {
    const sql = `
      SELECT *
      FROM contact_exchange_requests
      WHERE student_id = $1 AND company_id = $2
    `;

    const result = await queryOne(sql, [studentId, companyId]);
    return result || null;
  }

  /**
   * 检查是否可以交换联系方式
   */
  async canExchange(studentId: string, companyId: string): Promise<boolean> {
    const sql = `SELECT can_exchange_contacts($1, $2) as can_exchange`;
    const result = await queryOne(sql, [studentId, companyId]);
    return result.can_exchange === true;
  }
}

// =====================================================
// 导出单例
// =====================================================

export const contactExchangeService = new ContactExchangeService();
