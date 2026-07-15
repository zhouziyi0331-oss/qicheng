import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { checkSkipLevelEligibility } from '../../../services/skipLevel'
import './index.scss'

export default function SkipLevelIntro() {
  const [currentLevel, setCurrentLevel] = useState(3)
  const [currentLevelName, setCurrentLevelName] = useState('探索者')
  const [skipUnlocked, setSkipUnlocked] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEligibility()
  }, [])

  const loadEligibility = async () => {
    try {
      const data = await checkSkipLevelEligibility()
      setCurrentLevel(data.currentLevel)
      setCurrentLevelName(data.currentLevelName || '探索者')
      setSkipUnlocked(data.eligible)
    } catch (error) {
      console.error('加载资格失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!skipUnlocked) {
      Taro.showToast({
        title: '尚未解锁跳级功能',
        icon: 'none'
      })
      return
    }
    Taro.navigateTo({
      url: '/packageGrowth/pages/skip-level-apply/index'
    })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return <View className="skip-intro-page"><Text>加载中...</Text></View>
  }

  return (
    <View className="skip-intro-page">
      {/* Hero区域 */}
      <View className="intro-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        <View className="intro-badge">
          <Text className="badge-icon">▲</Text>
          <Text>快速通道</Text>
        </View>

        <Text className="intro-title">跳级挑战{'\n'}超越自我</Text>
        <Text className="intro-sub">证明你的实力，无需等待，直接跨越到更高级别</Text>

        <View className="intro-level-row">
          <View className="intro-lv-badge">
            <Text>Lv.{currentLevel}</Text>
          </View>
          <View className="intro-lv-info">
            <Text className="lv-name">当前等级：{currentLevelName}</Text>
            <Text className="lv-sub">{skipUnlocked ? '已满足跳级解锁条件' : '尚未解锁跳级功能'}</Text>
          </View>
          {skipUnlocked && (
            <View className="intro-unlock-tag">
              <Text>✓ 已解锁</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView scrollY className="intro-scroll">
        <View className="intro-body">
          {/* 规则说明 */}
          <View className="rule-card">
            <View className="rule-card-title">
              <Text className="title-icon">●</Text>
              <Text>跳级规则</Text>
            </View>

            <View className="rule-list">
              <View className="rule-item">
                <View className="rule-dot rule-dot-1"><Text>1</Text></View>
                <Text className="rule-text"><Text className="bold">解锁条件：</Text>达到 Lv.3 及以上的学员可申请跳级（Lv.3、4、5 均可申请）</Text>
              </View>
              <View className="rule-item">
                <View className="rule-dot rule-dot-2"><Text>2</Text></View>
                <Text className="rule-text"><Text className="bold">跳级方式：</Text>挑战完成一个目标级别的挑战任务，不占用正常升级配额</Text>
              </View>
              <View className="rule-item">
                <View className="rule-dot rule-dot-3"><Text>3</Text></View>
                <Text className="rule-text"><Text className="bold">通过标准：</Text>任务完成后由导师评分，<Text className="bold">达到 80 分</Text>即视为跳级成功</Text>
              </View>
              <View className="rule-item">
                <View className="rule-dot rule-dot-4"><Text>4</Text></View>
                <Text className="rule-text"><Text className="bold">失败惩罚：</Text>评分未达 80 分，需<Text className="bold">正常升满 2 级</Text>后方可再次申请跳级</Text>
              </View>
              <View className="rule-item">
                <View className="rule-dot rule-dot-5"><Text>5</Text></View>
                <Text className="rule-text"><Text className="bold">跨赛道通用：</Text>跳级系统不区分赛道，所有赛道学员统一规则</Text>
              </View>
            </View>
          </View>

          {/* 可跳级路径图 */}
          <View className="level-map">
            <View className="lm-title">
              <Text className="lm-icon">●</Text>
              <Text>可跳级路径</Text>
            </View>

            {/* Row 1: Lv3 → Lv5 */}
            <View className="lm-row">
              <View className="lm-node">
                <View className="lm-circle lm-circle-3"><Text>3</Text></View>
                <Text className="lm-label">探索者</Text>
              </View>
              <View className="lm-arrow">
                <View className="lm-arrow-line" />
                <View className="lm-arrow-skip">
                  <View className="lm-skip-line" />
                  <Text className="lm-skip-label">跳 Lv.4</Text>
                </View>
              </View>
              <View className="lm-node">
                <View className="lm-circle lm-circle-4"><Text>4</Text></View>
                <Text className="lm-label">实践者</Text>
              </View>
              <View className="lm-arrow">
                <View className="lm-arrow-line" />
              </View>
              <View className="lm-node">
                <View className="lm-circle lm-circle-5"><Text>5</Text></View>
                <Text className="lm-label">创造者</Text>
              </View>
            </View>

            {/* Row 2: Lv4 → Lv6 */}
            <View className="lm-row lm-row-2">
              <View className="lm-node">
                <View className="lm-circle lm-circle-4"><Text>4</Text></View>
                <Text className="lm-label">实践者</Text>
              </View>
              <View className="lm-arrow">
                <View className="lm-arrow-line" />
                <View className="lm-arrow-skip">
                  <View className="lm-skip-line" />
                  <Text className="lm-skip-label">跳 Lv.5</Text>
                </View>
              </View>
              <View className="lm-node">
                <View className="lm-circle lm-circle-5"><Text>5</Text></View>
                <Text className="lm-label">创造者</Text>
              </View>
              <View className="lm-arrow">
                <View className="lm-arrow-line" />
              </View>
              <View className="lm-node">
                <View className="lm-circle lm-circle-6"><Text>6</Text></View>
                <Text className="lm-label">领航者</Text>
              </View>
            </View>
          </View>

          {/* 警告提示 */}
          <View className="warn-card">
            <Text className="warn-icon">▲</Text>
            <Text className="warn-text">
              跳级任务为<Text className="warn-bold">挑战挑战</Text>，失败后需正常升满 <Text className="warn-bold">2 级</Text>才能重新申请。请确认自己已做好充分准备再发起挑战。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="intro-footer">
        <View className="btn-primary" onClick={handleApply}>
          <Text>立即申请跳级</Text>
        </View>
      </View>
    </View>
  )
}
