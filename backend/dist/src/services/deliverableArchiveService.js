"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-18: 交付物档案管理服务
 * 管理企业的历史交付物，支持分类、搜索、下载、分享
 */
class DeliverableArchiveService {
    /**
     * 手动创建档案
     */
    async createArchive(data) {
        const { task_id, company_id, student_id, title, description, category, files, tags, custom_category, company_notes, } = data;
        // 计算文件总大小
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        const result = await database_1.pool.query(`INSERT INTO deliverable_archives
       (id, task_id, company_id, student_id, title, description, category,
        files, total_file_size, file_count, tags, custom_category, company_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            task_id,
            company_id,
            student_id,
            title,
            description,
            category,
            JSON.stringify(files),
            totalSize,
            files.length,
            tags || [],
            custom_category,
            company_notes,
        ]);
        return result.rows[0];
    }
    /**
     * 获取档案列表
     */
    async getArchives(filter) {
        const { companyId, category, customCategory, tags, studentId, startDate, endDate, isFavorite, searchKeyword, limit = 20, offset = 0, } = filter;
        let query = `
      SELECT da.*,
             u.username as student_name,
             u.avatar as student_avatar,
             t.title as task_title
      FROM deliverable_archives da
      LEFT JOIN users u ON da.student_id = u.id
      LEFT JOIN tasks t ON da.task_id = t.id
      WHERE da.company_id = $1 AND da.is_archived = false
    `;
        const params = [companyId];
        let paramIndex = 2;
        if (category) {
            query += ` AND da.category = $${paramIndex++}`;
            params.push(category);
        }
        if (customCategory) {
            query += ` AND da.custom_category = $${paramIndex++}`;
            params.push(customCategory);
        }
        if (studentId) {
            query += ` AND da.student_id = $${paramIndex++}`;
            params.push(studentId);
        }
        if (tags && tags.length > 0) {
            query += ` AND da.tags && $${paramIndex++}`;
            params.push(tags);
        }
        if (startDate) {
            query += ` AND da.completed_at >= $${paramIndex++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND da.completed_at <= $${paramIndex++}`;
            params.push(endDate);
        }
        if (isFavorite) {
            query += ` AND da.is_favorite = true`;
        }
        if (searchKeyword) {
            query += ` AND (da.title ILIKE $${paramIndex++} OR da.description ILIKE $${paramIndex})`;
            params.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
            paramIndex += 2;
        }
        // 获取总数
        const countQuery = query.replace(/SELECT da\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const countResult = await database_1.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total, 10);
        // 获取分页数据
        query += ` ORDER BY da.archived_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        return {
            archives: result.rows,
            total,
        };
    }
    /**
     * 获取档案详情
     */
    async getArchiveById(archiveId, companyId) {
        const result = await database_1.pool.query(`SELECT da.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level,
              t.title as task_title,
              t.budget as task_budget
       FROM deliverable_archives da
       LEFT JOIN users u ON da.student_id = u.id
       LEFT JOIN tasks t ON da.task_id = t.id
       WHERE da.id = $1 AND da.company_id = $2`, [archiveId, companyId]);
        if (result.rows.length === 0) {
            throw new Error('档案不存在');
        }
        // 更新查看次数
        await database_1.pool.query(`UPDATE deliverable_archives
       SET view_count = view_count + 1, last_viewed_at = NOW()
       WHERE id = $1`, [archiveId]);
        // 获取版本历史
        const versionsResult = await database_1.pool.query(`SELECT * FROM deliverable_versions WHERE deliverable_id = $1 ORDER BY version_number DESC`, [archiveId]);
        const archive = result.rows[0];
        archive.versions = versionsResult.rows;
        return archive;
    }
    /**
     * 更新档案
     */
    async updateArchive(archiveId, companyId, updates) {
        const allowedFields = [
            'title',
            'description',
            'category',
            'tags',
            'custom_category',
            'company_notes',
            'quality_score',
            'quality_notes',
            'is_favorite',
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
        values.push(archiveId, companyId);
        const query = `
      UPDATE deliverable_archives
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND company_id = $${paramIndex}
      RETURNING *
    `;
        const result = await database_1.pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('档案不存在');
        }
        return result.rows[0];
    }
    /**
     * 删除档案
     */
    async deleteArchive(archiveId, companyId) {
        const result = await database_1.pool.query(`DELETE FROM deliverable_archives WHERE id = $1 AND company_id = $2`, [archiveId, companyId]);
        if (result.rowCount === 0) {
            throw new Error('档案不存在');
        }
    }
    /**
     * 记录下载
     */
    async recordDownload(archiveId, userId, downloadedFiles, method = 'all') {
        await database_1.pool.query(`INSERT INTO deliverable_downloads (id, deliverable_id, downloaded_by, downloaded_files, download_method)
       VALUES ($1, $2, $3, $4, $5)`, [(0, uuid_1.v4)(), archiveId, userId, downloadedFiles, method]);
    }
    /**
     * 添加版本
     */
    async addVersion(archiveId, files, changeNotes, uploadedBy) {
        // 获取当前最大版本号
        const versionResult = await database_1.pool.query(`SELECT COALESCE(MAX(version_number), 0) as max_version FROM deliverable_versions WHERE deliverable_id = $1`, [archiveId]);
        const nextVersion = parseInt(versionResult.rows[0].max_version, 10) + 1;
        const result = await database_1.pool.query(`INSERT INTO deliverable_versions (id, deliverable_id, version_number, files, change_notes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [(0, uuid_1.v4)(), archiveId, nextVersion, JSON.stringify(files), changeNotes, uploadedBy]);
        // 更新主记录的文件
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        await database_1.pool.query(`UPDATE deliverable_archives
       SET files = $1, total_file_size = $2, file_count = $3, updated_at = NOW()
       WHERE id = $4`, [JSON.stringify(files), totalSize, files.length, archiveId]);
        return result.rows[0];
    }
    /**
     * 创建自定义分类
     */
    async createCategory(companyId, name, description, color, icon) {
        try {
            const result = await database_1.pool.query(`INSERT INTO deliverable_categories (id, company_id, category_name, description, color, icon)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [(0, uuid_1.v4)(), companyId, name, description, color || '#1890ff', icon]);
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') {
                throw new Error('分类名称已存在');
            }
            throw error;
        }
    }
    /**
     * 获取企业的分类列表
     */
    async getCategories(companyId) {
        const result = await database_1.pool.query(`SELECT * FROM deliverable_categories WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
        return result.rows;
    }
    /**
     * 更新分类
     */
    async updateCategory(categoryId, companyId, updates) {
        const allowedFields = ['category_name', 'description', 'color', 'icon'];
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
        values.push(categoryId, companyId);
        const query = `
      UPDATE deliverable_categories
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND company_id = $${paramIndex}
      RETURNING *
    `;
        const result = await database_1.pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('分类不存在');
        }
        return result.rows[0];
    }
    /**
     * 删除分类
     */
    async deleteCategory(categoryId, companyId) {
        const result = await database_1.pool.query(`DELETE FROM deliverable_categories WHERE id = $1 AND company_id = $2`, [categoryId, companyId]);
        if (result.rowCount === 0) {
            throw new Error('分类不存在');
        }
    }
    /**
     * 创建分享链接
     */
    async createShareLink(archiveId, companyId, options = {}) {
        const shareCode = (0, uuid_1.v4)().replace(/-/g, '').substring(0, 16);
        const result = await database_1.pool.query(`INSERT INTO deliverable_shares
       (id, deliverable_id, company_id, share_code, share_password, expires_at, max_downloads)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            archiveId,
            companyId,
            shareCode,
            options.password,
            options.expiresAt,
            options.maxDownloads,
        ]);
        return result.rows[0];
    }
    /**
     * 验证分享链接
     */
    async validateShareLink(shareCode, password) {
        const result = await database_1.pool.query(`SELECT ds.*, da.title, da.files, da.company_id
       FROM deliverable_shares ds
       JOIN deliverable_archives da ON ds.deliverable_id = da.id
       WHERE ds.share_code = $1 AND ds.is_active = true`, [shareCode]);
        if (result.rows.length === 0) {
            throw new Error('分享链接不存在或已失效');
        }
        const share = result.rows[0];
        // 检查是否过期
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            throw new Error('分享链接已过期');
        }
        // 检查下载次数
        if (share.max_downloads && share.current_downloads >= share.max_downloads) {
            throw new Error('分享链接下载次数已达上限');
        }
        // 检查密码
        if (share.share_password && share.share_password !== password) {
            throw new Error('密码错误');
        }
        return share;
    }
    /**
     * 记录分享下载
     */
    async recordShareDownload(shareCode) {
        await database_1.pool.query(`UPDATE deliverable_shares
       SET current_downloads = current_downloads + 1
       WHERE share_code = $1`, [shareCode]);
    }
    /**
     * 获取档案统计
     */
    async getArchiveStats(companyId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_archives,
         SUM(total_file_size) as total_size,
         SUM(download_count) as total_downloads,
         COUNT(DISTINCT student_id) as unique_students,
         COUNT(*) FILTER (WHERE is_favorite = true) as favorite_count,
         array_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories
       FROM deliverable_archives
       WHERE company_id = $1 AND is_archived = false`, [companyId]);
        const stats = result.rows[0];
        // 获取最近下载
        const recentDownloads = await database_1.pool.query(`SELECT da.title, dd.downloaded_at
       FROM deliverable_downloads dd
       JOIN deliverable_archives da ON dd.deliverable_id = da.id
       WHERE da.company_id = $1
       ORDER BY dd.downloaded_at DESC
       LIMIT 5`, [companyId]);
        return {
            total_archives: parseInt(stats.total_archives, 10),
            total_size: parseInt(stats.total_size || '0', 10),
            total_downloads: parseInt(stats.total_downloads || '0', 10),
            unique_students: parseInt(stats.unique_students, 10),
            favorite_count: parseInt(stats.favorite_count, 10),
            categories: stats.categories || [],
            recent_downloads: recentDownloads.rows,
        };
    }
    /**
     * 批量操作档案
     */
    async batchUpdateArchives(archiveIds, companyId, updates) {
        const allowedFields = ['custom_category', 'tags', 'is_favorite'];
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
        values.push(archiveIds, companyId);
        const query = `
      UPDATE deliverable_archives
      SET ${fields.join(', ')}
      WHERE id = ANY($${paramIndex++}) AND company_id = $${paramIndex}
    `;
        await database_1.pool.query(query, values);
    }
}
exports.default = new DeliverableArchiveService();
//# sourceMappingURL=deliverableArchiveService.js.map