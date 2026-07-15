import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface WeakItem {
  name: string
  score: number
  gap: number
  tip: string
  color: string
}

interface Suggestion {
  icon: string
  iconBg: string
  name: string
  desc: string
  tag: string
  tagColor: string
}

const WEAK_ITEMS: WeakItem[] = [
  {
    name: '数据分析',
    score: 62,
    gap: 18,
    tip: '报告缺少对互动率趋势的深度分析，数据解读停在表面，建议学习如何从数据中挖掘内容优化方向。',
    color: 'linear-gradient(90deg, #EDE5DC, #BF9E71)'
  },
  {
    name: '内容质量',
    score: 78,
    gap: 2,
    tip: '内容整体不错，只是选题差异化和观点深度还可以更锐利一些，多参考同类型内容的亮点。',
    color: 'linear-gradient(90deg, #D88760, #BC6446)'
  }
]

const SUGGESTIONS: Suggestion[] = [
  {
    icon: '●',
    iconBg: 'rgba(190, 215, 209, 0.15)',
    name: '学习数据分析框架',
    desc: '推荐从「阅读量 → 完读率 → 互动率 → 转化率」这条链路入手，每个指标都有对应的内容优化方向。',
    tag: '重点推荐',
    tagColor: 'tag-mist'
  },
  {
    icon: '▪',
    iconBg: 'rgba(242, 205, 120, 0.12)',
    name: '打磨内容差异化',
    desc: '在选题和切入点上找到别人没讲过的角度。只是换个标题是不够的，要从根本的见解上与众不同。',
    tag: '内容提升',
    tagColor: 'tag-golden'
  },
  {
    icon: '●',
    iconBg: 'rgba(188, 100, 70, 0.08)',
    name: '多看优秀案例',
    desc: '在 Lv.4 的任务里，有几位同学的数据报告做得很好，可以去参考一下他们的分析思路和呈现方式。',
    tag: '同伴学习',
    tagColor: 'tag-rust'
  },
  {
    icon: '●',
    iconBg: 'rgba(191, 158, 113, 0.12)',
    name: '给自己一点时间',
    desc: '不用着急，正常升级的过程本身就是积累。升满 2 级之后，你会发现自己已经做好准备了。',
    tag: '慢慢来',
    tagColor: 'tag-sand'
  }
]

export default function SkipLevelImprove() {
  const handleContinue = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  const handleBackToScore = () => {
    Taro.navigateBack()
  }

  return (
    <View className="skip-improve-page">
      {/* 顶部 */}
      <View className="improve-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        <View className="cat-wrap">
          <View className="cat-circle">
            <Text className="cat-icon">○</Text>
          </View>
        </View>

        <Text className="improve-title">没关系，我们一起复盘</Text>
        <Text className="improve-subtitle">
          这次差了一点点，但每一次尝试{'\n'}都让你离目标更近了一步
        </Text>
      </View>

      <ScrollView className="improve-scroll" scrollY>
        <View className="improve-body">
          {/* 弱项分析 */}
          <View className="weak-card">
            <View className="card-header">
              <Text className="header-icon">●</Text>
              <Text className="header-title">本次弱项分析</Text>
            </View>
            <View className="weak-list">
              {WEAK_ITEMS.map((item, index) => (
                <View
                  key={index}
                  className="weak-item"
                  style={{
                    borderColor: index === 0 ? 'rgba(188, 100, 70, 0.2)' : 'rgba(216, 135, 96, 0.15)',
                    background: index === 0 ? 'rgba(188, 100, 70, 0.04)' : 'transparent'
                  }}
                >
                  <View className="weak-header">
                    <View className="weak-name-row">
                      <Text className="weak-name" style={{ color: index === 0 ? '#BC6446' : '#6B5540' }}>
                        {item.name}
                      </Text>
                      {index === 0 && (
                        <View className="tag tag-rust">
                          <Text className="tag-text">主要扣分项</Text>
                        </View>
                      )}
                    </View>
                    <View className="weak-score-row">
                      <Text className="weak-score" style={{ color: index === 0 ? '#BC6446' : '#D88760' }}>
                        {item.score}分
                      </Text>
                      <Text className="weak-gap">差{item.gap}分</Text>
                    </View>
                  </View>
                  <View className="weak-bar">
                    <View className="weak-fill" style={{ width: `${item.score}%`, background: item.color }} />
                  </View>
                  <Text className="weak-tip">{item.tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 具体建议 */}
          <View className="suggest-card">
            <View className="card-header">
              <Text className="header-icon">◇</Text>
              <Text className="header-title">接下来可以这样做</Text>
            </View>
            <View className="suggest-list">
              {SUGGESTIONS.map((item, index) => (
                <View key={index} className="suggest-item">
                  <View className="suggest-icon" style={{ background: item.iconBg }}>
                    <Text className="icon-text">{item.icon}</Text>
                  </View>
                  <View className="suggest-content">
                    <Text className="suggest-name">{item.name}</Text>
                    <Text className="suggest-desc">{item.desc}</Text>
                    <View className={`tag ${item.tagColor}`}>
                      <Text className="tag-text">{item.tag}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 小猫鼓励 */}
          <View className="cheer-card">
            <View className="cheer-header">
              <View className="cheer-avatar">
                <Text className="avatar-icon">○</Text>
              </View>
              <View className="cheer-info">
                <Text className="cheer-name">AI 导师小猫</Text>
                <Text className="cheer-role">你的专属学习伙伴</Text>
              </View>
            </View>
            <Text className="cheer-text">
              你知道吗？<Text className="text-highlight">数据分析</Text>这个能力，很多人在 Lv.5、Lv.6 才真正理解。你现在就在认真对待它，已经比大多数人走得更扎实了。
              {'\n\n'}
              这次 72 分，其实已经很接近了。下次再来，我们一起把数据报告那部分做得漂漂亮亮的。
            </Text>
          </View>

          {/* 下一步路径 */}
          <View className="next-path-card">
            <View className="card-header">
              <Text className="header-icon">→</Text>
              <Text className="header-title">接下来的路</Text>
            </View>
            <View className="path-steps">
              <View className="path-step">
                <View className="path-dot" style={{ background: '#BC6446' }}>
                  <Text className="dot-text">1</Text>
                </View>
                <View className="path-content">
                  <Text className="path-title">继续正常升级</Text>
                  <Text className="path-subtitle">完成 Lv.3 → Lv.4 的正常任务，积累经验</Text>
                </View>
              </View>
              <View className="path-step">
                <View className="path-dot" style={{ background: '#D88760' }}>
                  <Text className="dot-text">2</Text>
                </View>
                <View className="path-content">
                  <Text className="path-title">重点练习数据分析</Text>
                  <Text className="path-subtitle">在日常任务中有意识地分析数据处理，形成习惯</Text>
                </View>
              </View>
              <View className="path-step">
                <View className="path-dot" style={{ background: '#F2CD78' }}>
                  <Text className="dot-text">3</Text>
                </View>
                <View className="path-content">
                  <Text className="path-title">升满 2 级后再次挑战</Text>
                  <Text className="path-subtitle">跳级资格自动解锁，那时候的你会更有把握</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="improve-footer">
        <View className="btn-primary" onClick={handleContinue}>
          <Text className="btn-text">好的，继续升级之路</Text>
        </View>
        <View className="btn-secondary" onClick={handleBackToScore}>
          <Text className="btn-text">返回查看评分</Text>
        </View>
      </View>
    </View>
  )
}
