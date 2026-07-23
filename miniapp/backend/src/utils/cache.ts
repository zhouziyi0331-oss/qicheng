/**
 * Redis缓存工具
 * 用于缓存AI生成结果，避免重复生成
 */

interface CacheItem {
  data: any
  expireAt: number
}

class CacheManager {
  private cache: Map<string, CacheItem> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 每小时清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（秒），默认1小时
   */
  set(key: string, data: any, ttl: number = 3600): void {
    const expireAt = Date.now() + ttl * 1000
    this.cache.set(key, { data, expireAt })
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据，如果不存在或已过期返回null
   */
  get(key: string): any | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`✓ 清理了 ${cleanedCount} 个过期缓存`)
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * 停止清理定时器
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
  }
}

// 导出单例
export const cacheManager = new CacheManager()

// 生成缓存键的辅助函数
export const generateCacheKey = {
  decompositionReport: (projectId: string) => `decomposition:${projectId}`,
  practiceList: (userId: string, status?: string, track?: string) =>
    `practice:list:${userId}:${status || 'all'}:${track || 'all'}`,
  practiceStats: (userId: string) => `practice:stats:${userId}`,
  partnerList: (userId: string) => `partners:${userId}`
}
