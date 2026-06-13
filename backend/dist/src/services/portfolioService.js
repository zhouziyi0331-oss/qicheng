"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-06: 学生作品集服务
 * 管理学生作品集的增删改查、浏览记录、点赞等功能
 */
class PortfolioService {
    /**
     * 创建作品集
     */
    async createPortfolio(data) {
        const { student_id, title, description, category, tech_stack, cover_image, images, video_url, demo_url, github_url, role, duration_days, highlights, challenges_overcome, related_task_id, is_from_platform, is_public, display_order, } = data;
        const result = await database_1.pool.query(`INSERT INTO student_portfolios
       (id, student_id, title, description, category, tech_stack,
        cover_image, images, video_url, demo_url, github_url,
        role, duration_days, highlights, challenges_overcome,
        related_task_id, is_from_platform, is_public, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`, [
            (0, uuid_1.v4)(),
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
        ]);
        return result.rows[0];
    }
    /**
     * 获取作品集列表
     */
    async getPortfolios(filter) {
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
        const params = [];
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
        const result = await database_1.pool.query(query, params);
        // 获取每个作品的标签
        const portfoliosWithTags = await Promise.all(result.rows.map(async (portfolio) => {
            const tagsResult = await database_1.pool.query(`SELECT tag_name FROM portfolio_tags WHERE portfolio_id = $1`, [portfolio.id]);
            return {
                ...portfolio,
                tags: tagsResult.rows.map((t) => t.tag_name),
            };
        }));
        return portfoliosWithTags;
    }
    /**
     * 获取单个作品集详情
     */
    async getPortfolioById(portfolioId, viewerId) {
        const result = await database_1.pool.query(`SELECT p.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level as student_level,
              u.bio as student_bio
       FROM student_portfolios p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.id = $1`, [portfolioId]);
        if (result.rows.length === 0) {
            throw new Error('作品集不存在');
        }
        const portfolio = result.rows[0];
        // 获取标签
        const tagsResult = await database_1.pool.query(`SELECT tag_name FROM portfolio_tags WHERE portfolio_id = $1`, [portfolioId]);
        portfolio.tags = tagsResult.rows.map((t) => t.tag_name);
        // 获取关联任务信息
        if (portfolio.related_task_id) {
            const taskResult = await database_1.pool.query(`SELECT id, title, budget, client_rating, completion_rate
         FROM tasks WHERE id = $1`, [portfolio.related_task_id]);
            if (taskResult.rows.length > 0) {
                portfolio.related_task = taskResult.rows[0];
            }
        }
        // 检查当前用户是否点赞
        if (viewerId) {
            const likeResult = await database_1.pool.query(`SELECT id FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2`, [portfolioId, viewerId]);
            portfolio.is_liked = likeResult.rows.length > 0;
        }
        return portfolio;
    }
    /**
     * 更新作品集
     */
    async updatePortfolio(portfolioId, updates) {
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
        const fields = [];
        const values = [];
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
        const result = await database_1.pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('作品集不存在');
        }
        return result.rows[0];
    }
    /**
     * 删除作品集
     */
    async deletePortfolio(portfolioId, studentId) {
        // 验证所有权
        const checkResult = await database_1.pool.query(`SELECT student_id FROM student_portfolios WHERE id = $1`, [portfolioId]);
        if (checkResult.rows.length === 0) {
            throw new Error('作品集不存在');
        }
        if (checkResult.rows[0].student_id !== studentId) {
            throw new Error('无权删除该作品集');
        }
        // 删除关联数据
        await database_1.pool.query(`DELETE FROM portfolio_tags WHERE portfolio_id = $1`, [portfolioId]);
        await database_1.pool.query(`DELETE FROM portfolio_likes WHERE portfolio_id = $1`, [portfolioId]);
        await database_1.pool.query(`DELETE FROM portfolio_views WHERE portfolio_id = $1`, [portfolioId]);
        // 删除作品集
        await database_1.pool.query(`DELETE FROM student_portfolios WHERE id = $1`, [portfolioId]);
    }
    /**
     * 记录浏览
     */
    async recordView(portfolioId, viewerId, viewerRole) {
        await database_1.pool.query(`INSERT INTO portfolio_views (id, portfolio_id, viewer_id, viewer_role)
       VALUES ($1, $2, $3, $4)`, [(0, uuid_1.v4)(), portfolioId, viewerId, viewerRole]);
    }
    /**
     * 点赞/取消点赞
     */
    async toggleLike(portfolioId, userId) {
        // 检查是否已点赞
        const existingLike = await database_1.pool.query(`SELECT id FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2`, [portfolioId, userId]);
        if (existingLike.rows.length > 0) {
            // 取消点赞
            await database_1.pool.query(`DELETE FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2`, [portfolioId, userId]);
            return { liked: false };
        }
        else {
            // 点赞
            await database_1.pool.query(`INSERT INTO portfolio_likes (id, portfolio_id, user_id) VALUES ($1, $2, $3)`, [(0, uuid_1.v4)(), portfolioId, userId]);
            return { liked: true };
        }
    }
    /**
     * 添加标签
     */
    async addTags(portfolioId, tags) {
        for (const tag of tags) {
            await database_1.pool.query(`INSERT INTO portfolio_tags (id, portfolio_id, tag_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (portfolio_id, tag_name) DO NOTHING`, [(0, uuid_1.v4)(), portfolioId, tag.trim().toLowerCase()]);
        }
    }
    /**
     * 删除标签
     */
    async removeTag(portfolioId, tagName) {
        await database_1.pool.query(`DELETE FROM portfolio_tags WHERE portfolio_id = $1 AND tag_name = $2`, [portfolioId, tagName]);
    }
    /**
     * 审核作品集
     */
    async reviewPortfolio(portfolioId, reviewerId, status, reviewNotes) {
        const result = await database_1.pool.query(`UPDATE student_portfolios
       SET status = $1, review_notes = $2, reviewed_at = NOW(), reviewed_by = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`, [status, reviewNotes, reviewerId, portfolioId]);
        if (result.rows.length === 0) {
            throw new Error('作品集不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取学生的作品集统计
     */
    async getStudentPortfolioStats(studentId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_portfolios,
         COUNT(*) FILTER (WHERE status = 'approved') as approved_portfolios,
         COALESCE(SUM(view_count), 0) as total_views,
         COALESCE(SUM(like_count), 0) as total_likes,
         array_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories
       FROM student_portfolios
       WHERE student_id = $1`, [studentId]);
        const stats = result.rows[0];
        // 获取最受欢迎的作品
        const popularResult = await database_1.pool.query(`SELECT id, title, cover_image, like_count, view_count
       FROM student_portfolios
       WHERE student_id = $1 AND status = 'approved'
       ORDER BY like_count DESC, view_count DESC
       LIMIT 3`, [studentId]);
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
    async getTrendingPortfolios(limit = 10) {
        const result = await database_1.pool.query(`SELECT p.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level as student_level
       FROM student_portfolios p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.status = 'approved' AND p.is_public = true
       ORDER BY (p.like_count * 2 + p.view_count * 0.1) DESC, p.created_at DESC
       LIMIT $1`, [limit]);
        return result.rows;
    }
    /**
     * 搜索作品集
     */
    async searchPortfolios(keyword, limit = 20) {
        const result = await database_1.pool.query(`SELECT p.*,
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
       LIMIT $3`, [`%${keyword}%`, keyword, limit]);
        return result.rows;
    }
}
exports.default = new PortfolioService();
//# sourceMappingURL=portfolioService.js.map