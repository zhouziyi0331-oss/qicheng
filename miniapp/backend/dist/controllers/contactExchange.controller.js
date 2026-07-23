"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactExchangeController = exports.ContactExchangeController = void 0;
const User_1 = require("../models/User");
const Collaboration_1 = require("../models/Collaboration");
const ContactExchange_1 = require("../models/ContactExchange");
class ContactExchangeController {
    /**
     * GET /api/contact-exchange/partners
     * 获取合作伙伴列表
     */
    async getPartners(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            // 1. 查找所有合作记录
            const collaborations = await Collaboration_1.Collaboration.find({
                $or: [
                    { masterId: userId, status: 'completed' },
                    { studentId: userId, status: 'completed' }
                ]
            }).lean();
            // 2. 统计每个合作伙伴的合作次数
            const partnerStats = new Map();
            collaborations.forEach(collab => {
                const partnerId = collab.masterId === userId ? collab.studentId : collab.masterId;
                partnerStats.set(partnerId, (partnerStats.get(partnerId) || 0) + 1);
            });
            // 3. 获取所有合作伙伴的详细信息
            const partnerIds = Array.from(partnerStats.keys());
            const partners = await User_1.User.find({ _id: { $in: partnerIds } }).lean();
            // 4. 查询交换状态
            const exchanges = await ContactExchange_1.ContactExchange.find({
                $or: [
                    { requesterId: userId, partnerId: { $in: partnerIds } },
                    { partnerId: userId, requesterId: { $in: partnerIds } }
                ]
            }).lean();
            const exchangeMap = new Map();
            exchanges.forEach(ex => {
                const partnerId = ex.requesterId === userId ? ex.partnerId : ex.requesterId;
                exchangeMap.set(partnerId, ex);
            });
            // 5. 组装返回数据
            const formattedPartners = await Promise.all(partners.map(async (partner) => {
                const partnerId = partner._id.toString();
                const collaborationCount = partnerStats.get(partnerId) || 0;
                const exchange = exchangeMap.get(partnerId);
                // 获取合作项目列表
                const partnerCollabs = await Collaboration_1.Collaboration.find({
                    $or: [
                        { masterId: userId, studentId: partnerId },
                        { studentId: userId, masterId: partnerId }
                    ],
                    status: 'completed'
                }).limit(5).lean();
                // 计算平均评分
                const ratings = partnerCollabs.filter(c => c.rating).map(c => c.rating);
                const avgRating = ratings.length > 0
                    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                    : 5.0;
                return {
                    id: partnerId,
                    name: partner.nickname,
                    avatar: partner.avatar,
                    company: partner.company || '未填写',
                    track: partner.track || 'content',
                    level: partner.level,
                    collaborationCount,
                    rating: Math.round(avgRating * 10) / 10,
                    totalAmount: collaborationCount * 5000, // 估算
                    projects: partnerCollabs.map(c => ({
                        title: `项目 ${c.projectId}`,
                        status: c.status
                    })),
                    exchangeStatus: this.getExchangeStatusHelper(exchange, userId),
                    myConfirmed: this.isMyConfirmed(exchange, userId),
                    partnerConfirmed: this.isPartnerConfirmed(exchange, userId)
                };
            }));
            // 排序：合作次数多的在前
            formattedPartners.sort((a, b) => b.collaborationCount - a.collaborationCount);
            res.json({ partners: formattedPartners });
        }
        catch (error) {
            console.error('获取合作伙伴列表失败:', error);
            res.status(500).json({ error: '获取合作伙伴列表失败' });
        }
    }
    /**
     * POST /api/contact-exchange/request
     * 请求交换联系方式
     */
    async requestExchange(req, res) {
        try {
            const { partnerId } = req.body;
            const userId = req.userId;
            if (!partnerId) {
                return res.status(400).json({ error: '缺少partnerId参数' });
            }
            // 1. 验证合作次数
            const collaborationCount = await Collaboration_1.Collaboration.countDocuments({
                $or: [
                    { masterId: userId, studentId: partnerId, status: 'completed' },
                    { studentId: userId, masterId: partnerId, status: 'completed' }
                ]
            });
            if (collaborationCount < 2) {
                return res.status(400).json({ error: '合作次数不足2次，无法申请交换' });
            }
            // 2. 检查是否已有交换记录
            let exchange = await ContactExchange_1.ContactExchange.findOne({
                $or: [
                    { requesterId: userId, partnerId },
                    { requesterId: partnerId, partnerId: userId }
                ]
            });
            if (exchange) {
                if (exchange.status === 'confirmed') {
                    return res.status(400).json({ error: '已经交换过联系方式' });
                }
                // 更新现有记录
                if (exchange.requesterId === userId) {
                    exchange.requesterConfirmed = true;
                }
                else {
                    exchange.partnerConfirmed = true;
                }
            }
            else {
                // 创建新的交换请求
                exchange = new ContactExchange_1.ContactExchange({
                    requesterId: userId,
                    partnerId,
                    collaborationCount,
                    requesterConfirmed: true,
                    partnerConfirmed: false,
                    status: 'pending'
                });
            }
            // 检查双方是否都确认
            if (exchange.requesterConfirmed && exchange.partnerConfirmed) {
                exchange.status = 'confirmed';
                exchange.confirmedAt = new Date();
                // 获取双方联系方式
                const [requester, partner] = await Promise.all([
                    User_1.User.findById(exchange.requesterId),
                    User_1.User.findById(exchange.partnerId)
                ]);
                exchange.exchangedContact = {
                    requesterContact: requester?.wechatId || requester?.phone || '未填写',
                    partnerContact: partner?.wechatId || partner?.phone || '未填写'
                };
            }
            await exchange.save();
            res.json({
                success: true,
                message: exchange.status === 'confirmed' ? '交换成功' : '请求已发送，等待对方确认',
                status: exchange.status
            });
        }
        catch (error) {
            console.error('请求交换失败:', error);
            res.status(500).json({ error: '请求交换失败' });
        }
    }
    /**
     * POST /api/contact-exchange/confirm
     * 确认交换（与request相同逻辑）
     */
    async confirmExchange(req, res) {
        return this.requestExchange(req, res);
    }
    /**
     * GET /api/contact-exchange/status/:partnerId
     * 查询交换状态
     */
    async getExchangeStatus(req, res) {
        try {
            const { partnerId } = req.params;
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const exchange = await ContactExchange_1.ContactExchange.findOne({
                $or: [
                    { requesterId: userId, partnerId },
                    { requesterId: partnerId, partnerId: userId }
                ]
            }).lean();
            if (!exchange) {
                return res.json({
                    status: 'not_requested',
                    myConfirmed: false,
                    partnerConfirmed: false
                });
            }
            res.json({
                status: exchange.status,
                myConfirmed: this.isMyConfirmed(exchange, userId),
                partnerConfirmed: this.isPartnerConfirmed(exchange, userId),
                requestedAt: exchange.requestedAt,
                confirmedAt: exchange.confirmedAt
            });
        }
        catch (error) {
            console.error('查询交换状态失败:', error);
            res.status(500).json({ error: '查询交换状态失败' });
        }
    }
    /**
     * GET /api/contact-exchange/contact/:partnerId
     * 获取已交换的联系方式
     */
    async getExchangedContact(req, res) {
        try {
            const { partnerId } = req.params;
            const userId = req.userId;
            const exchange = await ContactExchange_1.ContactExchange.findOne({
                $or: [
                    { requesterId: userId, partnerId },
                    { requesterId: partnerId, partnerId: userId }
                ]
            }).lean();
            if (!exchange) {
                return res.status(404).json({ error: '未找到交换记录' });
            }
            if (exchange.status !== 'confirmed') {
                return res.status(403).json({ error: '尚未完成交换' });
            }
            // 返回对方的联系方式
            const isRequester = exchange.requesterId === userId;
            const partnerContact = isRequester
                ? exchange.exchangedContact?.partnerContact
                : exchange.exchangedContact?.requesterContact;
            res.json({
                partnerId,
                contact: partnerContact,
                exchangedAt: exchange.confirmedAt
            });
        }
        catch (error) {
            console.error('获取联系方式失败:', error);
            res.status(500).json({ error: '获取联系方式失败' });
        }
    }
    // 辅助方法
    getExchangeStatusHelper(exchange, userId) {
        if (!exchange)
            return 'available';
        if (exchange.status === 'confirmed')
            return 'confirmed';
        return 'pending';
    }
    isMyConfirmed(exchange, userId) {
        if (!exchange)
            return false;
        return exchange.requesterId === userId
            ? exchange.requesterConfirmed
            : exchange.partnerConfirmed;
    }
    isPartnerConfirmed(exchange, userId) {
        if (!exchange)
            return false;
        return exchange.requesterId === userId
            ? exchange.partnerConfirmed
            : exchange.requesterConfirmed;
    }
}
exports.ContactExchangeController = ContactExchangeController;
exports.contactExchangeController = new ContactExchangeController();
//# sourceMappingURL=contactExchange.controller.js.map