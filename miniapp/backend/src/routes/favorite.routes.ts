import { Router } from 'express'
import { favoriteController } from '../controllers/favorite.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取收藏统计
router.get('/stats', favoriteController.getFavoriteStats.bind(favoriteController))

// 获取所有分类
router.get('/categories', favoriteController.getUserCategories.bind(favoriteController))

// 检查是否已收藏
router.get('/check/:itemType/:itemId', favoriteController.checkIsFavorited.bind(favoriteController))

// 获取收藏列表
router.get('/', favoriteController.getUserFavorites.bind(favoriteController))

// 添加收藏
router.post('/', favoriteController.addFavorite.bind(favoriteController))

// 取消收藏
router.delete('/:favoriteId', favoriteController.removeFavorite.bind(favoriteController))

// 更新收藏笔记
router.put('/:favoriteId/note', favoriteController.updateFavoriteNote.bind(favoriteController))

// 更新收藏分类
router.put('/:favoriteId/category', favoriteController.updateFavoriteCategory.bind(favoriteController))

// 切换置顶状态
router.put('/:favoriteId/pin', favoriteController.togglePin.bind(favoriteController))

export default router
