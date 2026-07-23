"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoriteService = exports.FavoriteService = void 0;
const Favorite_1 = require("../models/Favorite");
const PracticeProject_1 = require("../models/PracticeProject");
const RealProject_1 = require("../models/RealProject");
const DecompositionReport_1 = require("../models/DecompositionReport");
const ComparisonReport_1 = require("../models/ComparisonReport");
const DynamicGrowthPath_1 = require("../models/DynamicGrowthPath");
const Achievement_1 = require("../models/Achievement");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 收藏系统服务
 *
 * 核心功能：用户可以收藏各种内容
 * 每个用户的收藏列表完全独立
 */
class FavoriteService {
    /**
     * 添加收藏
     */
    async addFavorite(userId, itemType, itemId, userNote, category) {
        // 获取项目快照信息
        const snapshot = await this.getItemSnapshot(itemType, itemId);
        // 检查是否已收藏
        const existing = await Favorite_1.Favorite.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            itemType,
            itemId: new mongoose_1.default.Types.ObjectId(itemId)
        });
        if (existing) {
            throw new Error('已经收藏过该内容');
        }
        // 创建收藏
        const favorite = new Favorite_1.Favorite({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            itemType,
            itemId: new mongoose_1.default.Types.ObjectId(itemId),
            snapshot,
            userNote,
            category,
            isPinned: false
        });
        await favorite.save();
        return favorite;
    }
    /**
     * 取消收藏
     */
    async removeFavorite(userId, favoriteId) {
        const result = await Favorite_1.Favorite.deleteOne({
            _id: new mongoose_1.default.Types.ObjectId(favoriteId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (result.deletedCount === 0) {
            throw new Error('收藏不存在');
        }
    }
    /**
     * 获取用户的收藏列表
     */
    async getUserFavorites(userId, filter) {
        const query = { userId: new mongoose_1.default.Types.ObjectId(userId) };
        if (filter?.itemType) {
            query.itemType = filter.itemType;
        }
        if (filter?.category) {
            query.category = filter.category;
        }
        if (filter?.isPinned !== undefined) {
            query.isPinned = filter.isPinned;
        }
        return await Favorite_1.Favorite.find(query)
            .sort({ isPinned: -1, createdAt: -1 });
    }
    /**
     * 更新收藏笔记
     */
    async updateFavoriteNote(userId, favoriteId, userNote) {
        const favorite = await Favorite_1.Favorite.findOne({
            _id: new mongoose_1.default.Types.ObjectId(favoriteId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!favorite) {
            throw new Error('收藏不存在');
        }
        favorite.userNote = userNote;
        await favorite.save();
        return favorite;
    }
    /**
     * 更新收藏分类
     */
    async updateFavoriteCategory(userId, favoriteId, category) {
        const favorite = await Favorite_1.Favorite.findOne({
            _id: new mongoose_1.default.Types.ObjectId(favoriteId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!favorite) {
            throw new Error('收藏不存在');
        }
        favorite.category = category;
        await favorite.save();
        return favorite;
    }
    /**
     * 切换置顶状态
     */
    async togglePin(userId, favoriteId) {
        const favorite = await Favorite_1.Favorite.findOne({
            _id: new mongoose_1.default.Types.ObjectId(favoriteId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!favorite) {
            throw new Error('收藏不存在');
        }
        favorite.isPinned = !favorite.isPinned;
        await favorite.save();
        return favorite;
    }
    /**
     * 获取所有收藏分类
     */
    async getUserCategories(userId) {
        const favorites = await Favorite_1.Favorite.find({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            category: { $exists: true, $ne: null }
        }).distinct('category');
        return favorites;
    }
    /**
     * 获取收藏统计
     */
    async getFavoriteStats(userId) {
        const favorites = await Favorite_1.Favorite.find({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        // 按类型统计
        const typeStats = new Map();
        for (const fav of favorites) {
            typeStats.set(fav.itemType, (typeStats.get(fav.itemType) || 0) + 1);
        }
        const byType = Array.from(typeStats.entries()).map(([type, count]) => ({
            type,
            count
        }));
        // 按分类统计
        const categoryStats = new Map();
        for (const fav of favorites) {
            if (fav.category) {
                categoryStats.set(fav.category, (categoryStats.get(fav.category) || 0) + 1);
            }
        }
        const byCategory = Array.from(categoryStats.entries()).map(([category, count]) => ({
            category,
            count
        }));
        return {
            total: favorites.length,
            byType,
            byCategory,
            pinnedCount: favorites.filter(f => f.isPinned).length
        };
    }
    /**
     * 检查是否已收藏
     */
    async isFavorited(userId, itemType, itemId) {
        const favorite = await Favorite_1.Favorite.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            itemType,
            itemId: new mongoose_1.default.Types.ObjectId(itemId)
        });
        return !!favorite;
    }
    /**
     * 获取项目快照信息（辅助方法）
     */
    async getItemSnapshot(itemType, itemId) {
        let item;
        switch (itemType) {
            case 'practice_project':
                item = await PracticeProject_1.PracticeProject.findById(itemId);
                return {
                    title: item?.title || '',
                    description: item?.description || '',
                    tags: item?.tags || []
                };
            case 'real_project':
                item = await RealProject_1.RealProject.findById(itemId);
                return {
                    title: item?.title || '',
                    description: item?.description || '',
                    tags: item?.requiredSkills || []
                };
            case 'decomposition_report':
                item = await DecompositionReport_1.DecompositionReport.findById(itemId);
                const project = await PracticeProject_1.PracticeProject.findById(item?.projectId);
                return {
                    title: `${project?.title || ''} - 拆解报告`,
                    description: item?.abilityBreakdown?.abilities?.[0]?.description || ''
                };
            case 'comparison_report':
                item = await ComparisonReport_1.ComparisonReport.findById(itemId);
                return {
                    title: `对比报告 #${item?.comparisonNumber || ''}`,
                    description: item?.analysis?.summary || ''
                };
            case 'growth_path':
                item = await DynamicGrowthPath_1.DynamicGrowthPath.findById(itemId);
                return {
                    title: `成长路径 v${item?.versionNumber || ''}`,
                    description: item?.currentState?.overallLevel || ''
                };
            case 'achievement':
                item = await Achievement_1.Achievement.findById(itemId);
                return {
                    title: item?.title || '',
                    description: item?.description || '',
                    imageUrl: item?.icon || ''
                };
            default:
                return { title: '未知项目' };
        }
    }
}
exports.FavoriteService = FavoriteService;
exports.favoriteService = new FavoriteService();
//# sourceMappingURL=favorite.service.js.map