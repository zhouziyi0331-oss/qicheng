import { View, Text, ScrollView, Canvas } from '@tarojs/components'
import Taro, { useReady } from '@tarojs/taro'
import { useEffect, useState, useRef } from 'react'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../config'
import './index.scss'

interface TalentTag {
  id: number
  tag_name: string
  tag_name_en: string
  category: string
  sub_category: string
  description: string
  strength: 'emerging' | 'clear' | 'prominent' | 'core' | null
  confidence: number
  verified_count: number
  source: string
  gallup_strength?: string
  how_to_use?: string
}

const TABS = [
  { id: 'radar', name: '六维雷达' },
  { id: 'deep', name: '深度模式' },
  { id: 'map', name: '标签地图' }
]

const CATEGORY_NAMES = {
  talent: '天赋优势',
  thinking: '思维方式',
  style: '做事风格',
  learning: '学习特质',
  other: '其他特质'
}

const STRENGTH_COLORS = {
  emerging: '#93AEC1',
  clear: '#5B8FAB',
  prominent: '#3A8A84',
  core: '#BC6446'
}

const STRENGTH_NAMES = {
  emerging: '初步显现',
  clear: '明确优势',
  prominent: '突出优势',
  core: '核心优势'
}

const DIM_NAMES = ['信息处理', '创作驱动', '工具学习', '任务执行', '协作倾向', '风险承受度']
const DIM_COLORS = ['#BC6446', '#D88760', '#3A8A84', '#5B8FAB', '#BF9E71', '#93AEC1']
const DIM_GRADS = [
  'linear-gradient(90deg,#D88760,#BC6446)',
  'linear-gradient(90deg,#F2CD78,#D88760)',
  'linear-gradient(90deg,#BED7D1,#3A8A84)',
  'linear-gradient(90deg,#93AEC1,#5B8FAB)',
  'linear-gradient(90deg,#F2CD78,#BF9E71)',
  'linear-gradient(90deg,#C4B8E8,#9B8EC4)'
]

// 模拟标签数据（共150个标签）
const MOCK_TAGS = {
  talent: [
    { id: 1, name: '分析思维', locked: false, desc: '擅长数据分析和逻辑推理' },
    { id: 2, name: '快速学习', locked: false, desc: '能快速掌握新技能' },
    { id: 3, name: '共情能力', locked: false, desc: '理解他人情绪' },
    { id: 4, name: '战略眼光', locked: false, desc: '看清大局方向' },
    { id: 5, name: '影响他人', locked: false, desc: '说服力强' },
    { id: 6, name: '激活他人', locked: false, desc: '鼓舞团队士气' },
    { id: 7, name: '执行到位', locked: false, desc: '高效完成任务' },
    { id: 8, name: '注重细节', locked: false, desc: '关注细节' },
    { id: 9, name: '前瞻性', locked: false, desc: '预见未来趋势' },
    { id: 10, name: '专注力', locked: false, desc: '长时间专注工作' },
    { id: 11, name: '收集信息', locked: false, desc: '喜欢收集知识' },
    { id: 12, name: '责任心', locked: false, desc: '对承诺负责' },
    { id: 13, name: '成就导向', locked: false, desc: '追求成就感' },
    { id: 14, name: '适应性', locked: false, desc: '快速适应变化' },
    { id: 15, name: '竞争意识', locked: false, desc: '喜欢竞争挑战' },
    { id: 16, name: '统筹能力', locked: true, desc: '整合多方资源' },
    { id: 17, name: '关联思维', locked: true, desc: '连接不同概念' },
    { id: 18, name: '信念坚定', locked: true, desc: '核心价值观明确' },
    { id: 19, name: '指挥协调', locked: true, desc: '领导团队协作' },
    { id: 20, name: '沟通表达', locked: true, desc: '清晰传达想法' },
    { id: 21, name: '审慎谨慎', locked: true, desc: '仔细评估风险' },
    { id: 22, name: '规则意识', locked: true, desc: '遵守既定规则' },
    { id: 23, name: '包容力', locked: true, desc: '接纳不同观点' },
    { id: 24, name: '公平公正', locked: true, desc: '追求公平待遇' },
    { id: 25, name: '未来导向', locked: true, desc: '关注未来发展' },
    { id: 26, name: '和谐共处', locked: true, desc: '寻求和谐氛围' },
    { id: 27, name: '创意思维', locked: true, desc: '产生新颖想法' },
    { id: 28, name: '个性化关注', locked: true, desc: '关注个体差异' },
    { id: 29, name: '输入学习', locked: true, desc: '持续输入知识' },
    { id: 30, name: '思维深度', locked: true, desc: '深度思考问题' },
    { id: 31, name: '积极乐观', locked: true, desc: '保持正面心态' },
    { id: 32, name: '行动力', locked: true, desc: '立即采取行动' },
    { id: 33, name: '关系建立', locked: true, desc: '建立人际关系' },
    { id: 34, name: '自信心', locked: true, desc: '对自己有信心' },
    { id: 35, name: '意义寻求', locked: true, desc: '寻找工作意义' }
  ],
  thinking: [
    { id: 101, name: '结构化思维', locked: false, desc: '系统化思考问题' },
    { id: 102, name: '拆解分析', locked: false, desc: '分解复杂问题' },
    { id: 103, name: '系统性思考', locked: false, desc: '整体视角看问题' },
    { id: 104, name: '跨界联想', locked: false, desc: '跨领域思维' },
    { id: 105, name: '逆向思维', locked: false, desc: '反向思考问题' },
    { id: 106, name: '批判性思维', locked: false, desc: '质疑与验证' },
    { id: 107, name: '本质思考', locked: false, desc: '抓住问题本质' },
    { id: 108, name: '多维度思考', locked: false, desc: '多角度看问题' },
    { id: 109, name: '抽象能力', locked: false, desc: '提炼共性规律' },
    { id: 110, name: '因果分析', locked: false, desc: '分析因果关系' },
    { id: 111, name: '归纳总结', locked: false, desc: '总结提炼要点' },
    { id: 112, name: '演绎推理', locked: true, desc: '逻辑推导结论' },
    { id: 113, name: '类比思维', locked: true, desc: '借鉴相似情况' },
    { id: 114, name: '假设验证', locked: true, desc: '提出并验证假设' },
    { id: 115, name: '场景想象', locked: true, desc: '构建场景模型' },
    { id: 116, name: '框架建构', locked: true, desc: '建立思维框架' },
    { id: 117, name: '概念映射', locked: true, desc: '建立概念关系' },
    { id: 118, name: '反思总结', locked: true, desc: '复盘反思经验' },
    { id: 119, name: '矛盾分析', locked: true, desc: '识别问题矛盾' },
    { id: 120, name: '优先级判断', locked: true, desc: '判断事情优先级' },
    { id: 121, name: '模式识别', locked: true, desc: '识别重复模式' },
    { id: 122, name: '创新思维', locked: true, desc: '产生创新想法' },
    { id: 123, name: '换位思考', locked: true, desc: '站在他人角度' },
    { id: 124, name: '长期思维', locked: true, desc: '考虑长期影响' },
    { id: 125, name: '全局观', locked: true, desc: '宏观把控全局' },
    { id: 126, name: '细节洞察', locked: true, desc: '发现关键细节' },
    { id: 127, name: '风险评估', locked: true, desc: '评估潜在风险' },
    { id: 128, name: '机会发现', locked: true, desc: '发现潜在机会' },
    { id: 129, name: '决策思维', locked: true, desc: '快速做出决策' },
    { id: 130, name: '权衡取舍', locked: true, desc: '平衡多方因素' }
  ],
  style: [
    { id: 201, name: '快速行动', locked: false, desc: '立即开始执行' },
    { id: 202, name: '完美主义', locked: false, desc: '追求极致品质' },
    { id: 203, name: '协作优先', locked: false, desc: '重视团队合作' },
    { id: 204, name: '独立作战', locked: false, desc: '独立完成任务' },
    { id: 205, name: '稳扎稳打', locked: false, desc: '稳健推进工作' },
    { id: 206, name: '灵活变通', locked: false, desc: '根据情况调整' },
    { id: 207, name: '计划周全', locked: false, desc: '提前做好计划' },
    { id: 208, name: '结果导向', locked: false, desc: '关注最终结果' },
    { id: 209, name: '过程重视', locked: false, desc: '关注执行过程' },
    { id: 210, name: '迭代优化', locked: false, desc: '持续改进优化' },
    { id: 211, name: '快速试错', locked: true, desc: '快速尝试验证' },
    { id: 212, name: '深思熟虑', locked: true, desc: '充分思考后行动' },
    { id: 213, name: '主动出击', locked: true, desc: '主动寻找机会' },
    { id: 214, name: '被动响应', locked: true, desc: '根据需求响应' },
    { id: 215, name: '聚焦专注', locked: true, desc: '专注单一目标' },
    { id: 216, name: '多线并行', locked: true, desc: '同时推进多项' },
    { id: 217, name: '开放沟通', locked: true, desc: '主动分享信息' },
    { id: 218, name: '谨慎保守', locked: true, desc: '谨慎对待风险' },
    { id: 219, name: '大胆创新', locked: true, desc: '勇于尝试新方法' },
    { id: 220, name: '规范流程', locked: true, desc: '遵循标准流程' },
    { id: 221, name: '简化高效', locked: true, desc: '追求简洁高效' },
    { id: 222, name: '数据驱动', locked: true, desc: '基于数据决策' },
    { id: 223, name: '直觉判断', locked: true, desc: '依靠直觉判断' },
    { id: 224, name: '文档齐全', locked: true, desc: '完善文档记录' },
    { id: 225, name: '口头沟通', locked: true, desc: '偏好口头交流' },
    { id: 226, name: '主动反馈', locked: true, desc: '及时反馈进展' },
    { id: 227, name: '批量处理', locked: true, desc: '集中批量完成' },
    { id: 228, name: '即时处理', locked: true, desc: '即时处理事务' },
    { id: 229, name: '委派授权', locked: true, desc: '善于授权他人' },
    { id: 230, name: '亲力亲为', locked: true, desc: '亲自完成细节' }
  ],
  learning: [
    { id: 301, name: '实践学习', locked: false, desc: '边做边学习' },
    { id: 302, name: '快速上手', locked: false, desc: '快速掌握技能' },
    { id: 303, name: '自驱学习', locked: false, desc: '主动学习新知' },
    { id: 304, name: '深度钻研', locked: false, desc: '深入研究领域' },
    { id: 305, name: '理论学习', locked: false, desc: '学习理论知识' },
    { id: 306, name: '案例学习', locked: false, desc: '从案例中学习' },
    { id: 307, name: '教学相长', locked: false, desc: '通过教学学习' },
    { id: 308, name: '反思学习', locked: false, desc: '从经验中反思' },
    { id: 309, name: '系统学习', locked: false, desc: '系统化学习' },
    { id: 310, name: '碎片学习', locked: false, desc: '利用碎片时间' },
    { id: 311, name: '专注领域', locked: true, desc: '专注特定领域' },
    { id: 312, name: '广泛涉猎', locked: true, desc: '多领域学习' },
    { id: 313, name: '模仿学习', locked: true, desc: '模仿优秀案例' },
    { id: 314, name: '创新突破', locked: true, desc: '突破现有框架' },
    { id: 315, name: '结构化笔记', locked: true, desc: '系统记录笔记' },
    { id: 316, name: '知识分享', locked: true, desc: '分享所学知识' },
    { id: 317, name: '刻意练习', locked: true, desc: '针对性练习' },
    { id: 318, name: '联机学习', locked: true, desc: '与他人共同学习' },
    { id: 319, name: '问题导向', locked: true, desc: '带着问题学习' },
    { id: 320, name: '兴趣驱动', locked: true, desc: '兴趣引导学习' },
    { id: 321, name: '目标导向', locked: true, desc: '为目标而学' },
    { id: 322, name: '知识迁移', locked: true, desc: '跨领域迁移' },
    { id: 323, name: '输出倒逼', locked: true, desc: '通过输出促学' },
    { id: 324, name: '长期积累', locked: true, desc: '长期持续积累' },
    { id: 325, name: '快速迭代', locked: true, desc: '快速验证迭代' },
    { id: 326, name: '深度阅读', locked: true, desc: '深入阅读理解' },
    { id: 327, name: '视频学习', locked: true, desc: '通过视频学习' },
    { id: 328, name: '社群学习', locked: true, desc: '在社群中学习' },
    { id: 329, name: '导师指导', locked: true, desc: '寻求导师指导' },
    { id: 330, name: '自我探索', locked: true, desc: '独立探索学习' }
  ],
  other: [
    { id: 401, name: '时间管理', locked: false, desc: '高效管理时间' },
    { id: 402, name: '情绪稳定', locked: false, desc: '良好情绪控制' },
    { id: 403, name: '好奇心', locked: false, desc: '保持好奇探索' },
    { id: 404, name: '抗压能力', locked: false, desc: '承受工作压力' },
    { id: 405, name: '自我驱动', locked: false, desc: '内在动力强' },
    { id: 406, name: '目标清晰', locked: false, desc: '目标明确清晰' },
    { id: 407, name: '精力管理', locked: false, desc: '合理分配精力' },
    { id: 408, name: '专业精神', locked: false, desc: '职业化素养' },
    { id: 409, name: '同理心', locked: false, desc: '理解他人感受' },
    { id: 410, name: '影响力', locked: false, desc: '影响他人能力' },
    { id: 411, name: '冲突处理', locked: true, desc: '化解矛盾冲突' },
    { id: 412, name: '资源整合', locked: true, desc: '整合各方资源' },
    { id: 413, name: '谈判能力', locked: true, desc: '有效谈判协商' },
    { id: 414, name: '演讲表达', locked: true, desc: '公开演讲能力' },
    { id: 415, name: '写作能力', locked: true, desc: '文字表达能力' },
    { id: 416, name: '跨文化沟通', locked: true, desc: '跨文化交流' },
    { id: 417, name: '商业敏感', locked: true, desc: '商业洞察力' },
    { id: 418, name: '行业认知', locked: true, desc: '行业理解深度' },
    { id: 419, name: '技术敏感', locked: true, desc: '技术趋势敏感' },
    { id: 420, name: '用户思维', locked: true, desc: '以用户为中心' },
    { id: 421, name: '产品思维', locked: true, desc: '产品化思考' },
    { id: 422, name: '成本意识', locked: true, desc: '控制成本意识' },
    { id: 423, name: '服务意识', locked: true, desc: '服务他人意识' },
    { id: 424, name: '质量意识', locked: true, desc: '追求高质量' },
    { id: 425, name: '安全意识', locked: true, desc: '重视安全保障' }
  ]
}

export default function AbilityMap() {
  const [activeTab, setActiveTab] = useState('radar')
  const [selectedCategory, setSelectedCategory] = useState('talent')
  const [loading, setLoading] = useState(false)

  const radarCanvasRef = useRef<string>('radarCanvas')
  const deepPastCanvasRef = useRef<string>('deepPastCanvas')
  const deepNowCanvasRef = useRef<string>('deepNowCanvas')

  // 六维能力分数
  const [abilityScores] = useState([82, 75, 68, 85, 72, 58])
  const [pastScores] = useState([65, 58, 52, 70, 60, 45])

  useReady(() => {
    setTimeout(() => {
      if (activeTab === 'radar') {
        drawRadarChart('radarCanvas', abilityScores, 240, 120, 120, 90, true)
      } else if (activeTab === 'deep') {
        drawRadarChart('deepPastCanvas', pastScores, 160, 80, 80, 55, false)
        drawRadarChart('deepNowCanvas', abilityScores, 160, 80, 80, 55, false)
      }
    }, 200)
  })

  useEffect(() => {
    setTimeout(() => {
      if (activeTab === 'radar') {
        drawRadarChart('radarCanvas', abilityScores, 240, 120, 120, 90, true)
      } else if (activeTab === 'deep') {
        drawRadarChart('deepPastCanvas', pastScores, 160, 80, 80, 55, false)
        drawRadarChart('deepNowCanvas', abilityScores, 160, 80, 80, 55, false)
      }
    }, 200)
  }, [activeTab])

  // 绘制雷达图
  const drawRadarChart = (canvasId: string, scores: number[], size: number, cx: number, cy: number, r: number, showLabels: boolean) => {
    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = Taro.getSystemInfoSync().pixelRatio

          // 设置正方形画布
          canvas.width = size * dpr
          canvas.height = size * dpr
          ctx.scale(dpr, dpr)

          const n = 6
          const angleStep = (Math.PI * 2) / n
          const startAngle = -Math.PI / 2

          // 清空画布
          ctx.clearRect(0, 0, size, size)

          // 绘制网格圆圈
          ctx.strokeStyle = showLabels ? '#EDE5DC' : 'rgba(255,255,255,0.1)'
          ctx.lineWidth = 1
          for (let i = 1; i <= 4; i++) {
            ctx.beginPath()
            ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2)
            ctx.stroke()
          }

          // 绘制坐标轴
          for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(x, y)
            ctx.stroke()
          }

          // 绘制数据多边形
          ctx.fillStyle = 'rgba(188, 100, 70, 0.2)'
          ctx.strokeStyle = '#BC6446'
          ctx.lineWidth = 2.5
          ctx.lineJoin = 'round'
          ctx.beginPath()
          scores.forEach((score, i) => {
            const angle = startAngle + angleStep * i
            const ratio = score / 100
            const x = cx + r * ratio * Math.cos(angle)
            const y = cy + r * ratio * Math.sin(angle)
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          })
          ctx.closePath()
          ctx.fill()
          ctx.stroke()

          // 绘制数据点
          ctx.fillStyle = '#BC6446'
          scores.forEach((score, i) => {
            const angle = startAngle + angleStep * i
            const ratio = score / 100
            const x = cx + r * ratio * Math.cos(angle)
            const y = cy + r * ratio * Math.sin(angle)
            ctx.beginPath()
            ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.fill()
          })

          // 绘制标签（仅大图显示）
          if (showLabels) {
            ctx.font = 'bold 11px PingFang SC, sans-serif'
            ctx.fillStyle = '#6B5540'
            DIM_NAMES.forEach((name, i) => {
              const angle = startAngle + angleStep * i
              const labelDist = r + 18
              const x = cx + labelDist * Math.cos(angle)
              const y = cy + labelDist * Math.sin(angle)

              // 调整文本对齐
              if (Math.abs(Math.cos(angle)) < 0.1) {
                ctx.textAlign = 'center'
              } else if (Math.cos(angle) > 0) {
                ctx.textAlign = 'left'
              } else {
                ctx.textAlign = 'right'
              }

              ctx.textBaseline = 'middle'
              ctx.fillText(name, x, y)
            })
          }
        }
      })
  }

  const renderRadarTab = () => {
    const avgScore = Math.round(abilityScores.reduce((a, b) => a + b, 0) / abilityScores.length)

    return (
      <View className="tab-content radar-tab">
        {/* 深色渐变头部 */}
        <View className="radar-header">
          <View className="header-glow" />
          <View className="header-content">
            <Text className="header-title">六维能力雷达</Text>
            <Text className="header-subtitle">信息处理 · 创作驱动 · 工具学习 · 任务执行 · 协作倾向 · 风险承受度</Text>
          </View>
        </View>

        {/* 雷达图卡片 */}
        <View className="radar-card">
          <Canvas
            id="radarCanvas"
            type="2d"
            className="radar-canvas"
            canvasId="radarCanvas"
          />
        </View>

        {/* 维度详情 */}
        <View className="dimensions-card">
          <View className="section-header">
            <Text className="section-title">维度得分详情</Text>
          </View>
          {DIM_NAMES.map((name, index) => (
            <View key={name} className="dimension-row">
              <View className="dim-header">
                <View className="dim-info">
                  <View className="dim-dot" style={{ background: DIM_COLORS[index] }} />
                  <Text className="dim-name">{name}</Text>
                </View>
                <Text className="dim-score" style={{ color: DIM_COLORS[index] }}>
                  {abilityScores[index]}
                </Text>
              </View>
              <View className="dim-bar">
                <View
                  className="dim-fill"
                  style={{
                    width: `${abilityScores[index]}%`,
                    background: DIM_GRADS[index]
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* AI洞察 */}
        <View className="insight-card">
          <View className="insight-header">
            <Text className="insight-icon">◇</Text>
            <Text className="insight-title">AI 能力洞察</Text>
          </View>
          <Text className="insight-text">
            你的任务执行（85）和信息处理（82）是最突出的优势。你能快速理解复杂信息并高效推进任务，是团队的"执行力+分析力"双强型人才。
            {'\n\n'}
            建议在风险承受度（58）上做提升——适当接纳不确定性，会让你的创作驱动力得到更大释放。
          </Text>
        </View>
      </View>
    )
  }

  const renderDeepTab = () => {
    const currentAvg = Math.round(abilityScores.reduce((a, b) => a + b, 0) / abilityScores.length)
    const pastAvg = Math.round(pastScores.reduce((a, b) => a + b, 0) / pastScores.length)
    const diff = currentAvg - pastAvg

    return (
      <View className="tab-content deep-tab">
        {/* 深色背景头部 */}
        <View className="deep-header-section">
          <View className="deep-header">
            <Text className="deep-title">深度模式</Text>
            <Text className="deep-subtitle">对比过去与现在的六维变化</Text>
          </View>

          {/* 对比雷达图 */}
          <View className="comparison-radars">
            <View className="radar-compare-item">
              <Text className="radar-label">3个月前</Text>
              <Canvas
                id="deepPastCanvas"
                type="2d"
                className="radar-canvas-small"
                canvasId="deepPastCanvas"
              />
              <Text className="radar-avg">平均分 {pastAvg}</Text>
            </View>
            <View className="radar-compare-item current">
              <Text className="radar-label current">现在</Text>
              <Canvas
                id="deepNowCanvas"
                type="2d"
                className="radar-canvas-small"
                canvasId="deepNowCanvas"
              />
              <Text className="radar-avg current">平均分 {currentAvg}</Text>
            </View>
          </View>
        </View>

        {/* 变化详情 */}
        <View className="change-card">
          <View className="section-header">
            <Text className="section-title">六维变化详情</Text>
          </View>
          {DIM_NAMES.map((name, i) => {
            const change = abilityScores[i] - pastScores[i]
            return (
              <View key={name} className="change-row">
                <Text className="change-label">{name}</Text>
                <View className="change-bars">
                  <View className="change-bar-past">
                    <View className="change-bar-fill past" style={{ width: `${pastScores[i]}%` }} />
                  </View>
                  <View className="change-bar-current">
                    <View className="change-bar-fill" style={{ width: `${abilityScores[i]}%`, background: DIM_COLORS[i] }} />
                  </View>
                </View>
                <Text className="change-value" style={{ color: change >= 0 ? '#4ADE80' : '#F87171' }}>
                  {change >= 0 ? '+' : ''}{change}
                </Text>
              </View>
            )
          })}
          <View className="legend-row">
            <View className="legend-item">
              <View className="legend-bar past" />
              <Text className="legend-text">3个月前</Text>
            </View>
            <View className="legend-item">
              <View className="legend-bar current" />
              <Text className="legend-text">现在</Text>
            </View>
          </View>
        </View>

        {/* 成长洞察 */}
        <View className="insight-card deep">
          <View className="insight-header">
            <Text className="insight-icon">▲</Text>
            <Text className="insight-title">成长洞察</Text>
          </View>
          <Text className="insight-text">
            过去3个月，你的整体能力平均提升了 <Text className="highlight">+{diff}分</Text>。
            {'\n\n'}
            最显著进步在<Text className="highlight">信息处理</Text>，这与你近期完成任务情况高度相关。
            {'\n\n'}
            建议下一阶段重点突破<Text className="highlight">风险承受度</Text>，尝试接纳更多挑战性任务。
          </Text>
        </View>
      </View>
    )
  }

  const renderMapTab = () => {
    const currentTags = MOCK_TAGS[selectedCategory] || []
    const unlockedCount = currentTags.filter(t => !t.locked).length
    const totalCount = currentTags.length

    return (
      <View className="tab-content map-tab">
        {/* 总览卡片 */}
        <View className="map-overview-card">
          <View className="overview-content">
            <Text className="overview-title">能力地图</Text>
            <Text className="overview-subtitle">基于盖洛普34项优势</Text>

            <View className="overview-stats">
              <Text className="stats-label">总体解锁进度</Text>
              <Text className="stats-value">56 / 150</Text>
            </View>
            <View className="progress-bar">
              <View className="progress-fill" style={{ width: '37.3%' }} />
            </View>

            <View className="category-grid">
              {Object.keys(CATEGORY_NAMES).map(cat => {
                const count = (MOCK_TAGS[cat] || []).filter(t => !t.locked).length
                return (
                  <View key={cat} className="category-stat">
                    <Text className="stat-num">{count}</Text>
                    <Text className="stat-label">{CATEGORY_NAMES[cat]}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* 类别列表 - 竖向排列 */}
        <View className="category-list">
          {Object.keys(CATEGORY_NAMES).map(cat => {
            const tags = MOCK_TAGS[cat] || []
            const unlockedTags = tags.filter(t => !t.locked)
            const lockedTags = tags.filter(t => t.locked)

            return (
              <View key={cat} className="category-section">
                <View className="category-header">
                  <Text className="category-title">{CATEGORY_NAMES[cat]}</Text>
                  <Text className="category-count">{unlockedTags.length} / {tags.length}</Text>
                </View>

                <View className="tags-wrapper">
                  {unlockedTags.map(tag => (
                    <View key={tag.id} className="tag-item unlocked">
                      <Text className="tag-name">{tag.name}</Text>
                    </View>
                  ))}
                  {lockedTags.map(tag => (
                    <View key={tag.id} className="tag-item locked">
                      <Text className="tag-name">{tag.name}</Text>
                      <Text className="lock-icon">○</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })}
        </View>

        {/* 说明卡片 */}
        <View className="info-card">
          <Text className="info-title">◇ 标签强度说明</Text>
          <Text className="info-text">
            • 初步显现：在1-2次任务中显现{'\n'}
            • 明确优势：在3-5次任务中验证{'\n'}
            • 突出优势：在5-10次任务中稳定表现{'\n'}
            • 核心优势：在10次以上任务中持续体现
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="ability-map-page">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  return (
    <View className="ability-map-page">
      {/* 顶部Tab */}
      <View className="main-tabs">
        {TABS.map(tab => (
          <View
            key={tab.id}
            className={`main-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Text className="tab-name">{tab.name}</Text>
            {activeTab === tab.id && <View className="tab-indicator" />}
          </View>
        ))}
      </View>

      {/* 内容区 */}
      <ScrollView className="content-scroll" scrollY>
        {activeTab === 'radar' && renderRadarTab()}
        {activeTab === 'deep' && renderDeepTab()}
        {activeTab === 'map' && renderMapTab()}
      </ScrollView>
    </View>
  )
}
