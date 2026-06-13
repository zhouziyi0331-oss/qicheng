import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import contentAuditService from './contentAuditService';

/**
 * 社区服务 - 增强版
 * 处理社区帖子发布、评论、点赞、举报等功能
 */

interface CreatePostParams {
  authorId: string;
  type: 'recruit' | 'showcase' | 'collab' | 'skill_share' | 'help';
  title: string;
  content: string;
  coverImage?: string;
  requiredSkills?: string[];
  track?: string;
  teamId?: string;
  vacancyCount?: number;
  projectSource?: 'platform_order' | 'self_initiated' | 'external';
  mySkills?: string[];
  requiredSkillsDetail?: Array<{ skillName: string; requiredLevel: 'must' | 'plus' }>;
  profitSplit?: 'equal' | 'proportional' | 'negotiable';
  estimatedDuration?: string;
  recruitCount?: number;
  relatedTrack?: 'content' | 'dev' | 'both';
  relatedLevels?: number[];
}

interface CreateCommentParams {
  postId: string;
  userId: string;
  content: string;
  parentId?: string;
}

class CommunityServiceEnhanced {
  /**
   * 发布社区帖子（增强版）
   */
  async createPost(params: CreatePostParams): Promise<string> {
    try {
      const { authorId, type } = params;

      // 检查用户是否被限制发帖
      const restriction = await contentAuditService.checkUserRestriction(authorId, 'post_ban');
      if (restriction.restricted) {
        throw new Error(`您已被限制发帖，原因：${restriction.reason}，解除时间：${restriction.expiresAt}`);
      }

      // 验证发布者等级
      const author = await queryOne<{ current_level: number }>(
        `SELECT current_level FROM users WHERE id = $1`,
        [authorId]
      );

      if (!author) {
        throw new Error('用户不存在');
      }

      // 根据帖子类型验证等级权限
      if (type === 'recruit' && author.current_level < 5) {
        throw new Error('发布招募帖需要Lv.5及以上等级');
      }

      if (type === 'skill_share' && author.current_level < 2) {
        throw new Error('发布技能分享帖需要Lv.2及以上等级');
      }

      // AI内容审核
      const auditResult = await contentAuditService.auditContent({
        contentType: 'post',
        contentText: params.content,
        userId: authorId,
        title: params.title,
      });

      // 如果置信度>0.8，拒绝发布
      if (!auditResult.passed && auditResult.confidence > 0.8) {
        throw new Error(`内容违反社区规范：${auditResult.reason}`);
      }

      // 如果是问题求助帖，检测代做请求
      if (type === 'help') {
        const helpKeywords = ['帮我做', '代做', '帮我写', '替我完成'];
        const hasHelpKeyword = helpKeywords.some(keyword =>
          params.content.includes(keyword) || params.title.includes(keyword)
        );

        if (hasHelpKeyword) {
          throw new Error('项目代做请求请走任务大厅或联系导师。社区求助适合问技术方法和工具推荐。');
        }
      }

      // 创建帖子
      const post = await queryOne<{ id: string }>(
        `INSERT INTO community_posts (
          author_id, type, title, content, cover_image,
          required_skills, track, team_id, vacancy_count, status,
          project_source, my_skills, required_skills_detail,
          profit_split, estimated_duration, recruit_count,
          related_track, related_levels, ai_review_result
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id`,
        [
          authorId,
          type,
          params.title,
          params.content,
          params.coverImage || null,
          JSON.stringify(params.requiredSkills || []),
          params.track || null,
          params.teamId || null,
          params.vacancyCount || null,
          params.projectSource || null,
          JSON.stringify(params.mySkills || []),
          JSON.stringify(params.requiredSkillsDetail || []),
          params.profitSplit || null,
          params.estimatedDuration || null,
          params.recruitCount || null,
          params.relatedTrack || null,
          params.relatedLevels || null,
          JSON.stringify(auditResult),
        ]
      );

      if (!post) {
        throw new Error('Failed to create post');
      }

      logger.info(`Community post created: ${post.id} by ${authorId}, type: ${type}`);

      return post.id;
    } catch (error: unknown) {
      logger.error('Failed to create community post:', error);
      throw error;
    }
  }

  /**
   * 创建评论
   */
  async createComment(params: CreateCommentParams): Promise<string> {
    try {
      const { postId, userId, content, parentId } = params;

      // 检查用户是否被限制评论
      const restriction = await contentAuditService.checkUserRestriction(userId, 'comment_ban');
      if (restriction.restricted) {
        throw new Error(`您已被限制评论，原因：${restriction.reason}，解除时间：${restriction.expiresAt}`);
      }

      // 验证用户等级（Lv.2+可评论）
      const user = await queryOne<{ current_level: number }>(
        `SELECT current_level FROM users WHERE id = $1`,
        [userId]
      );

      if (!user || user.current_level < 2) {
        throw new Error('完成首单升级到Lv.2后可参与讨论');
      }

      // 验证帖子存在
      const post = await queryOne<{ id: string; status: string }>(
        `SELECT id, status FROM community_posts WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      // 如果有父评论，验证父评论存在且属于同一帖子
      if (parentId) {
        const parentComment = await queryOne<{ post_id: string }>(
          `SELECT post_id FROM community_comments WHERE id = $1`,
          [parentId]
        );

        if (!parentComment) {
          throw new Error('父评论不存在');
        }

        if (parentComment.post_id !== postId) {
          throw new Error('父评论不属于该帖子');
        }
      }

      // AI内容审核
      const auditResult = await contentAuditService.auditContent({
        contentType: 'comment',
        contentText: content,
        userId,
      });

      // 如果置信度>0.8，拒绝发布
      if (!auditResult.passed && auditResult.confidence > 0.8) {
        throw new Error(`评论违反社区规范：${auditResult.reason}`);
      }

      // 创建评论
      const comment = await queryOne<{ id: string }>(
        `INSERT INTO community_comments (
          post_id, user_id, parent_id, content, ai_review_result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [postId, userId, parentId || null, content, JSON.stringify(auditResult)]
      );

      if (!comment) {
        throw new Error('Failed to create comment');
      }

      // 更新帖子的评论数
      await query(
        `UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = $1`,
        [postId]
      );

      logger.info(`Comment created: ${comment.id} on post ${postId} by ${userId}`);

      return comment.id;
    } catch (error: unknown) {
      logger.error('Failed to create comment:', error);
      throw error;
    }
  }

  /**
   * 获取帖子的评论列表
   */
  async getComments(postId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const comments = await query(
        `SELECT
          c.*,
          u.name as user_name,
          u.avatar as user_avatar,
          u.current_level as user_level,
          (SELECT COUNT(*) FROM community_comments WHERE parent_id = c.id) as reply_count
         FROM community_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1 AND c.is_hidden = FALSE
         ORDER BY
           c.like_count DESC,
           c.created_at DESC
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset]
      );

      return comments.rows;
    } catch (error: unknown) {
      logger.error('Failed to get comments:', error);
      throw error;
    }
  }

  /**
   * 点赞/取消点赞
   */
  async toggleLike(
    userId: string,
    targetType: 'post' | 'comment',
    targetId: string
  ): Promise<{ liked: boolean }> {
    try {
      // 验证用户等级（Lv.2+可点赞）
      const user = await queryOne<{ current_level: number }>(
        `SELECT current_level FROM users WHERE id = $1`,
        [userId]
      );

      if (!user || user.current_level < 2) {
        throw new Error('完成首单升级到Lv.2后可点赞');
      }

      // 检查是否已点赞
      const existing = await queryOne(
        `SELECT id FROM community_likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
        [userId, targetType, targetId]
      );

      if (existing) {
        // 取消点赞
        await query(
          `DELETE FROM community_likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
          [userId, targetType, targetId]
        );

        logger.info(`Like removed: ${targetType} ${targetId} by ${userId}`);
        return { liked: false };
      } else {
        // 添加点赞
        await query(
          `INSERT INTO community_likes (user_id, target_type, target_id) VALUES ($1, $2, $3)`,
          [userId, targetType, targetId]
        );

        logger.info(`Like added: ${targetType} ${targetId} by ${userId}`);
        return { liked: true };
      }
    } catch (error: unknown) {
      logger.error('Failed to toggle like:', error);
      throw error;
    }
  }

  /**
   * 举报内容
   */
  async reportContent(
    reporterId: string,
    targetType: 'post' | 'comment',
    targetId: string,
    reason: 'spam' | 'harassment' | 'company_complaint' | 'student_attack' | 'false_info' | 'other',
    description?: string
  ): Promise<void> {
    try {
      // 验证用户等级（Lv.2+可举报）
      const user = await queryOne<{ current_level: number }>(
        `SELECT current_level FROM users WHERE id = $1`,
        [reporterId]
      );

      if (!user || user.current_level < 2) {
        throw new Error('完成首单升级到Lv.2后可举报');
      }

      // 检查是否已举报
      const existing = await queryOne(
        `SELECT id FROM community_reports WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3`,
        [reporterId, targetType, targetId]
      );

      if (existing) {
        throw new Error('您已经举报过此内容');
      }

      // 创建举报记录
      await query(
        `INSERT INTO community_reports (reporter_id, target_type, target_id, reason, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [reporterId, targetType, targetId, reason, description || null]
      );

      // 更新目标内容的举报计数
      if (targetType === 'post') {
        await query(
          `UPDATE community_posts SET report_count = report_count + 1 WHERE id = $1`,
          [targetId]
        );
      } else {
        await query(
          `UPDATE community_comments SET report_count = report_count + 1 WHERE id = $1`,
          [targetId]
        );
      }

      logger.info(`Content reported: ${targetType} ${targetId} by ${reporterId}, reason: ${reason}`);
    } catch (error: unknown) {
      logger.error('Failed to report content:', error);
      throw error;
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // 获取评论信息
      const comment = await queryOne<{ user_id: string; post_id: string }>(
        `SELECT user_id, post_id FROM community_comments WHERE id = $1`,
        [commentId]
      );

      if (!comment) {
        throw new Error('评论不存在');
      }

      // 获取帖子作者
      const post = await queryOne<{ author_id: string }>(
        `SELECT author_id FROM community_posts WHERE id = $1`,
        [comment.post_id]
      );

      // 只有评论者本人或帖子作者可以删除评论
      if (comment.user_id !== userId && post?.author_id !== userId) {
        throw new Error('只有评论者本人或帖子作者可以删除评论');
      }

      // 删除评论
      await query(`DELETE FROM community_comments WHERE id = $1`, [commentId]);

      // 更新帖子的评论数
      await query(
        `UPDATE community_posts SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = $1`,
        [comment.post_id]
      );

      logger.info(`Comment deleted: ${commentId} by ${userId}`);
    } catch (error: unknown) {
      logger.error('Failed to delete comment:', error);
      throw error;
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      // 获取帖子信息
      const post = await queryOne<{ author_id: string }>(
        `SELECT author_id FROM community_posts WHERE id = $1`,
        [postId]
      );

      if (!post) {
        throw new Error('帖子不存在');
      }

      // 只有帖子作者可以删除
      if (post.author_id !== userId) {
        throw new Error('只有帖子作者可以删除帖子');
      }

      // 删除帖子（级联删除评论、点赞、举报）
      await query(`DELETE FROM community_posts WHERE id = $1`, [postId]);

      logger.info(`Post deleted: ${postId} by ${userId}`);
    } catch (error: unknown) {
      logger.error('Failed to delete post:', error);
      throw error;
    }
  }

  /**
   * 获取帖子详情（增强版）
   */
  async getPostDetails(postId: string, userId: string): Promise<any> {
    try {
      // 获取帖子基本信息
      const post = await queryOne(
        `SELECT
          cp.*,
          u.name as author_name,
          u.current_level as author_level,
          u.selected_track as author_track,
          u.avatar as author_avatar,
          EXISTS(SELECT 1 FROM community_likes WHERE user_id = $2 AND target_type = 'post' AND target_id = cp.id) as user_liked
         FROM community_posts cp
         JOIN users u ON cp.author_id = u.id
         WHERE cp.id = $1 AND cp.is_hidden = FALSE`,
        [postId, userId]
      );

      if (!post) {
        return null;
      }

      // 获取评论列表
      const comments = await this.getComments(postId);

      // 如果是招募帖且关联了队伍，获取队伍成员
      let teamMembers = [];
      if (post.type === 'recruit' && post.team_id) {
        const members = await query(
          `SELECT
            u.id,
            u.name,
            u.avatar,
            u.current_level,
            u.selected_track,
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

        teamMembers = members.rows;
      }

      return {
        ...post,
        comments,
        teamMembers,
      };
    } catch (error: unknown) {
      logger.error('Failed to get post details:', error);
      throw error;
    }
  }
}

export default new CommunityServiceEnhanced();
