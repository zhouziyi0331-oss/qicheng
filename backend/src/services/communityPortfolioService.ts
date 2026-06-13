import { pool, QueryResult } from '../utils/db';

/**
 * 社群服务
 */
export class CommunityService {
  /**
   * 获取社群列表
   */
  static async getCommunities(filters?: any) {
    let query = `SELECT * FROM communities WHERE is_active = TRUE`;
    const params: any[] = [];

    if (filters?.type) {
      params.push(filters.type);
      query += ` AND community_type = $${params.length}`;
    }

    if (filters?.track) {
      params.push(filters.track);
      query += ` AND track = $${params.length}`;
    }

    query += ` ORDER BY member_count DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 加入社群
   */
  static async joinCommunity(communityId: number, userId: string) {
    await pool.query(
      `INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)
       ON CONFLICT (community_id, user_id) DO NOTHING`,
      [communityId, userId]
    );

    await pool.query(
      `UPDATE communities SET member_count = member_count + 1 WHERE id = $1`,
      [communityId]
    );
  }

  /**
   * 发布帖子
   */
  static async createPost(communityId: number, authorId: string, postData: any) {
    const result = await pool.query(
      `INSERT INTO community_posts
       (community_id, author_id, post_type, title, content, images, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        communityId,
        authorId,
        postData.post_type || 'discussion',
        postData.title,
        postData.content,
        JSON.stringify(postData.images || []),
        JSON.stringify(postData.tags || [])
      ]
    );

    await pool.query(
      `UPDATE communities SET post_count = post_count + 1 WHERE id = $1`,
      [communityId]
    );

    return result.rows[0];
  }

  /**
   * 获取帖子列表
   */
  static async getPosts(communityId: number, filters?: any) {
    let query = `
      SELECT p.*, u.nickname as author_name, u.avatar_url as author_avatar
      FROM community_posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.community_id = $1 AND p.status = 'published'
    `;
    const params: any[] = [communityId];

    if (filters?.post_type) {
      params.push(filters.post_type);
      query += ` AND p.post_type = $${params.length}`;
    }

    query += ` ORDER BY p.is_pinned DESC, p.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 点赞帖子
   */
  static async likePost(postId: number, userId: string) {
    await pool.query(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, userId]
    );

    await pool.query(
      `UPDATE community_posts SET like_count = like_count + 1 WHERE id = $1`,
      [postId]
    );
  }

  /**
   * 评论帖子
   */
  static async commentPost(postId: number, authorId: string, content: string, parentCommentId?: number) {
    const result = await pool.query(
      `INSERT INTO post_comments (post_id, author_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, authorId, content, parentCommentId]
    );

    await pool.query(
      `UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = $1`,
      [postId]
    );

    return result.rows[0];
  }
}

/**
 * 作品集服务
 */
export class PortfolioService {
  /**
   * 创建作品
   */
  static async createPortfolio(studentId: string, portfolioData: any) {
    const result = await pool.query(
      `INSERT INTO portfolios
       (student_id, title, description, portfolio_type, track, cover_image,
        media_files, demo_url, source_code_url, tech_stack, tools_used,
        difficulty_level, completion_time, related_task_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        studentId,
        portfolioData.title,
        portfolioData.description,
        portfolioData.portfolio_type,
        portfolioData.track,
        portfolioData.cover_image,
        JSON.stringify(portfolioData.media_files || []),
        portfolioData.demo_url,
        portfolioData.source_code_url,
        JSON.stringify(portfolioData.tech_stack || []),
        JSON.stringify(portfolioData.tools_used || []),
        portfolioData.difficulty_level,
        portfolioData.completion_time,
        portfolioData.related_task_id
      ]
    );

    return result.rows[0];
  }

  /**
   * 获取作品列表
   */
  static async getPortfolios(filters?: any) {
    let query = `
      SELECT p.*, u.nickname as author_name, u.avatar_url as author_avatar
      FROM portfolios p
      JOIN users u ON p.student_id = u.id
      WHERE p.visibility = 'public'
    `;
    const params: any[] = [];

    if (filters?.student_id) {
      params.push(filters.student_id);
      query += ` AND p.student_id = $${params.length}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 获取作品详情
   */
  static async getPortfolioDetail(portfolioId: number) {
    const result = await pool.query(
      `SELECT p.*, u.nickname as author_name, u.avatar_url as author_avatar
       FROM portfolios p
       JOIN users u ON p.student_id = u.id
       WHERE p.id = $1`,
      [portfolioId]
    );

    if (result.rows.length === 0) {
      throw new Error('作品不存在');
    }

    // 增加浏览量
    await pool.query(
      `UPDATE portfolios SET view_count = view_count + 1 WHERE id = $1`,
      [portfolioId]
    );

    return result.rows[0];
  }

  /**
   * 点赞作品
   */
  static async likePortfolio(portfolioId: number, userId: string) {
    await pool.query(
      `INSERT INTO portfolio_likes (portfolio_id, user_id) VALUES ($1, $2)
       ON CONFLICT (portfolio_id, user_id) DO NOTHING`,
      [portfolioId, userId]
    );

    await pool.query(
      `UPDATE portfolios SET like_count = like_count + 1 WHERE id = $1`,
      [portfolioId]
    );
  }

  /**
   * 评论作品
   */
  static async commentPortfolio(portfolioId: number, authorId: string, content: string, parentCommentId?: number) {
    const result = await pool.query(
      `INSERT INTO portfolio_comments (portfolio_id, author_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [portfolioId, authorId, content, parentCommentId]
    );

    await pool.query(
      `UPDATE portfolios SET comment_count = comment_count + 1 WHERE id = $1`,
      [portfolioId]
    );

    return result.rows[0];
  }

  /**
   * 获取精选作品
   */
  static async getFeaturedPortfolios() {
    const result = await pool.query(
      `SELECT p.*, u.nickname as author_name, u.avatar_url as author_avatar, fp.featured_reason
       FROM featured_portfolios fp
       JOIN portfolios p ON fp.portfolio_id = p.id
       JOIN users u ON p.student_id = u.id
       WHERE fp.ended_at IS NULL OR fp.ended_at > CURRENT_TIMESTAMP
       ORDER BY fp.display_order, fp.started_at DESC`
    );

    return result.rows;
  }

  /**
   * 添加作品标签
   */
  static async addPortfolioTags(portfolioId: number, tagNames: string[]) {
    for (const tagName of tagNames) {
      // 创建或获取标签
      const tagResult = await pool.query(
        `INSERT INTO portfolio_tags (tag_name) VALUES ($1)
         ON CONFLICT (tag_name) DO UPDATE SET usage_count = portfolio_tags.usage_count + 1
         RETURNING id`,
        [tagName]
      );

      const tagId = tagResult.rows[0].id;

      // 关联作品和标签
      await pool.query(
        `INSERT INTO portfolio_tag_relations (portfolio_id, tag_id) VALUES ($1, $2)
         ON CONFLICT (portfolio_id, tag_id) DO NOTHING`,
        [portfolioId, tagId]
      );
    }
  }

  /**
   * 获取热门标签
   */
  static async getPopularTags(limit: number = 20) {
    const result = await pool.query(
      `SELECT * FROM portfolio_tags ORDER BY usage_count DESC LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}
