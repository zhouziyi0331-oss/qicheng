import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:3000'

/**
 * 晋级验证 API
 */

interface LevelUpCheckResult {
  shouldLevelUp: boolean
  fromLevel: number
  toLevel: number
  completedCount: number
  requiredCount: number
}

interface DialogData {
  mentorText: string[]
  question: string
  options: Array<{
    letter: 'A' | 'B' | 'C' | 'D'
    text: string
  }>
  mentorReply: string
  dataCards?: Array<{
    rows: Array<{
      label: string
      value: string
      highlight?: boolean
    }>
  }>
  timeline?: Array<{
    date: string
    label: string
    isNow?: boolean
  }>
}

interface LevelUpConfirmResult {
  newLevel: number
  levelTitle: string
  unlockedPerks: string[]
}

/**
 * 检查是否满足晋级条件
 */
export async function checkLevelUp(completedOrderId?: string): Promise<LevelUpCheckResult> {
  const token = Taro.getStorageSync('token') || Taro.getStorageSync('access_token')

  const res = await Taro.request({
    url: `${BASE_URL}/api/level-up/check`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: { completedOrderId }
  })

  if (res.statusCode === 200 && res.data.success) {
    return res.data.data
  }

  throw new Error(res.data.error || '检查晋级条件失败')
}

/**
 * 获取晋级对话内容
 */
export async function getLevelDialog(fromLevel: number, toLevel: number): Promise<DialogData> {
  const token = Taro.getStorageSync('token') || Taro.getStorageSync('access_token')

  const res = await Taro.request({
    url: `${BASE_URL}/api/level-up/dialog`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: { fromLevel, toLevel }
  })

  if (res.statusCode === 200 && res.data.success) {
    return res.data.data
  }

  throw new Error(res.data.error || '获取对话内容失败')
}

/**
 * 提交晋级答案
 */
export async function submitAnswer(
  fromLevel: number,
  toLevel: number,
  selectedOption: string
): Promise<void> {
  const token = Taro.getStorageSync('token') || Taro.getStorageSync('access_token')

  const res = await Taro.request({
    url: `${BASE_URL}/api/level-up/answer`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: { fromLevel, toLevel, selectedOption }
  })

  if (res.statusCode === 200 && res.data.success) {
    return
  }

  throw new Error(res.data.error || '提交答案失败')
}

/**
 * 确认晋级
 */
export async function confirmLevelUp(toLevel: number): Promise<LevelUpConfirmResult> {
  const token = Taro.getStorageSync('token') || Taro.getStorageSync('access_token')

  const res = await Taro.request({
    url: `${BASE_URL}/api/level-up/confirm`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: { toLevel }
  })

  if (res.statusCode === 200 && res.data.success) {
    return res.data.data
  }

  throw new Error(res.data.error || '确认晋级失败')
}

export const levelUpAPI = {
  checkLevelUp,
  getLevelDialog,
  submitAnswer,
  confirmLevelUp
}
