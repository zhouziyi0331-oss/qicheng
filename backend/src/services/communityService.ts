import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

/**
 * 社区服务
 * 处理社区帖子发布、申请、技能展示
 */

interface CreatePostParams {
  authorId: string;
  type: 'recruit' | 'showcase' | 'collab';
  title: string;
  content: string;
  coverImage?: string;
  requiredSkills?: string[];
  track?: string;
  teamId?: string;
  vacancyCount?: number;
}

interface CommunityPost {
  id: string;
  authorId: string;
  type: string;
  title: string;
  content: string;
  coverImage?: string;
  requiredSkills: string[];
  track?: string;
  teamId?: string;
  vacancyCount?: number;
  totalApplicants: number;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  author?: {
    name: string;
    level: number;
    track: string;
    avatar?: string;
  };
}

class CommunityService {
  /**
   * 发布社区帖子
   */
  async createPost(params: CreatePostParams): Promise<string> {
    try {
      // 验证发布者等级（招募帖需要Lv.5+）
      if (params.type === 'recruit') {
        const author = await queryOne<{
          current_level: number;
        }>(
          `SELECT current_level FROM users WHERE id = $1`,
          [params.authorId]
        );

        if (!author || author.current_level < 5) {
          throw new Error('发布招募帖需要Lv.5及以上等级');
        }

        if (!params.teamId) {
          throw new Error('招募帖必须关联队伍');
        }
      }

      // 创建帖子
      const post = await queryOne<{ id: string }>(
        `INSERT INTO community_posts (
          author_id, type, title, content, cover_image,
          required_skills, track, team_id, vacancy_count, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
        RETURNING id`,
        [
          params.authorId,
          params.type,
          params.title,
          params.content,
          params.coverImage || null,
          JSON.stringify(params.requiredSkills || []),
          params.track || null,
          params.teamId || null,
          params.vacancyCount || null,
        ]
      );

      if (!post) {
        throw new Error('Failed to create post');
      }

      logger.info(`Community post created: ${post.id} by ${params.authorId}, type: ${params.type}`);

      return post.id;
    } catch (error: any) {
      logger.error('Failed to create community post:', error);
      throw error;
    }
  }

  /**
   * 获取社区帖子列表
   */
  async getPosts(options: {
    type?: 'recruit' | 'showcase' | 'collab';
    track?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    posts: CommunityPost[];
    totalCount: number;
  }> {
    try {
      const {
        type,
        track,
        status = 'open',
        limit = 20,
        offset = 0,
      } = options;

      let whereConditions = ['cp.status = $1'];
      const params: any[] = [status];
      let paramIndex = 2;

      if (type) {
        whereConditions.push(`cp.type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (track) {
        whereConditions.push(`(cp.track = $${paramIndex} OR cp.track = 'mixed')`);
        params.push(track);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // 获取帖子列表
      const posts = await query(
        `SELECT
          cp.*,
          u.name as author_name,
          u.current_level as author_level,
          u.track as author_track,
          u.avatar as author_avatar
         FROM community_posts cp
         JOIN users u ON cp.author_id = u.id
         WHERE ${whereClause}
         ORDER BY
           CASE cp.type
             WHEN 'recruit' THEN 1
             WHEN 'collab' THEN 2
             WHEN 'showcase' THEN 3
           END,
           cp.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      // 获取总数
      const countResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM community_posts cp WHERE ${whereClause}`,
        params
      );

      const formattedPosts: CommunityPost[] = posts.map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        type: row.type,
        title: row.title,
        content: row.content,
        coverImage: row.cover_image,
        requiredSkills: row.required_skills || [],
        track: row.track,
        teamId: row.team_id,
        vacancyCount: row.vacancy_count,
        totalApplicants: row.total_applicants,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        author: {
          name: row.author_name,
          level: row.author_level,
          track: row.author_track,
          avatar: row.author_avatar,
        },
      }));

      return {
        posts: formattedPosts,
        totalCount: countResult?.count || 0,
      };
    } catch (error: any) {
      logger.error('Failed to get community posts:', error);
      throw error;
    }
  }

  /**
   * 获取帖子详情
   */
  async getPostDetail(postId: string): Promise<CommunityPost | null> {
    try {
      const post = await queryOne(
        `SELECT
          cp.*,
          u.name as author_name,
          u.current_level as author_level,
          u.track as author_track,
          u.avatar as author_avatar
         FROM community_posts cp
         JOIN users u ON cp.author_id = u.id
         WHERE cp.id = $1`,
        [postId]
      );

      if (!post) {
        return null;
      }

      // 如果是招募帖且关联了队伍，获取队伍成员及其技能
      let teamMembers: any[] = [];
      if (post.type === 'recruit' && post.team_id) {
        const members = await query(
          `SELECT
            u.id,
            u.name,
            u.avatar,
            u.current_level,
            u.track,
            sc.skills,
            tm.role,
            tm.assigned_module
           FROM team_members tm
           JOIN users u ON tm.user_id = u.id
           LEFT JOIN student_capabilities sc ON u.id = sc.student_id
           WHERE tm.team_id = $1 AND tm.status = 'active'
           ORDER BY
             CASE tm.role
               WHEN 'leader' THEN 1
               WHEN 'member' THEN 2
               ELSE 3
             END`,
          [post.team_id]
        );

        teamMembers = members.map((m: any) => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          level: m.current_level,
          track: m.track,
          role: m.role,
          assignedModule: m.assigned_module,
          skills: m.skills || {},
        }));
      }

      return {
        id: post.id as string,
        authorId: post.author_id as string,
        type: post.type as string,
        title: post.title as string,
        content: post.content as string,
        coverImage: post.cover_image as string | undefined,
        requiredSkills: (post.required_skills as string[]) || [],
        track: post.track as string | undefined,
        teamId: post.team_id as string | undefined,
        vacancyCount: post.vacancy_count as number | undefined,
        totalApplicants: post.total_applicants as number,
        status: post.status as string,
        createdAt: post.created_at as Date,
        expiresAt: post.expires_at as Date,
        author: {
          name: post.author_name as string,
          level: post.author_level as number,
          track: post.author_track as string,
          avatar: post.author_avatar as string | undefined,
        },
        teamMembers, // 添加团队成员信息
      };
    } catch (error: any) {
      logger.error('Failed to get post detail:', error);
      return null;
    }
  }

  /**
   * 申请加入（招募帖）
   */
  async applyToPost(postId: string, applicantId: string, message?: string, skillsOffered?: string[]): Promise<void> {
    try {
      // 获取帖子信息
      const post = await queryOne<{
        type: string;
        team_id: string;
        status: string;
        vacancy_count: number;
        total_applicants: number;
      }>(
        `SELECT type, team_id, status, vacancy_count, total_applicants
         FROM community_posts
         WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      if (post.type !== 'recruit') {
        throw new Error('只能申请招募帖');
      }

      if (post.status !== 'open') {
        throw new Error('招募已关闭');
      }

      if (post.vacancy_count && post.total_applicants >= post.vacancy_count) {
        throw new Error('招募名额已满');
      }

      // 检查是否已申请
      const existing = await queryOne(
        `SELECT id FROM community_post_applications WHERE post_id = $1 AND applicant_id = $2`,
        [postId, applicantId]
      );

      if (existing) {
        throw new Error('你已经申请过此招募');
      }

      // 创建申请记录
      await query(
        `INSERT INTO community_post_applications (
          post_id, applicant_id, team_id, message, skills_offered, status
        ) VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [postId, applicantId, post.team_id, message || null, JSON.stringify(skillsOffered || [])]
      );

      // 更新帖子申请人数
      await query(
        `UPDATE community_posts SET total_applicants = total_applicants + 1 WHERE id = $1`,
        [postId]
      );

      logger.info(`User ${applicantId} applied to post ${postId}`);
    } catch (error: any) {
      logger.error('Failed to apply to post:', error);
      throw error;
    }
  }

  /**
   * 审核申请
   */
  async reviewApplication(
    postId: string,
    authorId: string,
    applicantId: string,
    approved: boolean
  ): Promise<void> {
    try {
      // 验证帖子作者
      const post = await queryOne<{
        author_id: string;
        team_id: string;
      }>(
        `SELECT author_id, team_id FROM community_posts WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      if (post.author_id !== authorId) {
        throw new Error('只有帖子作者可以审核申请');
      }

      if (approved) {
        // 通过申请
        await query(
          `UPDATE community_post_applications
           SET status = 'approved', reviewed_at = NOW()
           WHERE post_id = $1 AND applicant_id = $2`,
          [postId, applicantId]
        );

        // 如果关联了队伍，自动添加到队伍
        if (post.team_id) {
          const teamService = require('./teamService').default;
          await teamService.reviewTeamApplication(post.team_id, authorId, applicantId, true);
        }

        logger.info(`Application approved: ${applicantId} for post ${postId}`);
      } else {
        // 拒绝申请
        await query(
          `UPDATE community_post_applications
           SET status = 'rejected', reviewed_at = NOW()
           WHERE post_id = $1 AND applicant_id = $2`,
          [postId, applicantId]
        );

        logger.info(`Application rejected: ${applicantId} for post ${postId}`);
      }
    } catch (error: any) {
      logger.error('Failed to review application:', error);
      throw error;
    }
  }

  /**
   * 获取帖子的申请列表
   */
  async getPostApplications(postId: string, authorId: string): Promise<any[]> {
    try {
      // 验证帖子作者
      const post = await queryOne<{
        author_id: string;
      }>(
        `SELECT author_id FROM community_posts WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      if (post.author_id !== authorId) {
        throw new Error('只有帖子作者可以查看申请列表');
      }

      // 获取申请列表
      const applications = await query(
        `SELECT
          cpa.*,
          u.name as applicant_name,
          u.current_level as applicant_level,
          u.track as applicant_track,
          u.avatar as applicant_avatar
         FROM community_post_applications cpa
         JOIN users u ON cpa.applicant_id = u.id
         WHERE cpa.post_id = $1
         ORDER BY cpa.applied_at DESC`,
        [postId]
      );

      return applications;
    } catch (error: any) {
      logger.error('Failed to get post applications:', error);
      throw error;
    }
  }

  /**
   * 关闭帖子
   */
  async closePost(postId: string, authorId: string): Promise<void> {
    try {
      // 验证帖子作者
      const post = await queryOne<{
        author_id: string;
      }>(
        `SELECT author_id FROM community_posts WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      if (post.author_id !== authorId) {
        throw new Error('只有帖子作者可以关闭帖子');
      }

      // 关闭帖子
      await query(
        `UPDATE community_posts SET status = 'closed', updated_at = NOW() WHERE id = $1`,
        [postId]
      );

      logger.info(`Post ${postId} closed by ${authorId}`);
    } catch (error: any) {
      logger.error('Failed to close post:', error);
      throw error;
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(postId: string, authorId: string): Promise<void> {
    try {
      // 验证帖子作者
      const post = await queryOne<{
        author_id: string;
      }>(
        `SELECT author_id FROM community_posts WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      if (post.author_id !== authorId) {
        throw new Error('只有帖子作者可以删除帖子');
      }

      // 删除帖子（级联删除申请记录）
      await query(
        `DELETE FROM community_posts WHERE id = $1`,
        [postId]
      );

      logger.info(`Post ${postId} deleted by ${authorId}`);
    } catch (error: any) {
      logger.error('Failed to delete post:', error);
      throw error;
    }
  }

  /**
   * 获取用户发布的帖子
   */
  async getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<{
    posts: CommunityPost[];
    totalCount: number;
  }> {
    try {
      const posts = await query(
        `SELECT
          cp.*,
          u.name as author_name,
          u.current_level as author_level,
          u.track as author_track,
          u.avatar as author_avatar
         FROM community_posts cp
         JOIN users u ON cp.author_id = u.id
         WHERE cp.author_id = $1
         ORDER BY cp.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM community_posts WHERE author_id = $1`,
        [userId]
      );

      const formattedPosts: CommunityPost[] = posts.map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        type: row.type,
        title: row.title,
        content: row.content,
        coverImage: row.cover_image,
        requiredSkills: row.required_skills || [],
        track: row.track,
        teamId: row.team_id,
        vacancyCount: row.vacancy_count,
        totalApplicants: row.total_applicants,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        author: {
          name: row.author_name,
          level: row.author_level,
          track: row.author_track,
          avatar: row.author_avatar,
        },
      }));

      return {
        posts: formattedPosts,
        totalCount: countResult?.count || 0,
      };
    } catch (error: any) {
      logger.error('Failed to get user posts:', error);
      throw error;
    }
  }

  /**
   * 获取用户申请的帖子
   */
  async getUserApplications(userId: string): Promise<any[]> {
    try {
      const applications = await query(
        `SELECT
          cpa.*,
          cp.title as post_title,
          cp.type as post_type,
          u.name as author_name
         FROM community_post_applications cpa
         JOIN community_posts cp ON cpa.post_id = cp.id
         JOIN users u ON cp.author_id = u.id
         WHERE cpa.applicant_id = $1
         ORDER BY cpa.applied_at DESC`,
        [userId]
      );

      return applications;
    } catch (error: any) {
      logger.error('Failed to get user applications:', error);
      throw error;
    }
  }
}

export default new CommunityService();
