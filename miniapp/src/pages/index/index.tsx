import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { authAPI, taskAPI, abilityAPI, opcGrowthAPI, talentAPI } from '../../services/api'
import TabBar from '../../components/TabBar'
import { DataCard } from '../../components/Card'
import Icon from '../../components/Icon'
import Button from '../../components/Button'
import RoleSelectionModal from '../../components/RoleSelectionModal'
import EnterpriseGuideModal from '../../components/EnterpriseGuideModal'
import LevelUpModal from '../../components/LevelUpModal'
import Typewriter from '../../components/Typewriter'
import catLogo from '../../assets/images/cat-logo.png'
import './index.scss'
import '../../styles/morandi-colors.scss'

interface UserInfo {
  id: number
  nickname: string
  avatar?: string
  level?: number
  experience?: number
  opcTags?: string[]
  account_type?: 'student' | 'enterprise'
  selected_track?: 'content' | 'dev'
  hasCompletedOPC?: boolean
  phone?: string
}

interface TaskPreview {
  id: string
  title: string
  price: number
  difficulty: string
}

interface StatsData {
  completedTasks: number
  totalIncome: number
  currentLevel: number
}

export default function Index() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData>({ completedTasks: 0, totalIncome: 0, currentLevel: 1 })
  const [recommendedTasks, setRecommendedTasks] = useState<TaskPreview[]>([])
  const [hasCompletedTest, setHasCompletedTest] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showEnterpriseGuide, setShowEnterpriseGuide] = useState(false)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ level: 1, title: '', message: '', privileges: [] })

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const page = Taro.getCurrentInstance().page
    if (page && typeof page.getTabBar === 'function') {
      const tabBar = page.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 0 })
      }
    }

    loadUserData()

    // 监听升级事件
    Taro.eventCenter.on('levelUp', handleLevelUpEvent)

    return () => {
      Taro.eventCenter.off('levelUp', handleLevelUpEvent)
    }
  }, [])

  useEffect(() => {
    if (!loading && user) {
      checkOnboardingFlow()
    }
  }, [loading, user])

  const checkOnboardingFlow = () => {
    if (!user) return

    // 1. 检查是否已选择身份
    if (!user.account_type) {
      setShowRoleModal(true)
      return
    }

    // 2. 企业用户显示引导（不进入测评流程）
    if (user.account_type === 'enterprise') {
      // 企业用户已完成引导，不再显示
      return
    }

    // 3. 学生：检查是否已登录（有token和手机号）
    const token = Taro.getStorageSync('access_token') || Taro.getStorageSync('accessToken')
    if (!token || !user.phone) {
      Taro.navigateTo({ url: '/packageAuth/pages/login/index?account_type=student' })
      return
    }

    // 4. 学生：检查是否已选择赛道
    if (!user.selected_track) {
      Taro.navigateTo({ url: '/packageCourse/pages/sector-hall/index' })
      return
    }

    // 5. 学生：检查是否已完成测评
    if (!user.hasCompletedOPC) {
      Taro.navigateTo({ url: '/packageOnboarding/pages/opc-test/index' })
      return
    }
  }

  const handleRoleSelect = async (role: 'student' | 'enterprise') => {
    setShowRoleModal(false)

    if (role === 'enterprise') {
      // 企业用户：显示企业版引导
      setShowEnterpriseGuide(true)

      // 保存角色到本地（不调用API，因为企业用户不在学生端注册）
      const updatedUser = {
        ...user,
        account_type: role
      }
      setUser(updatedUser as UserInfo)
      Taro.setStorageSync('userInfo', updatedUser)
    } else {
      // 学生用户：跳转到登录页面（使用正确的子包路径）
      Taro.navigateTo({ url: '/packageAuth/pages/login/index?account_type=student' })
    }
  }

  const loadUserData = async () => {
    setLoading(true)
    try {
      // 先检查是否有token，没有token就不调用API
      const token = Taro.getStorageSync('access_token')
      if (!token) {
        // 没有token，尝试从本地存储加载用户信息
        const localUser = Taro.getStorageSync('userInfo')
        if (localUser) {
          setUser(localUser)
          if (localUser.opcTags && localUser.opcTags.length > 0) {
            setHasCompletedTest(true)
          }
        }
        setLoading(false)
        return
      }

      const userRes = await authAPI.getCurrentUser()
      if (userRes.success && userRes.data) {
        setUser(userRes.data)
        Taro.setStorageSync('userInfo', userRes.data)

        if (userRes.data.opcTags && userRes.data.opcTags.length > 0) {
          setHasCompletedTest(true)
          // 并行加载推荐任务和统计数据
          Promise.all([
            loadRecommendedTasks(),
            loadStats()
          ]).catch(err => console.error('加载数据失败:', err))
        }
      } else {
        const localUser = Taro.getStorageSync('userInfo')
        if (localUser) {
          setUser(localUser)
          if (localUser.opcTags && localUser.opcTags.length > 0) {
            setHasCompletedTest(true)
          }
        }
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
      const localUser = Taro.getStorageSync('userInfo')
      if (localUser) {
        setUser(localUser)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // 模拟数据，实际应该调用API
      const mockStats = {
        completedTasks: 12,
        totalIncome: 4580,
        currentLevel: 5
      }
      setStats(mockStats)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const loadRecommendedTasks = async () => {
    try {
      const res = await taskAPI.getRecommended()
      if (res.success && res.data) {
        setRecommendedTasks(res.data.slice(0, 2))
      }
    } catch (error) {
      console.error('加载推荐任务失败:', error)
    }
  }

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  const handleLevelUpEvent = (data: any) => {
    setLevelUpData({
      level: data.level || 1,
      title: data.title || `Lv.${data.level} 解锁`,
      message: data.message || '恭喜你达成新成就！',
      privileges: data.privileges || []
    })
    setShowLevelUpModal(true)
  }

  const handleCloseLevelUpModal = () => {
    setShowLevelUpModal(false)
    // 可以跳转到成长报告页面
    // Taro.navigateTo({ url: '/pages/growth-report/index' })
  }

  const handleStartTest = () => {
    Taro.navigateTo({ url: '/pages/opc-test/index' })
  }

  const handleStartOPC = () => {
    Taro.navigateTo({ url: '/packageOnboarding/pages/opc-test/index' })
  }

  const handlePhaseClick = (phase: number) => {
    if (phase === 1) {
      // 自我探索 - 已完成，可以查看结果
      Taro.navigateTo({ url: '/packageOnboarding/pages/self-exploration/index' })
    } else if (phase === 2) {
      // 项目匹配 - 当前进行中
      Taro.switchTab({ url: '/pages/tasks/index' })
    } else if (phase === 3) {
      // 真实实践 - 查看已完成的项目汇总
      Taro.navigateTo({ url: '/packagePractice/pages/practice-list/index' })
    } else if (phase === 4) {
      // OPC 孵化 - 需要满级才能解锁
      const userLevel = user?.level || 1
      if (userLevel >= 10) {
        // 满级，跳转到大师接单页面
        Taro.navigateTo({ url: '/packageIncubation/pages/master-orders/index' })
      } else {
        Taro.showToast({
          title: '需要达到满级（Lv.10）才能解锁',
          icon: 'none',
          duration: 2000
        })
      }
    } else {
      // 后续阶段锁定
      Taro.showToast({
        title: '完成当前阶段后解锁',
        icon: 'none'
      })
    }
  }

  return (
    <View className="index-page">
      {/* 主视觉区 - 导师猫 */}
      <View className="hero-section">
        {/* 左侧黄色圆点按钮 */}
        <View
          className="surprise-dot"
          onClick={() => Taro.navigateTo({ url: '/pages/cat-secret/index' })}
        >
          <Text className="dot-icon">✦</Text>
        </View>

        <Text className="hero-page-title">启程 OPC 孵化</Text>
        <View className="mentor-cat" onClick={() => Taro.navigateTo({ url: '/pages/cat-secret/index' })}>
          <Image src={catLogo} className="cat-image" mode="aspectFit" />
        </View>
        <View className="hero-content">
          <Text className="hero-title">乘着问题，飞跃山峰</Text>
          <Text className="hero-subtitle">在真实任务中成长，让每一次尝试都成为你的勋章</Text>
        </View>
      </View>

      {/* OPC测评卡片 */}
      <View className="opc-card">
        <View className="opc-header">
          <View className="opc-icon">
            <Text className="icon-star">★</Text>
          </View>
          <View className="opc-title-wrapper">
            <Text className="opc-title">OPC 测评</Text>
            <Text className="opc-duration">38 题 · 约 15 分钟</Text>
          </View>
        </View>
        <Text className="opc-desc">发现你的独特标签，开启成长之旅。AI 将从 6 个维度深度分析你的潜力与方向。</Text>
        <View className="opc-tags">
          <View className="opc-tag">创造力</View>
          <View className="opc-tag">执行力</View>
          <View className="opc-tag">社交力</View>
          <View className="opc-tag">学习力</View>
          <View className="opc-tag">商业感知</View>
          <View className="opc-tag">抗压力</View>
        </View>
        <View className="opc-btn" onClick={handleStartOPC}>
          <Text className="btn-icon">▶</Text>
          <Text className="btn-text">开始测评</Text>
        </View>
      </View>

      {/* 探索更多 */}
      <View className="explore-section">
        <Text className="explore-title">探索更多</Text>

        {/* Phase 01 - 已完成 */}
        <View className="phase-item completed" onClick={() => handlePhaseClick(1)}>
          <View className="phase-number">01</View>
          <View className="phase-content">
            <Text className="phase-name">自我探索</Text>
            <Text className="phase-desc">OPC 测评 · 发现独特标签</Text>
          </View>
          <View className="phase-status">
            <Text className="status-icon">✓</Text>
          </View>
        </View>

        {/* Phase 02 - 进行中 */}
        <View className="phase-item active" onClick={() => handlePhaseClick(2)}>
          <View className="phase-number">02</View>
          <View className="phase-content">
            <Text className="phase-name">项目匹配</Text>
            <Text className="phase-desc">AI 智能匹配真实商业项目</Text>
          </View>
          <View className="phase-status">
            <Text className="status-icon">○</Text>
          </View>
        </View>

        {/* Phase 03 - 锁定 */}
        <View className="phase-item locked" onClick={() => handlePhaseClick(3)}>
          <View className="phase-number">03</View>
          <View className="phase-content">
            <Text className="phase-name">真实实践</Text>
            <Text className="phase-desc">完成真实项目，积累收入</Text>
          </View>
          <View className="phase-status">
            <Text className="status-icon">○</Text>
          </View>
        </View>

        {/* Phase 04 - 锁定 */}
        <View className="phase-item locked" onClick={() => handlePhaseClick(4)}>
          <View className="phase-number">04</View>
          <View className="phase-content">
            <Text className="phase-name">OPC 孵化</Text>
            <Text className="phase-desc">成为独立创业者，获得投资</Text>
          </View>
          <View className="phase-status">
            <Text className="status-icon">○</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
