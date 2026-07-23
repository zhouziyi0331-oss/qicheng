"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const favorite_controller_1 = require("../controllers/favorite.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticateToken);
// 获取收藏统计
router.get('/stats', favorite_controller_1.favoriteController.getFavoriteStats.bind(favorite_controller_1.favoriteController));
// 获取所有分类
router.get('/categories', favorite_controller_1.favoriteController.getUserCategories.bind(favorite_controller_1.favoriteController));
// 检查是否已收藏
router.get('/check/:itemType/:itemId', favorite_controller_1.favoriteController.checkIsFavorited.bind(favorite_controller_1.favoriteController));
// 获取收藏列表
router.get('/', favorite_controller_1.favoriteController.getUserFavorites.bind(favorite_controller_1.favoriteController));
// 添加收藏
router.post('/', favorite_controller_1.favoriteController.addFavorite.bind(favorite_controller_1.favoriteController));
// 取消收藏
router.delete('/:favoriteId', favorite_controller_1.favoriteController.removeFavorite.bind(favorite_controller_1.favoriteController));
// 更新收藏笔记
router.put('/:favoriteId/note', favorite_controller_1.favoriteController.updateFavoriteNote.bind(favorite_controller_1.favoriteController));
// 更新收藏分类
router.put('/:favoriteId/category', favorite_controller_1.favoriteController.updateFavoriteCategory.bind(favorite_controller_1.favoriteController));
// 切换置顶状态
router.put('/:favoriteId/pin', favorite_controller_1.favoriteController.togglePin.bind(favorite_controller_1.favoriteController));
exports.default = router;
//# sourceMappingURL=favorite.routes.js.map