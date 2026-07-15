/**
 * Phase 2.1: OPC身份卡片服务
 *
 * 功能：
 * 1. 生成可分享的身份卡片数据
 * 2. 保存卡片生成记录
 * 3. 支持卡片访问统计
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface IdentityCardData {
  cardId: string;
  studentId: string;
  personalityType: string;
  personalityTypeLabel: string;
  declaration: string;
  strengths: string[];
  level: number;
  completedTasksCount: number;
  daysOnPlatform: number;
  avgScore: number;
  visualTheme: string;
  shareUrl: string;
  createdAt: Date;
}

interface CardGenerationOptions {
  includeStats?: boolean;
  theme?: 'default' | 'minimal' | 'vibrant' | 'elegant';
}

class OPCIdentityCardService {
  /**
   * 生成身份卡片
   */
  async generateCard(
    studentId: string,
    options: CardGenerationOptions = {}
  ): Promise<IdentityCardData> {
    const client = await pool.connect();

    try {
      // 1. 获取学生OPC数据
      const profileResult = await client.query(
        `SELECT
          personality_type,
          declaration,
          three_strengths,
          initial_level,
          created_at
         FROM opc_v2_user_profiles
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [studentId]
      );

      if (profileResult.rows.length === 0) {
        throw new Error('未找到OPC测评结果');
      }

      const profile = profileResult.rows[0];

      // 2. 获取学生基础信息
      const userResult = await client.query(
        `SELECT
          nickname,
          created_at,
          current_level
         FROM users
         WHERE id = $1`,
        [studentId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('学生不存在');
      }

      const user = userResult.rows[0];

      // 3. 获取统计数据（如果需要）
      let stats = {
        completedTasksCount: 0,
        avgScore: 0,
        daysOnPlatform: 0
      };

      if (options.includeStats !== false) {
        // 计算在平台天数
        const now = new Date();
        const joinDate = new Date(user.created_at);
        stats.daysOnPlatform = Math.floor(
          (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // 获取任务统计
        const taskStatsResult = await client.query(
          `SELECT
            COUNT(*) as completed_count,
            COALESCE(AVG(final_score), 0) as avg_score
           FROM task_submissions
           WHERE student_id = $1 AND status = 'approved'`,
          [studentId]
        );

        if (taskStatsResult.rows.length > 0) {
          stats.completedTasksCount = parseInt(taskStatsResult.rows[0].completed_count);
          stats.avgScore = parseFloat(taskStatsResult.rows[0].avg_score);
        }
      }

      // 4. 生成卡片ID和分享URL
      const cardId = uuidv4();
      const shareUrl = `${process.env.FRONTEND_URL || 'https://qicheng.ai'}/identity-card/${cardId}`;

      // 5. 确定视觉主题
      const theme = options.theme || this.selectThemeByPersonality(profile.personality_type);

      // 6. 保存卡片记录
      await client.query(
        `INSERT INTO opc_identity_cards (
          id, student_id, personality_type, declaration, strengths,
          level, completed_tasks_count, days_on_platform, avg_score,
          visual_theme, share_url, view_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0)`,
        [
          cardId,
          studentId,
          profile.personality_type,
          profile.declaration,
          JSON.stringify(profile.three_strengths),
          user.current_level || profile.initial_level,
          stats.completedTasksCount,
          stats.daysOnPlatform,
          stats.avgScore,
          theme,
          shareUrl
        ]
      );

      logger.info('[OPCIdentityCard] 身份卡片生成成功', {
        cardId,
        studentId,
        personalityType: profile.personality_type
      });

      // 7. 返回卡片数据
      return {
        cardId,
        studentId,
        personalityType: profile.personality_type,
        personalityTypeLabel: this.getPersonalityLabel(profile.personality_type),
        declaration: profile.declaration,
        strengths: profile.three_strengths,
        level: user.current_level || profile.initial_level,
        completedTasksCount: stats.completedTasksCount,
        daysOnPlatform: stats.daysOnPlatform,
        avgScore: Math.round(stats.avgScore * 10) / 10,
        visualTheme: theme,
        shareUrl,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('[OPCIdentityCard] 生成卡片失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取卡片详情（用于分享链接访问）
   */
  async getCardById(cardId: string, incrementView: boolean = false): Promise<IdentityCardData | null> {
    const client = await pool.connect();

    try {
      // 增加浏览次数
      if (incrementView) {
        await client.query(
          `UPDATE opc_identity_cards
           SET view_count = view_count + 1,
               last_viewed_at = NOW()
           WHERE id = $1`,
          [cardId]
        );
      }

      // 获取卡片数据
      const result = await client.query(
        `SELECT
          id as card_id,
          student_id,
          personality_type,
          declaration,
          strengths,
          level,
          completed_tasks_count,
          days_on_platform,
          avg_score,
          visual_theme,
          share_url,
          view_count,
          created_at
         FROM opc_identity_cards
         WHERE id = $1`,
        [cardId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const card = result.rows[0];

      return {
        cardId: card.card_id,
        studentId: card.student_id,
        personalityType: card.personality_type,
        personalityTypeLabel: this.getPersonalityLabel(card.personality_type),
        declaration: card.declaration,
        strengths: card.strengths,
        level: card.level,
        completedTasksCount: card.completed_tasks_count,
        daysOnPlatform: card.days_on_platform,
        avgScore: card.avg_score,
        visualTheme: card.visual_theme,
        shareUrl: card.share_url,
        createdAt: card.created_at
      };
    } catch (error) {
      logger.error('[OPCIdentityCard] 获取卡片失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取学生的所有身份卡片
   */
  async getStudentCards(studentId: string, limit: number = 10): Promise<IdentityCardData[]> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          id as card_id,
          student_id,
          personality_type,
          declaration,
          strengths,
          level,
          completed_tasks_count,
          days_on_platform,
          avg_score,
          visual_theme,
          share_url,
          view_count,
          created_at
         FROM opc_identity_cards
         WHERE student_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [studentId, limit]
      );

      return result.rows.map(card => ({
        cardId: card.card_id,
        studentId: card.student_id,
        personalityType: card.personality_type,
        personalityTypeLabel: this.getPersonalityLabel(card.personality_type),
        declaration: card.declaration,
        strengths: card.strengths,
        level: card.level,
        completedTasksCount: card.completed_tasks_count,
        daysOnPlatform: card.days_on_platform,
        avgScore: card.avg_score,
        visualTheme: card.visual_theme,
        shareUrl: card.share_url,
        createdAt: card.created_at
      }));
    } catch (error) {
      logger.error('[OPCIdentityCard] 获取学生卡片列表失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除卡片
   */
  async deleteCard(cardId: string, studentId: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `DELETE FROM opc_identity_cards
         WHERE id = $1 AND student_id = $2`,
        [cardId, studentId]
      );

      return result.rowCount > 0;
    } catch (error) {
      logger.error('[OPCIdentityCard] 删除卡片失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 根据人格类型选择视觉主题
   */
  private selectThemeByPersonality(personalityType: string): string {
    const themeMap: Record<string, string> = {
      visual_storyteller: 'vibrant',
      system_builder: 'elegant',
      creative_executor: 'vibrant',
      data_translator: 'minimal',
      tool_integrator: 'default',
      dialogue_designer: 'elegant'
    };

    return themeMap[personalityType] || 'default';
  }

  /**
   * 获取人格类型中文标签
   */
  private getPersonalityLabel(personalityType: string): string {
    const labels: Record<string, string> = {
      visual_storyteller: '视觉叙事者',
      system_builder: '系统构建者',
      creative_executor: '创意执行者',
      data_translator: '数据翻译官',
      tool_integrator: '工具整合师',
      dialogue_designer: '对话设计师'
    };

    return labels[personalityType] || personalityType;
  }
}

export default new OPCIdentityCardService();
