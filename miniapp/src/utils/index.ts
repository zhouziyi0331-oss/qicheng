import Taro from '@tarojs/taro'

// 检查登录状态
export function checkLogin(): boolean {
  const token = Taro.getStorageSync('token')
  if (!token) {
    Taro.showModal({
      title: '提示',
      content: '请先登录',
      success: (res) => {
        if (res.confirm) {
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      }
    })
    return false
  }
  return true
}

// 获取用户信息
export function getUserInfo() {
  return Taro.getStorageSync('user') || null
}

// 保存用户信息
export function saveUserInfo(user: any, token: string) {
  Taro.setStorageSync('user', user)
  Taro.setStorageSync('token', token)
}

// 清除用户信息
export function clearUserInfo() {
  Taro.removeStorageSync('user')
  Taro.removeStorageSync('token')
}

// 格式化时间
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

// 格式化金额
export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

// OPC标签颜色映射
export function getOPCColor(tag: string): string {
  if (tag.startsWith('O')) return '#FF6B9D' // 粉色
  if (tag.startsWith('P')) return '#8B5CF6' // 紫色
  if (tag.startsWith('C')) return '#06B6D4' // 青色
  return '#8B949E' // 灰色
}

// 任务状态文本
export function getTaskStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'open': '招募中',
    'in_progress': '进行中',
    'submitted': '已提交',
    'completed': '已完成',
    'rejected': '已打回'
  }
  return statusMap[status] || status
}

// 任务状态颜色
export function getTaskStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'open': '#10B981',
    'in_progress': '#F59E0B',
    'submitted': '#3B82F6',
    'completed': '#8B5CF6',
    'rejected': '#EF4444'
  }
  return colorMap[status] || '#8B949E'
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function(...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= wait) {
      func(...args)
      lastTime = now
    }
  }
}
