import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { authAPI, abilityAPI, withdrawAPI, levelAPI, talentAPI } from '../../services/api'
import TabBar from '../../components/TabBar'
import { DataCard } from '../../components/Card'
import Icon from '../../components/Icon'
import Loading from '../../components/Loading'
import Typewriter from '../../components/Typewriter'
import '../../styles/morandi-colors.scss'
import './index.scss'

interface MenuItem {
  title: string
  icon: string
  path: string
  desc?: string
}

interface MenuCategory {
  title: string
  icon: string
  items: MenuItem[]
}

// 7种身份类型定义
const IDENTITY_TYPES = [
  { id: 0, name: '视觉叙事者', en: 'Visual Storyteller', icon: '◆', badgeGradient: 'linear-gradient(135deg, #BC6446, #D88760)' },
  { id: 1, name: '系统构建者', en: 'System Builder', icon: '▲', badgeGradient: 'linear-gradient(135deg, #3A8A84, #5ABFB8)' },
  { id: 2, name: '创意执行者', en: 'Creative Executor', icon: '○', badgeGradient: 'linear-gradient(135deg, #9B8EC4, #C4B8E8)' },
  { id: 3, name: '逻辑拆解者', en: 'Logic Analyzer', icon: '◇', badgeGradient: 'linear-gradient(135deg, #5B8FAB, #93AEC1)' },
  { id: 4, name: '稳健交付者', en: 'Reliable Deliverer', icon: '▼', badgeGradient: 'linear-gradient(135deg, #3A8A84, #BED7D1)' },
  { id: 5, name: '探索整合者', en: 'Explorer Integrator', icon: '◈', badgeGradient: 'linear-gradient(135deg, #BF9E71, #F2CD78)' },
  { id: 6, name: '冒险驱动者', en: 'Risk Taker', icon: '◐', badgeGradient: 'linear-gradient(135deg, #D97757, #F2A07B)' }
]

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [radarData, setRadarData] = useState<any>(null)
  const [talentStats, setTalentStats] = useState<any>(null)
  const [topTalents, setTopTalents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [userIdentity, setUserIdentity] = useState(IDENTITY_TYPES[0])

  useEffect(() => {
    // 更新自定义 TabBar 选中状态（移除社区后，"我的"是第4个，索引为4，因为中间有导师按钮）
    const page = Taro.getCurrentInstance().page
    if (page && typeof page.getTabBar === 'function') {
      const tabBar = page.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 4 })
      }
    }

    loadUserData()
    checkLevelUp()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // 先从本地获取用户信息或使用默认值
      const localUser = Taro.getStorageSync('user')
      if (localUser) {
        setUser(localUser)
      } else {
        // 设置默认用户，避免一直加载
        setUser({
          nickname: '启程用户',
          opc_tags: []
        })
      }

      // 设置默认数据，确保页面能正常显示
      setBalance(2480.50)
      setTotalIncome(8640)
      setRadarData({
        identityType: 0,
        identityName: '视觉叙事者',
        dimensions: {
          '信息处理': 0,
          '创作驱动': 0,
          '工具学习': 0,
          '任务执行': 0,
          '协作倾向': 0,
          '风险态度': 0
        },
        level: 1,
        exp: 0,
        max_exp: 100,
        completed_tasks: 0,
        ongoing_tasks: 0,
        stories: 0
      })
      setLoading(false)

      // 检查是否有token，没有token就不调用API
      const token = Taro.getStorageSync('access_token')
      if (!token) {
        return
      }

      // 尝试从API获取最新数据
      try {
        const [userRes, balanceRes, radarRes, talentStatsRes, talentProfileRes] = await Promise.all([
          authAPI.getCurrentUser().catch(() => null),
          withdrawAPI.getBalance().catch(() => ({ balance: 0 })),
          abilityAPI.getRadar().catch(() => null),
          talentAPI.getStats().catch(() => null),
          talentAPI.getProfile().catch(() => null)
        ])

        if (userRes) {
          setUser(userRes.user)
          Taro.setStorageSync('user', userRes.user)
        }
        if (balanceRes) {
          setBalance(balanceRes.balance || 2480.50)
          setTotalIncome(balanceRes.totalIncome || 8640)
        }
        if (radarRes && radarRes.data) {
          setRadarData(radarRes.data)
          // 后端已经返回身份类型，直接使用
          if (radarRes.data.identityType !== undefined) {
            const identityId = radarRes.data.identityType
            setUserIdentity(IDENTITY_TYPES[identityId] || IDENTITY_TYPES[0])
          }
        }

        // 加载天赋统计
        if (talentStatsRes?.success && talentStatsRes.data) {
          setTalentStats(talentStatsRes.data)
        }

        // 加载核心天赋（用于展示）
        if (talentProfileRes?.success && talentProfileRes.data?.talents) {
          const coreTalents = talentProfileRes.data.talents
            .filter((t: any) => t.strength_level === 'core' || t.strength_level === 'prominent')
            .slice(0, 3)
          setTopTalents(coreTalents)
        }
      } catch (apiError) {
        console.error('API调用失败，使用默认数据:', apiError)
        // API失败时已经设置了默认数据，不需要额外处理
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
      // 确保即使出错也显示默认用户
      setUser({
        nickname: '启程用户',
        opc_tags: []
      })
      setBalance(0)
      setRadarData({
        level: 1,
        exp: 0,
        max_exp: 100,
        completed_tasks: 0,
        ongoing_tasks: 0,
        stories: 0,
        dimensions: {}
      })
    } finally {
      setLoading(false)
    }
  }

  const checkLevelUp = async () => {
    try {
      const res = await levelAPI.checkLevelUp()
      if (res.success && res.levelUp) {
        setNewLevel(res.newLevel)
        setShowLevelUp(true)
      }
    } catch (error) {
      console.error('检查升级失败:', error)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('user')
          Taro.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  }

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }

  const menuCategories: MenuCategory[] = []

  if (loading || !user) {
    return <Loading text="加载中..." />
  }

  const expPercent = radarData ? (radarData.exp / radarData.max_exp) * 100 : 0

  return (
    <View className="profile-page">
      <ScrollView scrollY className="profile-scroll">
        {/* 顶部用户问候 */}
        <View className="user-greeting-section">
          <View className="greeting-left">
            <Text className="greeting-time">{getGreeting()}，{user?.nickname || '启程用户'}</Text>
            <Text className="greeting-days">今天是你加入启程的第 {radarData?.level || 1} 天</Text>
          </View>
          <View className="avatar-and-badge">
            <View
              className="user-avatar-circle"
              onClick={() => handleNavigate('/packageOther/pages/settings/index')}
            >
              {user?.avatar ? (
                <Image src={user.avatar} className="avatar-image" mode="aspectFill" />
              ) : (
                <Text className="avatar-initial">{user?.nickname?.charAt(0) || '启'}</Text>
              )}
            </View>
            <View
              className="identity-badge"
              onClick={() => handleNavigate('/packageOnboarding/pages/my-radar/index')}
            >
              <Text className="identity-icon">◆</Text>
            </View>
          </View>
        </View>

        {/* 身份标签卡片 */}
        <View
          className="identity-label-card"
          onClick={() => handleNavigate('/packageOnboarding/pages/identity-intro/index')}
        >
          <View className="identity-left">
            <View className="identity-icon-box" style={{ background: userIdentity.badgeGradient }}>
              <Text className="identity-icon-large">{userIdentity.icon}</Text>
            </View>
            <View className="identity-info">
              <Text className="identity-name">{userIdentity.name}</Text>
              <Text className="identity-en">{userIdentity.en}</Text>
            </View>
          </View>
          <Text className="identity-arrow">›</Text>
        </View>

        {/* AI导师在线提示卡片 */}
        <View className="ai-mentor-tip" onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>
          <View className="tip-icon">
            <Text className="icon-bubble">●</Text>
          </View>
          <View className="tip-content">
            <Text className="tip-title">AI 导师在线</Text>
            <Text className="tip-subtitle">根据你的能力，推荐了 3 个新项目</Text>
          </View>
          <View className="tip-arrow">▶</View>
        </View>

        {/* 数据卡片区 - 三栏布局 */}
        <View className="stats-cards">
          <View className="stat-card" onClick={() => handleNavigate('/packageTask/pages/tasks/completed')}>
            <View className="stat-icon-wrapper stat-icon-check">
              <Text className="stat-icon">✓</Text>
            </View>
            <Text className="stat-value">{radarData?.completed_tasks || 3}</Text>
            <Text className="stat-label">完成任务</Text>
          </View>
          <View className="stat-card" onClick={() => handleNavigate('/packageOther/pages/my-wallet/index')}>
            <View className="stat-icon-wrapper stat-icon-money">
              <Text className="stat-icon">¥</Text>
            </View>
            <Text className="stat-value">¥{totalIncome.toLocaleString()}</Text>
            <Text className="stat-label">总收入</Text>
          </View>
          <View className="stat-card" onClick={() => handleNavigate('/packageAdvanced/pages/level-detail/index?level=2&track=content')}>
            <View className="stat-icon-wrapper stat-icon-star">
              <Text className="stat-icon">★</Text>
            </View>
            <Text className="stat-value">Lv.{radarData?.level || 1}</Text>
            <Text className="stat-label">当前等级</Text>
          </View>
        </View>

        {/* 当前阶段大卡片 */}
        <View className="phase-card" onClick={() => handleNavigate('/packageTask/pages/tasks/progress')}>
          <View className="phase-badge">当前阶段</View>
          <Text className="phase-title">Phase 02 · 任务汇总</Text>
          <Text className="phase-subtitle">查看你正在进行的任务和完成情况</Text>
          <View className="phase-progress">
            <View className="progress-bar">
              <View className="progress-fill" style={{ width: '35%' }}></View>
            </View>
            <Text className="progress-text">进度 35% · 2 个任务进行中</Text>
          </View>
        </View>

        {/* 毕业报告卡片 */}
        <View className="graduation-banner" onClick={() => handleNavigate('/packageAdvanced/pages/graduation-report/index?track=content')}>
          <View className="grad-left">
            <View className="grad-badge">◆ 内容创作赛道</View>
            <Text className="grad-title">查看你的毕业报告</Text>
            <Text className="grad-subtitle">完成全部等级，解锁万字深度报告</Text>
          </View>
          <View className="grad-right">
            <View className="grad-progress-circle">
              <Text className="grad-percentage">83%</Text>
            </View>
            <Text className="grad-arrow">›</Text>
          </View>
        </View>

        {/* 快捷入口 */}
        <View className="quick-access-section">
          <Text className="section-title">快捷入口</Text>
          <View className="quick-grid-two">
            <View className="quick-item-large" onClick={() => handleNavigate('/packageGrowth/pages/skip-level-intro/index')}>
              <View className="quick-icon-large quick-icon-green">
                <Text className="icon-text-large">▲</Text>
              </View>
              <Text className="quick-label-large">跳级挑战</Text>
            </View>
            <View className="quick-item-large" onClick={() => handleNavigate('/packageGrowth/pages/ability-map/index')}>
              <View className="quick-icon-large quick-icon-blue">
                <Text className="icon-text-large">◆</Text>
              </View>
              <Text className="quick-label-large">能力雷达</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单区域 */}
        <View className="all-features-section">
          <View className="menu-categories">
            {menuCategories.map((category, index) => (
              <View key={index} className="menu-category">
                <View className="category-header-static">
                  <Text className="category-icon">{category.icon}</Text>
                  <Text className="category-title">{category.title}</Text>
                  <Text className="category-count">({category.items.length})</Text>
                </View>

                <View className="category-items">
                  {category.items.map((item, itemIndex) => (
                    <View
                      key={itemIndex}
                      className="menu-item"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <Text className="menu-item-icon">{item.icon}</Text>
                      <View className="menu-item-content">
                        <Text className="menu-item-title">{item.title}</Text>
                        {item.desc && (
                          <Text className="menu-item-desc">{item.desc}</Text>
                        )}
                      </View>
                      <Text className="menu-item-arrow">›</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 退出登录 */}
        <View className="logout-section">
          <Button className="logout-btn" onClick={handleLogout}>
            退出登录
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
