"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const portfolioService_1 = __importDefault(require("../../services/portfolioService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/portfolio/create
 * 创建作品集
 */
router.post('/create', auth_1.authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'student') {
            return res.status(403).json({
                success: false,
                message: '只有学生可以创建作品集',
            });
        }
        const { title, description, category, tech_stack, cover_image, images, video_url, demo_url, github_url, role, duration_days, highlights, challenges_overcome, is_public, display_order, } = req.body;
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: title, description, category',
            });
        }
        const portfolio = await portfolioService_1.default.createPortfolio({
            student_id: studentId,
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
            is_public,
            display_order,
        });
        res.json({
            success: true,
            data: portfolio,
            message: '作品集创建成功',
        });
    }
    catch (error) {
        console.error('创建作品集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建作品集失败',
        });
    }
});
/**
 * GET /api/portfolio/list
 * 获取作品集列表
 */
router.get('/list', async (req, res) => {
    try {
        const { studentId, category, tags, isPublic, status, limit, offset } = req.query;
        const portfolios = await portfolioService_1.default.getPortfolios({
            studentId: studentId,
            category: category,
            tags: tags ? tags.split(',') : undefined,
            isPublic: isPublic === 'true',
            status: status,
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
        });
        res.json({
            success: true,
            data: {
                portfolios,
                total: portfolios.length,
            },
        });
    }
    catch (error) {
        console.error('获取作品集列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取作品集列表失败',
        });
    }
});
/**
 * GET /api/portfolio/:id
 * 获取作品集详情
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const viewerId = req.user?.id;
        const viewerRole = req.user?.role;
        const portfolio = await portfolioService_1.default.getPortfolioById(id, viewerId);
        // 记录浏览
        await portfolioService_1.default.recordView(id, viewerId, viewerRole);
        res.json({
            success: true,
            data: portfolio,
        });
    }
    catch (error) {
        console.error('获取作品集详情失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取作品集详情失败',
        });
    }
});
/**
 * PUT /api/portfolio/:id
 * 更新作品集
 */
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'student') {
            return res.status(403).json({
                success: false,
                message: '只有学生可以更新作品集',
            });
        }
        // 验证所有权
        const checkResult = await req.app.locals.pool.query(`SELECT student_id FROM student_portfolios WHERE id = $1`, [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '作品集不存在',
            });
        }
        if (checkResult.rows[0].student_id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权更新该作品集',
            });
        }
        const portfolio = await portfolioService_1.default.updatePortfolio(id, req.body);
        res.json({
            success: true,
            data: portfolio,
            message: '作品集更新成功',
        });
    }
    catch (error) {
        console.error('更新作品集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新作品集失败',
        });
    }
});
/**
 * DELETE /api/portfolio/:id
 * 删除作品集
 */
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'student') {
            return res.status(403).json({
                success: false,
                message: '只有学生可以删除作品集',
            });
        }
        await portfolioService_1.default.deletePortfolio(id, studentId);
        res.json({
            success: true,
            message: '作品集删除成功',
        });
    }
    catch (error) {
        console.error('删除作品集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除作品集失败',
        });
    }
});
/**
 * POST /api/portfolio/:id/like
 * 点赞/取消点赞
 */
router.post('/:id/like', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await portfolioService_1.default.toggleLike(id, userId);
        res.json({
            success: true,
            data: result,
            message: result.liked ? '点赞成功' : '取消点赞成功',
        });
    }
    catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '点赞操作失败',
        });
    }
});
/**
 * POST /api/portfolio/:id/tags
 * 添加标签
 */
router.post('/:id/tags', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;
        const { tags } = req.body;
        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'tags必须是数组',
            });
        }
        // 验证所有权
        const checkResult = await req.app.locals.pool.query(`SELECT student_id FROM student_portfolios WHERE id = $1`, [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '作品集不存在',
            });
        }
        if (checkResult.rows[0].student_id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权添加标签',
            });
        }
        await portfolioService_1.default.addTags(id, tags);
        res.json({
            success: true,
            message: '标签添加成功',
        });
    }
    catch (error) {
        console.error('添加标签失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '添加标签失败',
        });
    }
});
/**
 * DELETE /api/portfolio/:id/tags/:tagName
 * 删除标签
 */
router.delete('/:id/tags/:tagName', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id, tagName } = req.params;
        const studentId = req.user.id;
        // 验证所有权
        const checkResult = await req.app.locals.pool.query(`SELECT student_id FROM student_portfolios WHERE id = $1`, [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '作品集不存在',
            });
        }
        if (checkResult.rows[0].student_id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权删除标签',
            });
        }
        await portfolioService_1.default.removeTag(id, tagName);
        res.json({
            success: true,
            message: '标签删除成功',
        });
    }
    catch (error) {
        console.error('删除标签失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除标签失败',
        });
    }
});
/**
 * GET /api/portfolio/student/:studentId/stats
 * 获取学生作品集统计
 */
router.get('/student/:studentId/stats', async (req, res) => {
    try {
        const { studentId } = req.params;
        const stats = await portfolioService_1.default.getStudentPortfolioStats(studentId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('获取作品集统计失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取作品集统计失败',
        });
    }
});
/**
 * GET /api/portfolio/trending
 * 获取热门作品集
 */
router.get('/trending/list', async (req, res) => {
    try {
        const { limit } = req.query;
        const portfolios = await portfolioService_1.default.getTrendingPortfolios(limit ? parseInt(limit, 10) : 10);
        res.json({
            success: true,
            data: {
                portfolios,
                total: portfolios.length,
            },
        });
    }
    catch (error) {
        console.error('获取热门作品集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取热门作品集失败',
        });
    }
});
/**
 * GET /api/portfolio/search
 * 搜索作品集
 */
router.get('/search/query', async (req, res) => {
    try {
        const { keyword, limit } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: '缺少搜索关键词',
            });
        }
        const portfolios = await portfolioService_1.default.searchPortfolios(keyword, limit ? parseInt(limit, 10) : 20);
        res.json({
            success: true,
            data: {
                portfolios,
                total: portfolios.length,
            },
        });
    }
    catch (error) {
        console.error('搜索作品集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '搜索作品集失败',
        });
    }
});
/**
 * POST /api/portfolio/:id/review
 * 审核作品集（管理员）
 */
router.post('/:id/review', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const reviewerId = req.user.id;
        const userRole = req.user.role;
        const { status, review_notes } = req.body;
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以审核作品集',
            });
        }
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'status必须是approved或rejected',
            });
        }
        const portfolio = await portfolioService_1.default.reviewPortfolio(id, reviewerId, status, review_notes);
        res.json({
            success: true,
            data: portfolio,
            message: '审核成功',
        });
    }
    catch (error) {
        console.error('审核作品集失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '审核作品集失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map