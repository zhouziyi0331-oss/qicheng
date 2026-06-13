import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface Portfolio {
  id?: string;
  student_id: string;
  title: string;
  description: string;
  category: string;
  tech_stack: string[];
  cover_image?: string;
  images?: string[];
  video_url?: string;
  demo_url?: string;
  github_url?: string;
  role?: string;
  duration_days?: number;
  highlights?: string[];
  challenges_overcome?: string;
  related_task_id?: string;
  is_from_platform?: boolean;
  is_public?: boolean;
  display_order?: number;
}

interface PortfolioFilter {
  studentId?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * E-06: 学生作品集服务
 * 管理学生作品集的增删改查、浏览记录、点赞等功能
 */
class PortfolioService {
  /**
   * 创建作品集
   */
  async createPortfolio(data: Portfolio): Promise<any> {
    const {
      student_id,
      title,
      description,
      category,
      tech_stack,
      cover_image,
      images,
      video_url,
      demo_url,
      github_url,
      role,
      duration_days,
      highlights,
      challenges_overcome,
      related_task_id,
      is_from_platform,
      is_public,
      display_order,
    } = data;

    const result = await pool.query(
      `INSERT INTO student_portfolios
       (id, student_id, title, description, category, tech_stack,
        cover_image, images, video_url, demo_url, github_url,
        role, duration_days, highlights, challenges_overcome,
        related_task_id, is_from_platform, is_public, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        uuidv4(),
        student_id,
        title,
        description,
        category,
        tech_stack || [],
        cover_image,
        images || [],
        video_url,
        demo_url,
        github_url,
        role,
        duration_days,
        highlights || [],
        challenges_overcome,
        related_task_id,
        is_from_platform || false,
        is_public !== undefined ? is_public : true,
        display_order || 0,
        is_from_platform ? 'approved' : 'pending',
      ]
    );

    return result.rows[0];
  }

  /**
   * 获取作品集列表
   */
  async getPortfolios(filter: PortfolioFilter): Promise<any[]> {
    const { studentId, category, tags, isPublic, status, limit = 20, offset = 0 } = filter;

    let query = `
      SELECT p.*,
             u.username as student_name,
             u.avatar as student_avatar,
             u.student_level as student_level,
             (SELECT COUNT(*) FROM portfolio_likes WHERE portfolio_id = p.id) as like_count,
             (SELECT COUNT(*) FROM portfolio_views WHERE portfolio_id = p.id) as view_count
      FROM student_portfolios p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (studentId) {
      query += ` AND p.student_id = $${paramIndex++}`;
      params.push(studentId);
    }

    if (category) {
      query += ` AND p.category = $${paramIndex++}`;
      params.push(category);
    }

    if (isPublic !== undefined) {
      query += ` AND p.is_public = $${paramIndex++}`;
      params.push(isPublic);
    }

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (tags && tags.length > 0) {
      query += ` AND p.id IN (
        SELECT portfolio_id FROM portfolio_tags WHERE tag_name = ANY($${paramIndex++})
      )`;
      params.push(tags);
    }

    query += ` ORDER BY p.display_order DESC, p.created_at DESC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 获取每个作品的标签
    const portfoliosWithTags = await Promise.all(
      result.rows.map(async (portfolio) => {
        const tagsResult = await pool.query(
          `SELECT tag_name FROM portfolio_tags WHERE portfolio_id = $1`,
          [portfolio.id]
        );
        return {
          ...portfolio,
          tags: tagsResult.rows.map((t) => t.tag_name),
        };
      })
    );

    return portfoliosWithTags;
  }

  /**
   * 获取单个作品集详情
   */
  async getPortfolioById(portfolioId: string, viewerId?: string): Promise<any> {
    const result = await pool.query(
      `SELECT p.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level as student_level,
              u.bio as student_bio
       FROM student_portfolios p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.id = $1`,
      [portfolioId]
    );

    if (result.rows.length === 0) {
      throw new Error('作品集不存在');
    }

    const portfolio = result.rows[0];

    // 获取标签
    const tagsResult = await pool.query(
      `SELECT tag_name FROM portfolio_tags WHERE portfolio_id = $1`,
      [portfolioId]
    );
    portfolio.tags = tagsResult.rows.map((t) => t.tag_name);

    // 获取关联任务信息
    if (portfolio.related_task_id) {
      const taskResult = await pool.query(
        `SELECT id, title, budget, client_rating, completion_rate
         FROM tasks WHERE id = $1`,
        [portfolio.related_task_id]
      );
      if (taskResult.rows.length > 0) {
        portfolio.related_task = taskResult.rows[0];
      }
    }

    // 检查当前用户是否点赞
    if (viewerId) {
      const likeResult = await pool.query(
        `SELECT id FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2`,
        [portfolioId, viewerId]
      );
      portfolio.is_liked = likeResult.rows.length > 0;
    }

    return portfolio;
  }

  /**
   * 更新作品集
   */
  async updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<any> {
    const allowedFields = [
      'title',
      'description',
      'category',
      'tech_stack',
      'cover_image',
      'images',
      'video_url',
      'demo_url',
      'github_url',
      'role',
      'duration_days',
      'highlights',
      'challenges_overcome',
      'is_public',
      'display_order',
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有可更新的字段');
    }

    fields.push(`updated_at = NOW()`);
    values.push(portfolioId);

    const query = `
      UPDATE student_portfolios
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('作品集不存在');
    }

    return result.rows[0];
  }

  /**
   * 删除作品集
   */
  async deletePortfolio(portfolioId: string, studentId: string): Promise<void> {
    // 验证所有权
    const checkResult = await pool.query(
      `SELECT student_id FROM student_portfolios WHERE id = $1`,
      [portfolioId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('作品集不存在');
    }

    if (checkResult.rows[0].student_id !== studentId) {
      throw new Error('无权删除该作品集');
    }

    // 删除关联数据
    await pool.query(`DELETE FROM portfolio_tags WHERE portfolio_id = $1`, [portfolioId]);
    await pool.query(`DELETE FROM portfolio_likes WHERE portfolio_id = $1`, [portfolioId]);
    await pool.query(`DELETE FROM portfolio_views WHERE portfolio_id = $1`, [portfolioId]);

    // 删除作品集
    await pool.query(`DELETE FROM student_portfolios WHERE id = $1`, [portfolioId]);
  }

  /**
   * 记录浏览
   */
  async recordView(portfolioId: string, viewerId?: string, viewerRole?: string): Promise<void> {
    await pool.query(
      `INSERT INTO portfolio_views (id, portfolio_id, viewer_id, viewer_role)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), portfolioId, viewerId, viewerRole]
    );
  }

  /**
   * 点赞/取消点赞
   */
  async toggleLike(portfolioId: string, userId: string): Promise<{ liked: boolean }> {
    // 检查是否已点赞
    const existingLike = await pool.query(
      `SELECT id FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2`,
      [portfolioId, userId]
    );

    if (existingLike.rows.length > 0) {
      // 取消点赞
      await pool.query(
        `DELETE FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2`,
        [portfolioId, userId]
      );
      return { liked: false };
    } else {
      // 点赞
      await pool.query(
        `INSERT INTO portfolio_likes (id, portfolio_id, user_id) VALUES ($1, $2, $3)`,
        [uuidv4(), portfolioId, userId]
      );
      return { liked: true };
    }
  }

  /**
   * 添加标签
   */
  async addTags(portfolioId: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      await pool.query(
        `INSERT INTO portfolio_tags (id, portfolio_id, tag_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (portfolio_id, tag_name) DO NOTHING`,
        [uuidv4(), portfolioId, tag.trim().toLowerCase()]
      );
    }
  }

  /**
   * 删除标签
   */
  async removeTag(portfolioId: string, tagName: string): Promise<void> {
    await pool.query(
      `DELETE FROM portfolio_tags WHERE portfolio_id = $1 AND tag_name = $2`,
      [portfolioId, tagName]
    );
  }

  /**
   * 审核作品集
   */
  async reviewPortfolio(
    portfolioId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE student_portfolios
       SET status = $1, review_notes = $2, reviewed_at = NOW(), reviewed_by = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewNotes, reviewerId, portfolioId]
    );

    if (result.rows.length === 0) {
      throw new Error('作品集不存在');
    }

    return result.rows[0];
  }

  /**
   * 获取学生的作品集统计
   */
  async getStudentPortfolioStats(studentId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_portfolios,
         COUNT(*) FILTER (WHERE status = 'approved') as approved_portfolios,
         COALESCE(SUM(view_count), 0) as total_views,
         COALESCE(SUM(like_count), 0) as total_likes,
         array_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories
       FROM student_portfolios
       WHERE student_id = $1`,
      [studentId]
    );

    const stats = result.rows[0];

    // 获取最受欢迎的作品
    const popularResult = await pool.query(
      `SELECT id, title, cover_image, like_count, view_count
       FROM student_portfolios
       WHERE student_id = $1 AND status = 'approved'
       ORDER BY like_count DESC, view_count DESC
       LIMIT 3`,
      [studentId]
    );

    return {
      ...stats,
      total_portfolios: parseInt(stats.total_portfolios, 10),
      approved_portfolios: parseInt(stats.approved_portfolios, 10),
      total_views: parseInt(stats.total_views, 10),
      total_likes: parseInt(stats.total_likes, 10),
      popular_works: popularResult.rows,
    };
  }

  /**
   * 获取热门作品集
   */
  async getTrendingPortfolios(limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT p.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level as student_level
       FROM student_portfolios p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.status = 'approved' AND p.is_public = true
       ORDER BY (p.like_count * 2 + p.view_count * 0.1) DESC, p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * 搜索作品集
   */
  async searchPortfolios(keyword: string, limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT p.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level as student_level
       FROM student_portfolios p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.status = 'approved'
         AND p.is_public = true
         AND (
           p.title ILIKE $1
           OR p.description ILIKE $1
           OR $2 = ANY(p.tech_stack)
         )
       ORDER BY p.created_at DESC
       LIMIT $3`,
      [`%${keyword}%`, keyword, limit]
    );

    return result.rows;
  }
}

export default new PortfolioService();
