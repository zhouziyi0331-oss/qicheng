"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOPCStories = getOPCStories;
exports.reviewOPCStory = reviewOPCStory;
exports.deleteOPCStory = deleteOPCStory;
exports.getAnnouncements = getAnnouncements;
exports.createAnnouncement = createAnnouncement;
exports.updateAnnouncement = updateAnnouncement;
exports.publishAnnouncement = publishAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
exports.getBanners = getBanners;
exports.createBanner = createBanner;
exports.updateBanner = updateBanner;
exports.deleteBanner = deleteBanner;
const db_1 = require("../../utils/db");
/**
 * 获取OPC故事墙列表
 */
async function getOPCStories(req, res) {
    try {
        const { page = 1, pageSize = 20, status, keyword } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (status) {
            conditions.push(`a.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (keyword) {
            conditions.push(`(a.title LIKE $${paramIndex} OR a.content LIKE $${paramIndex})`);
            params.push(`%${keyword}%`);
            paramIndex++;
        }
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as total
       FROM articles a
       WHERE a.category = 'opc_story'
       ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}`, params);
        const total = parseInt(countResult[0].total);
        params.push(Number(pageSize), offset);
        const stories = await (0, db_1.query)(`SELECT
        a.id,
        a.author_id as user_id,
        a.title,
        a.content,
        a.cover_image,
        a.status,
        a.like_count,
        a.created_at,
        u.nickname as author_name,
        u.avatar_url as author_avatar
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.category = 'opc_story'
       ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        res.json({
            list: stories,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        });
    }
    catch (error) {
        console.error('获取OPC故事墙列表失败:', error);
        res.status(500).json({ message: '获取OPC故事墙列表失败' });
    }
}
/**
 * 审核OPC故事
 */
async function reviewOPCStory(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await (0, db_1.query)(`UPDATE articles
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2 AND category = 'opc_story'`, [status, id]);
        res.json({ message: '审核成功' });
    }
    catch (error) {
        console.error('审核OPC故事失败:', error);
        res.status(500).json({ message: '审核OPC故事失败' });
    }
}
/**
 * 删除OPC故事
 */
async function deleteOPCStory(req, res) {
    try {
        const { id } = req.params;
        await (0, db_1.query)(`UPDATE articles
       SET status = 'archived',
           updated_at = NOW()
       WHERE id = $1 AND category = 'opc_story'`, [id]);
        res.json({ message: '删除成功' });
    }
    catch (error) {
        console.error('删除OPC故事失败:', error);
        res.status(500).json({ message: '删除OPC故事失败' });
    }
}
/**
 * 获取公告列表
 */
async function getAnnouncements(req, res) {
    try {
        const { page = 1, pageSize = 20, status } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as total
       FROM announcements
       ${whereClause}`, params);
        const total = parseInt(countResult[0].total);
        params.push(Number(pageSize), offset);
        const announcements = await (0, db_1.query)(`SELECT
        id,
        title,
        content,
        type,
        target_audience,
        status,
        published_at,
        created_at
       FROM announcements
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        res.json({
            list: announcements,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        });
    }
    catch (error) {
        console.error('获取公告列表失败:', error);
        res.status(500).json({ message: '获取公告列表失败' });
    }
}
/**
 * 创建公告
 */
async function createAnnouncement(req, res) {
    try {
        const { title, content, type, targetAudience } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO announcements (title, content, type, target_audience, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING id`, [title, content, type, targetAudience]);
        res.json({ id: result[0].id, message: '公告创建成功' });
    }
    catch (error) {
        console.error('创建公告失败:', error);
        res.status(500).json({ message: '创建公告失败' });
    }
}
/**
 * 更新公告
 */
async function updateAnnouncement(req, res) {
    try {
        const { id } = req.params;
        const { title, content, type, targetAudience, status } = req.body;
        await (0, db_1.query)(`UPDATE announcements
       SET title = $1,
           content = $2,
           type = $3,
           target_audience = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6`, [title, content, type, targetAudience, status, id]);
        res.json({ message: '公告更新成功' });
    }
    catch (error) {
        console.error('更新公告失败:', error);
        res.status(500).json({ message: '更新公告失败' });
    }
}
/**
 * 发布公告
 */
async function publishAnnouncement(req, res) {
    try {
        const { id } = req.params;
        await (0, db_1.query)(`UPDATE announcements
       SET status = 'published',
           published_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`, [id]);
        // TODO: 推送通知给目标用户
        res.json({ message: '公告发布成功' });
    }
    catch (error) {
        console.error('发布公告失败:', error);
        res.status(500).json({ message: '发布公告失败' });
    }
}
/**
 * 删除公告
 */
async function deleteAnnouncement(req, res) {
    try {
        const { id } = req.params;
        await (0, db_1.query)(`DELETE FROM announcements WHERE id = $1`, [id]);
        res.json({ message: '公告删除成功' });
    }
    catch (error) {
        console.error('删除公告失败:', error);
        res.status(500).json({ message: '删除公告失败' });
    }
}
/**
 * 获取轮播图列表
 */
async function getBanners(req, res) {
    try {
        const banners = await (0, db_1.query)(`SELECT
        id,
        title,
        image_url,
        link_value as link_url,
        order_index as sort_order,
        status,
        created_at
       FROM banners
       ORDER BY order_index ASC, created_at DESC`);
        res.json({ list: banners });
    }
    catch (error) {
        console.error('获取轮播图列表失败:', error);
        res.status(500).json({ message: '获取轮播图列表失败' });
    }
}
/**
 * 创建轮播图
 */
async function createBanner(req, res) {
    try {
        const { title, imageUrl, linkUrl, sortOrder } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO banners (title, image_url, link_value, order_index, status)
       VALUES ($1, $2, $3, $4, 'published')
       RETURNING id`, [title, imageUrl, linkUrl, sortOrder || 0]);
        res.json({ id: result[0].id, message: '轮播图创建成功' });
    }
    catch (error) {
        console.error('创建轮播图失败:', error);
        res.status(500).json({ message: '创建轮播图失败' });
    }
}
/**
 * 更新轮播图
 */
async function updateBanner(req, res) {
    try {
        const { id } = req.params;
        const { title, imageUrl, linkUrl, sortOrder, status } = req.body;
        await (0, db_1.query)(`UPDATE banners
       SET title = $1,
           image_url = $2,
           link_value = $3,
           order_index = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6`, [title, imageUrl, linkUrl, sortOrder, status, id]);
        res.json({ message: '轮播图更新成功' });
    }
    catch (error) {
        console.error('更新轮播图失败:', error);
        res.status(500).json({ message: '更新轮播图失败' });
    }
}
/**
 * 删除轮播图
 */
async function deleteBanner(req, res) {
    try {
        const { id } = req.params;
        await (0, db_1.query)(`DELETE FROM banners WHERE id = $1`, [id]);
        res.json({ message: '轮播图删除成功' });
    }
    catch (error) {
        console.error('删除轮播图失败:', error);
        res.status(500).json({ message: '删除轮播图失败' });
    }
}
//# sourceMappingURL=contentController.js.map