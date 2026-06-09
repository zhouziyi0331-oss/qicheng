import Taro from '@tarojs/taro'
import toast from './toast'

/**
 * 页面权限配置
 * 定义每个页面需要的最低等级
 */
export const PAGE_PERMISSIONS = {
  // 社区功能 - Lv.4解锁
  '/pages/community/index': 4,
  '/pages/community/detail': 4,
  '/pages/community/create': 4,

  // 创建队伍 - Lv.6解锁
  '/pages/alliances/index': 6,

  // 毕业系统 - Lv.6解锁
  '/pages/graduation/index': 6,

  // 其他高级功能可以在这里添加
}

/**
 * 检查用户是否有权限访问页面
 * @param pagePath 页面路径
 * @returns 是否有权限
 */
export async function checkPagePermission(pagePath: string): Promise<boolean> {
  // 获取页面所需等级
  const requiredLevel = PAGE_PERMISSIONS[pagePath]

  // 如果页面没有等级限制，直接允许访问
  if (requiredLevel === undefined) {
    return true
  }

  try {
    // 获取用户当前等级
    const token = Taro.getStorageSync('token')
    if (!token) {
      // 未登录，跳转到登录页
      Taro.redirectTo({ url: '/pages/login/index' })
      return false
    }

    const res = await Taro.request({
      url: '/api/v1/user/profile',
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })

    if (res.data.success) {
      const userLevel = res.data.data.current_level || 0

      if (userLevel < requiredLevel) {
        // 等级不足，显示提示并返回首页
        toast.permissionDenied(requiredLevel)
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/index/index' })
        }, 2000)
        return false
      }

      return true
    }
  } catch (error) {
    console.error('检查页面权限失败:', error)
    return false
  }

  return false
}

/**
 * 路由守卫 Hook
 * 在页面 onLoad 中调用
 * @param pagePath 当前页面路径
 * @returns Promise<boolean> 是否允许访问
 */
export async function useRouteGuard(pagePath?: string): Promise<boolean> {
  // 如果没有传入路径，尝试获取当前页面路径
  if (!pagePath) {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    pagePath = `/${currentPage.route}`
  }

  return await checkPagePermission(pagePath)
}

/**
 * 导航前检查权限
 * 用于在跳转前检查目标页面权限
 * @param url 目标页面URL
 * @param navigateType 跳转类型 'navigateTo' | 'redirectTo' | 'switchTab'
 */
export async function navigateWithGuard(
  url: string,
  navigateType: 'navigateTo' | 'redirectTo' | 'switchTab' = 'navigateTo'
): Promise<void> {
  // 提取页面路径（去掉参数）
  const pagePath = url.split('?')[0]

  // 检查权限
  const hasPermission = await checkPagePermission(pagePath)

  if (hasPermission) {
    // 有权限，执行跳转
    switch (navigateType) {
      case 'navigateTo':
        Taro.navigateTo({ url })
        break
      case 'redirectTo':
        Taro.redirectTo({ url })
        break
      case 'switchTab':
        Taro.switchTab({ url })
        break
    }
  }
  // 如果没有权限，checkPagePermission 已经处理了提示和跳转
}

/**
 * 获取用户当前等级（缓存版本）
 * 用于快速检查，避免频繁请求
 */
let cachedUserLevel: number | null = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export async function getUserLevel(forceRefresh: boolean = false): Promise<number> {
  const now = Date.now()

  // 如果有缓存且未过期，直接返回
  if (!forceRefresh && cachedUserLevel !== null && now - cacheTime < CACHE_DURATION) {
    return cachedUserLevel
  }

  try {
    const token = Taro.getStorageSync('token')
    if (!token) return 0

    const res = await Taro.request({
      url: '/api/v1/user/profile',
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` }
    })

    if (res.data.success) {
      cachedUserLevel = res.data.data.current_level || 0
      cacheTime = now
      return cachedUserLevel
    }
  } catch (error) {
    console.error('获取用户等级失败:', error)
  }

  return 0
}

/**
 * 清除用户等级缓存
 * 在用户升级后调用
 */
export function clearUserLevelCache(): void {
  cachedUserLevel = null
  cacheTime = 0
}
