import Taro from '@tarojs/taro'
import { getApiUrl } from '../config'

/**
 * 跳级系统 API 服务
 */

// ==================== 类型定义 ====================

export interface SkipLevelEligibility {
  eligible: boolean
  currentLevel: number
  currentLevelName: string
  reason?: string
  canSkipTo: number[]
  cooldownLevels?: number
}

export interface SkipLevelApplication {
  targetLevel: number
  taskId: string
  deadline: string
}

export interface SkipLevelTask {
  id: string
  fromLevel: number
  toLevel: number
  name: string
  description: string
  requirements: {
    id: number
    icon: string
    text: string
  }[]
  deadline: number
  trackName: string
  passScore: number
}

export interface SubTask {
  id: number
  name: string
  desc: string
  xp: number
  status: 'done' | 'active' | 'locked'
  progress?: number
}

export interface SkipLevelProgress {
  taskId: string
  fromLevel: number
  toLevel: number
  trackName: string
  daysLeft: number
  totalProgress: number
  completedTasks: number
  totalTasks: number
  subTasks: SubTask[]
}

export interface ScoreBreakdown {
  name: string
  score: number
  color: string
}

export interface SkipLevelScore {
  totalScore: number
  passed: boolean
  passLine: number
  breakdown: ScoreBreakdown[]
  mentorName: string
  mentorRole: string
  mentorComment: string
}

export interface SkipLevelRewards {
  xp: number
  bonus: number
  badge: string
}

export interface WeakItem {
  name: string
  score: number
  gap: number
  tip: string
  color: string
}

export interface Suggestion {
  icon: string
  iconBg: string
  name: string
  desc: string
  tag: string
  tagColor: string
}

export interface ImprovementGuide {
  weakItems: WeakItem[]
  suggestions: Suggestion[]
}

// ==================== API 函数 ====================

/**
 * 检查跳级资格
 */
export async function checkSkipLevelEligibility(): Promise<SkipLevelEligibility> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/eligibility`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('获取跳级资格失败')
  } catch (error) {
    console.error('检查跳级资格失败:', error)
    throw error
  }
}

/**
 * 申请跳级
 */
export async function applySkipLevel(targetLevel: number): Promise<SkipLevelApplication> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/apply`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { targetLevel }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('申请跳级失败')
  } catch (error) {
    console.error('申请跳级失败:', error)
    throw error
  }
}

/**
 * 获取跳级任务详情
 */
export async function getSkipLevelTask(taskId: string): Promise<SkipLevelTask> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/task/${taskId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('获取任务详情失败')
  } catch (error) {
    console.error('获取任务详情失败:', error)
    throw error
  }
}

/**
 * 领取跳级任务
 */
export async function receiveSkipLevelTask(taskId: string): Promise<{ success: boolean }> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/task/${taskId}/receive`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('领取任务失败')
  } catch (error) {
    console.error('领取任务失败:', error)
    throw error
  }
}

/**
 * 获取跳级任务进度
 */
export async function getSkipLevelProgress(taskId: string): Promise<SkipLevelProgress> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/progress/${taskId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('获取任务进度失败')
  } catch (error) {
    console.error('获取任务进度失败:', error)
    throw error
  }
}

/**
 * 更新子任务进度
 */
export async function updateSubTaskProgress(
  taskId: string,
  subTaskId: number,
  progress: number
): Promise<{ success: boolean }> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/progress/${taskId}/subtask/${subTaskId}`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { progress }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('更新进度失败')
  } catch (error) {
    console.error('更新进度失败:', error)
    throw error
  }
}

/**
 * 提交作品
 */
export async function submitWork(
  taskId: string,
  workData: {
    type: 'image' | 'link'
    content: string[]
  }
): Promise<{ success: boolean }> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/submit/${taskId}`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: workData
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('提交作品失败')
  } catch (error) {
    console.error('提交作品失败:', error)
    throw error
  }
}

/**
 * 申请评分
 */
export async function requestScore(taskId: string): Promise<{ success: boolean }> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/score/${taskId}/request`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('申请评分失败')
  } catch (error) {
    console.error('申请评分失败:', error)
    throw error
  }
}

/**
 * 获取评分结果
 */
export async function getSkipLevelScore(taskId: string): Promise<SkipLevelScore> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/score/${taskId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('获取评分结果失败')
  } catch (error) {
    console.error('获取评分结果失败:', error)
    throw error
  }
}

/**
 * 获取跳级奖励
 */
export async function getSkipLevelRewards(taskId: string): Promise<SkipLevelRewards> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/rewards/${taskId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('获取奖励失败')
  } catch (error) {
    console.error('获取奖励失败:', error)
    throw error
  }
}

/**
 * 领取跳级奖励
 */
export async function claimSkipLevelRewards(taskId: string): Promise<{ success: boolean }> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/rewards/${taskId}/claim`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('领取奖励失败')
  } catch (error) {
    console.error('领取奖励失败:', error)
    throw error
  }
}

/**
 * 获取改进建议
 */
export async function getImprovementGuide(taskId: string): Promise<ImprovementGuide> {
  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `${getApiUrl()}/api/skip-level/improvement/${taskId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200) {
      return response.data
    }
    throw new Error('获取改进建议失败')
  } catch (error) {
    console.error('获取改进建议失败:', error)
    throw error
  }
}

export default {
  checkSkipLevelEligibility,
  applySkipLevel,
  getSkipLevelTask,
  receiveSkipLevelTask,
  getSkipLevelProgress,
  updateSubTaskProgress,
  submitWork,
  requestScore,
  getSkipLevelScore,
  getSkipLevelRewards,
  claimSkipLevelRewards,
  getImprovementGuide
}
