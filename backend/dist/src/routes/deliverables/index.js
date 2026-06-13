"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deliverableArchiveService_1 = __importDefault(require("../../services/deliverableArchiveService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/deliverables/create
 * 手动创建档案
 */
router.post('/create', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以创建档案',
            });
        }
        const { task_id, student_id, title, description, category, files, tags, custom_category, company_notes, } = req.body;
        if (!task_id || !student_id || !title || !files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: task_id, student_id, title, files',
            });
        }
        const archive = await deliverableArchiveService_1.default.createArchive({
            task_id,
            company_id: companyId,
            student_id,
            title,
            description,
            category,
            files,
            tags,
            custom_category,
            company_notes,
        });
        res.json({
            success: true,
            data: archive,
            message: '档案创建成功',
        });
    }
    catch (error) {
        logger.error('创建档案失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建档案失败',
        });
    }
});
/**
 * GET /api/deliverables/list
 * 获取档案列表
 */
router.get('/list', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看档案',
            });
        }
        const { category, customCategory, tags, studentId, startDate, endDate, isFavorite, searchKeyword, limit, offset, } = req.query;
        const result = await deliverableArchiveService_1.default.getArchives({
            companyId,
            category: category,
            customCategory: customCategory,
            tags: tags ? tags.split(',') : undefined,
            studentId: studentId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            isFavorite: isFavorite === 'true',
            searchKeyword: searchKeyword,
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger.error('获取档案列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取档案列表失败',
        });
    }
});
/**
 * GET /api/deliverables/:id
 * 获取档案详情
 */
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        const archive = await deliverableArchiveService_1.default.getArchiveById(id, companyId);
        res.json({
            success: true,
            data: archive,
        });
    }
    catch (error) {
        logger.error('获取档案详情失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取档案详情失败',
        });
    }
});
/**
 * PUT /api/deliverables/:id
 * 更新档案
 */
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        const archive = await deliverableArchiveService_1.default.updateArchive(id, companyId, req.body);
        res.json({
            success: true,
            data: archive,
            message: '档案更新成功',
        });
    }
    catch (error) {
        logger.error('更新档案失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新档案失败',
        });
    }
});
/**
 * DELETE /api/deliverables/:id
 * 删除档案
 */
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        await deliverableArchiveService_1.default.deleteArchive(id, companyId);
        res.json({
            success: true,
            message: '档案删除成功',
        });
    }
    catch (error) {
        logger.error('删除档案失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除档案失败',
        });
    }
});
/**
 * POST /api/deliverables/:id/download
 * 记录下载
 */
router.post('/:id/download', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { files, method } = req.body;
        await deliverableArchiveService_1.default.recordDownload(id, userId, files || [], method || 'all');
        res.json({
            success: true,
            message: '下载记录成功',
        });
    }
    catch (error) {
        logger.error('记录下载失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '记录下载失败',
        });
    }
});
/**
 * POST /api/deliverables/:id/versions
 * 添加版本
 */
router.post('/:id/versions', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { files, change_notes } = req.body;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: files',
            });
        }
        const version = await deliverableArchiveService_1.default.addVersion(id, files, change_notes || '', userId);
        res.json({
            success: true,
            data: version,
            message: '版本添加成功',
        });
    }
    catch (error) {
        logger.error('添加版本失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '添加版本失败',
        });
    }
});
/**
 * POST /api/deliverables/categories
 * 创建自定义分类
 */
router.post('/categories/create', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { name, description, color, icon } = req.body;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以创建分类',
            });
        }
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: name',
            });
        }
        const category = await deliverableArchiveService_1.default.createCategory(companyId, name, description, color, icon);
        res.json({
            success: true,
            data: category,
            message: '分类创建成功',
        });
    }
    catch (error) {
        logger.error('创建分类失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建分类失败',
        });
    }
});
/**
 * GET /api/deliverables/categories/list
 * 获取分类列表
 */
router.get('/categories/list', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看分类',
            });
        }
        const categories = await deliverableArchiveService_1.default.getCategories(companyId);
        res.json({
            success: true,
            data: {
                categories,
                total: categories.length,
            },
        });
    }
    catch (error) {
        logger.error('获取分类列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取分类列表失败',
        });
    }
});
/**
 * PUT /api/deliverables/categories/:id
 * 更新分类
 */
router.put('/categories/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        const category = await deliverableArchiveService_1.default.updateCategory(id, companyId, req.body);
        res.json({
            success: true,
            data: category,
            message: '分类更新成功',
        });
    }
    catch (error) {
        logger.error('更新分类失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新分类失败',
        });
    }
});
/**
 * DELETE /api/deliverables/categories/:id
 * 删除分类
 */
router.delete('/categories/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        await deliverableArchiveService_1.default.deleteCategory(id, companyId);
        res.json({
            success: true,
            message: '分类删除成功',
        });
    }
    catch (error) {
        logger.error('删除分类失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除分类失败',
        });
    }
});
/**
 * POST /api/deliverables/:id/share
 * 创建分享链接
 */
router.post('/:id/share', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        const { password, expires_at, max_downloads } = req.body;
        const share = await deliverableArchiveService_1.default.createShareLink(id, companyId, {
            password,
            expiresAt: expires_at ? new Date(expires_at) : undefined,
            maxDownloads: max_downloads,
        });
        res.json({
            success: true,
            data: share,
            message: '分享链接创建成功',
        });
    }
    catch (error) {
        logger.error('创建分享链接失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建分享链接失败',
        });
    }
});
/**
 * GET /api/deliverables/share/:code
 * 获取分享内容
 */
router.get('/share/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { password } = req.query;
        const share = await deliverableArchiveService_1.default.validateShareLink(code, password);
        res.json({
            success: true,
            data: share,
        });
    }
    catch (error) {
        logger.error('获取分享内容失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取分享内容失败',
        });
    }
});
/**
 * POST /api/deliverables/share/:code/download
 * 通过分享链接下载
 */
router.post('/share/:code/download', async (req, res) => {
    try {
        const { code } = req.params;
        const { password } = req.body;
        await deliverableArchiveService_1.default.validateShareLink(code, password);
        await deliverableArchiveService_1.default.recordShareDownload(code);
        res.json({
            success: true,
            message: '下载成功',
        });
    }
    catch (error) {
        logger.error('分享下载失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '分享下载失败',
        });
    }
});
/**
 * GET /api/deliverables/stats
 * 获取档案统计
 */
router.get('/stats/overview', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看统计',
            });
        }
        const stats = await deliverableArchiveService_1.default.getArchiveStats(companyId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger.error('获取档案统计失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取档案统计失败',
        });
    }
});
/**
 * POST /api/deliverables/batch-update
 * 批量更新档案
 */
router.post('/batch-update', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { archive_ids, updates } = req.body;
        if (!archive_ids || !Array.isArray(archive_ids) || archive_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: archive_ids',
            });
        }
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少更新内容',
            });
        }
        await deliverableArchiveService_1.default.batchUpdateArchives(archive_ids, companyId, updates);
        res.json({
            success: true,
            message: '批量更新成功',
        });
    }
    catch (error) {
        logger.error('批量更新失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '批量更新失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map