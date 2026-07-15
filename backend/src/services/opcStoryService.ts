/**
 * Phase 3.2: OPC故事墙服务
 * 让学生分享自己的OPC发现故事，看到"原来还可以这样"
 */

import { pool } from '../config/database';
import logger from '../utils/logger';

export interface OpcStory {
  id: string;
  studentId: string;
  studentName?: string;
  personalityType: string;
  title: string;
  storyContent: string;
  storyType: 'discovery' | 'breakthrough' | 'acceptance' | 'growth';
  emotionTags: string[];
  lifeQuestion?: string;
  beforeState?: string;
  afterState?: string;
  keyMoment?: string;
  reflection?: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isFeatured: boolean;
  createdAt: Date;
  publishedAt?: Date;
}

export interface StoryFilter {
  personalityType?: string;
  storyType?: 'discovery' | 'breakthrough' | 'acceptance' | 'growth';
  emotionTags?: string[];
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StoryStats {
  totalStories: number;
  byType: Record<string, number>;
  byPersonality: Record<string, number>;
  popularTags: Array<{ tag: string; count: number }>;
}

class OpcStoryService {
  /**
   * 创建故事
   */
  async createStory(params: {
    studentId: string;
    title: string;
    storyContent: string;
    storyType: 'discovery' | 'breakthrough' | 'acceptance' | 'growth';
    emotionTags?: string[];
    lifeQuestion?: string;
    beforeState?: string;
    afterState?: string;
    keyMoment?: string;
    reflection?: string;
  }): Promise<{ success: boolean; storyId?: string; message: string }> {
    const client = await pool.connect();
    try {
      // 获取学生的OPC人格类型
      const opcResult = await client.query(`
        SELECT personality_type
        FROM opc_test_results
        WHERE student_id = $1 AND test_version = 'v2'
        ORDER BY created_at DESC
        LIMIT 1
      `, [params.studentId]);

      if (opcResult.rows.length === 0) {
        return {
          success: false,
          message: '请先完成OPC测评'
        };
      }

      const personalityType = opcResult.rows[0].personality_type;
      const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 创建故事（待审核状态）
      await client.query(`
        INSERT INTO opc_stories (
          id, student_id, personality_type, title, story_content,
          story_type, emotion_tags, life_question, before_state,
          after_state, key_moment, reflection, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
      `, [
        storyId,
        params.studentId,
        personalityType,
        params.title,
        params.storyContent,
        params.storyType,
        params.emotionTags || [],
        params.lifeQuestion,
        params.beforeState,
        params.afterState,
        params.keyMoment,
        params.reflection
      ]);

      // 添加标签关联
      if (params.emotionTags && params.emotionTags.length > 0) {
        for (const tag of params.emotionTags) {
          await client.query(`
            INSERT INTO opc_story_tag_relations (story_id, tag)
            VALUES ($1, $2)
            ON CONFLICT (story_id, tag) DO NOTHING
          `, [storyId, tag]);
        }
      }

      logger.info('[OpcStory] 创建故事', { storyId, studentId: params.studentId });

      return {
        success: true,
        storyId,
        message: '故事已提交，等待审核'
      };
    } finally {
      client.release();
    }
  }

  /**
   * 搜索/浏览故事
   */
  async searchStories(filter: StoryFilter): Promise<{ stories: OpcStory[]; total: number }> {
    const client = await pool.connect();
    try {
      let whereConditions: string[] = ["status = 'published'"];
      let params: any[] = [];
      let paramIndex = 1;

      if (filter.personalityType) {
        whereConditions.push(`personality_type = $${paramIndex}`);
        params.push(filter.personalityType);
        paramIndex++;
      }

      if (filter.storyType) {
        whereConditions.push(`story_type = $${paramIndex}`);
        params.push(filter.storyType);
        paramIndex++;
      }

      if (filter.emotionTags && filter.emotionTags.length > 0) {
        whereConditions.push(`emotion_tags && $${paramIndex}`);
        params.push(filter.emotionTags);
        paramIndex++;
      }

      if (filter.featured) {
        whereConditions.push('is_featured = true');
      }

      if (filter.search) {
        whereConditions.push(`(
          to_tsvector('chinese', title || ' ' || story_content) @@ plainto_tsquery('chinese', $${paramIndex})
        )`);
        params.push(filter.search);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM opc_stories WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // 获取故事列表
      const limit = filter.limit || 20;
      const offset = filter.offset || 0;

      const result = await client.query(`
        SELECT
          s.id, s.student_id, u.name as student_name,
          s.personality_type, s.title, s.story_content, s.story_type,
          s.emotion_tags, s.life_question, s.before_state, s.after_state,
          s.key_moment, s.reflection, s.status, s.view_count,
          s.like_count, s.comment_count, s.share_count, s.is_featured,
          s.created_at, s.published_at
        FROM opc_stories s
        LEFT JOIN users u ON s.student_id = u.user_id
        WHERE ${whereClause}
        ORDER BY
          CASE WHEN s.is_featured THEN 0 ELSE 1 END,
          s.like_count DESC,
          s.published_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      const stories = result.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        personalityType: row.personality_type,
        title: row.title,
        storyContent: row.story_content,
        storyType: row.story_type,
        emotionTags: row.emotion_tags || [],
        lifeQuestion: row.life_question,
        beforeState: row.before_state,
        afterState: row.after_state,
        keyMoment: row.key_moment,
        reflection: row.reflection,
        status: row.status,
        viewCount: row.view_count || 0,
        likeCount: row.like_count || 0,
        commentCount: row.comment_count || 0,
        shareCount: row.share_count || 0,
        isFeatured: row.is_featured || false,
        createdAt: row.created_at,
        publishedAt: row.published_at
      }));

      return { stories, total };
    } finally {
      client.release();
    }
  }

  /**
   * 获取故事详情
   */
  async getStoryById(storyId: string, viewerId?: string): Promise<OpcStory | null> {
    const client = await pool.connect();
    try {
      // 增加浏览次数
      await client.query(`
        UPDATE opc_stories
        SET view_count = view_count + 1
        WHERE id = $1
      `, [storyId]);

      // 获取故事详情
      const result = await client.query(`
        SELECT
          s.id, s.student_id, u.name as student_name,
          s.personality_type, s.title, s.story_content, s.story_type,
          s.emotion_tags, s.life_question, s.before_state, s.after_state,
          s.key_moment, s.reflection, s.status, s.view_count,
          s.like_count, s.comment_count, s.share_count, s.is_featured,
          s.created_at, s.published_at
        FROM opc_stories s
        LEFT JOIN users u ON s.student_id = u.user_id
        WHERE s.id = $1
      `, [storyId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        personalityType: row.personality_type,
        title: row.title,
        storyContent: row.story_content,
        storyType: row.story_type,
        emotionTags: row.emotion_tags || [],
        lifeQuestion: row.life_question,
        beforeState: row.before_state,
        afterState: row.after_state,
        keyMoment: row.key_moment,
        reflection: row.reflection,
        status: row.status,
        viewCount: row.view_count || 0,
        likeCount: row.like_count || 0,
        commentCount: row.comment_count || 0,
        shareCount: row.share_count || 0,
        isFeatured: row.is_featured || false,
        createdAt: row.created_at,
        publishedAt: row.published_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * 点赞故事
   */
  async likeStory(storyId: string, studentId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 检查是否已点赞
      const checkResult = await client.query(`
        SELECT 1 FROM opc_story_likes
        WHERE story_id = $1 AND student_id = $2
      `, [storyId, studentId]);

      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return false; // 已经点赞过
      }

      // 添加点赞记录
      await client.query(`
        INSERT INTO opc_story_likes (story_id, student_id)
        VALUES ($1, $2)
      `, [storyId, studentId]);

      // 更新故事点赞数
      await client.query(`
        UPDATE opc_stories
        SET like_count = like_count + 1
        WHERE id = $1
      `, [storyId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 标记共鸣
   */
  async markResonance(params: {
    storyId: string;
    studentId: string;
    resonanceType: 'similar_experience' | 'same_feeling' | 'inspired';
    note?: string;
  }): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO opc_story_resonances (story_id, student_id, resonance_type, note)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (story_id, student_id, resonance_type) DO NOTHING
      `, [params.storyId, params.studentId, params.resonanceType, params.note]);

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * 获取故事统计
   */
  async getStoryStats(): Promise<StoryStats> {
    const client = await pool.connect();
    try {
      // 总数和类型分布
      const typeStats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE story_type = 'discovery') as discovery_count,
          COUNT(*) FILTER (WHERE story_type = 'breakthrough') as breakthrough_count,
          COUNT(*) FILTER (WHERE story_type = 'acceptance') as acceptance_count,
          COUNT(*) FILTER (WHERE story_type = 'growth') as growth_count
        FROM opc_stories
        WHERE status = 'published'
      `);

      const typeRow = typeStats.rows[0];

      // 按人格类型分布
      const personalityStats = await client.query(`
        SELECT personality_type, COUNT(*) as count
        FROM opc_stories
        WHERE status = 'published'
        GROUP BY personality_type
        ORDER BY count DESC
      `);

      // 热门标签
      const tagStats = await client.query(`
        SELECT tag, COUNT(*) as count
        FROM opc_story_tag_relations
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `);

      return {
        totalStories: parseInt(typeRow.total),
        byType: {
          discovery: parseInt(typeRow.discovery_count),
          breakthrough: parseInt(typeRow.breakthrough_count),
          acceptance: parseInt(typeRow.acceptance_count),
          growth: parseInt(typeRow.growth_count)
        },
        byPersonality: personalityStats.rows.reduce((acc, row) => {
          acc[row.personality_type] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
        popularTags: tagStats.rows.map(r => ({
          tag: r.tag,
          count: parseInt(r.count)
        }))
      };
    } finally {
      client.release();
    }
  }

  /**
   * 推荐相似故事（基于OPC类型和情绪标签）
   */
  async recommendSimilarStories(storyId: string, limit: number = 5): Promise<OpcStory[]> {
    const client = await pool.connect();
    try {
      // 获取当前故事信息
      const currentStory = await client.query(`
        SELECT personality_type, emotion_tags, story_type
        FROM opc_stories
        WHERE id = $1
      `, [storyId]);

      if (currentStory.rows.length === 0) return [];

      const { personality_type, emotion_tags, story_type } = currentStory.rows[0];

      // 查找相似故事
      const result = await client.query(`
        SELECT
          s.id, s.student_id, u.name as student_name,
          s.personality_type, s.title, s.story_content, s.story_type,
          s.emotion_tags, s.life_question, s.view_count,
          s.like_count, s.comment_count, s.is_featured,
          s.created_at, s.published_at,
          (
            CASE WHEN s.personality_type = $2 THEN 3 ELSE 0 END +
            CASE WHEN s.story_type = $3 THEN 2 ELSE 0 END +
            CASE WHEN s.emotion_tags && $4 THEN 1 ELSE 0 END
          ) as similarity_score
        FROM opc_stories s
        LEFT JOIN users u ON s.student_id = u.user_id
        WHERE s.id != $1
          AND s.status = 'published'
        ORDER BY similarity_score DESC, s.like_count DESC
        LIMIT $5
      `, [storyId, personality_type, story_type, emotion_tags || [], limit]);

      return result.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        personalityType: row.personality_type,
        title: row.title,
        storyContent: row.story_content,
        storyType: row.story_type,
        emotionTags: row.emotion_tags || [],
        lifeQuestion: row.life_question,
        status: 'published' as const,
        viewCount: row.view_count || 0,
        likeCount: row.like_count || 0,
        commentCount: row.comment_count || 0,
        shareCount: 0,
        isFeatured: row.is_featured || false,
        createdAt: row.created_at,
        publishedAt: row.published_at
      }));
    } finally {
      client.release();
    }
  }
}

export default new OpcStoryService();
