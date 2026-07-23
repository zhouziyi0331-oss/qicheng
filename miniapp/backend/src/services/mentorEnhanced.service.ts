import { openai, AI_CONFIG } from '../config/openai'
import { MentorConversation } from '../models/MentorConversation'
import { PassionSpark } from '../models/PassionSpark'
import { FlowMoment } from '../models/FlowMoment'
import { WorkReview } from '../models/WorkReview'
import { GrowthMemory } from '../models/GrowthMemory'
import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { vectorMatchService } from './vectorMatch.service'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * AI导师增强服务
 * 实现PBL教育、作品审核、长记忆、情绪支持
 */
export class MentorServiceEnhanced {

  // 情绪关键词
  private readonly EMOTION_KEYWORDS = {
    excited: ['兴奋', '激动', '开心', '太棒了', '太好了', '耶'],
    anxious: ['焦虑', '紧张', '担心', '害怕', '不安', '慌'],
    confused: ['不懂', '不明白', '困惑', '迷茫', '搞不清', '不知道'],
    confident: ['我可以', '我能行', '没问题', '有信心', '肯定能'],
    frustrated: ['烦', '崩溃', '想放弃', '太难了', '做不下去'],
    proud: ['自豪', '骄傲', '成就感', '完成了', '终于']
  }

  // 热情火花关键词
  private readonly PASSION_KEYWORDS = [
    '很酷', '有意思', '我发现', '太棒了', '惊喜', '兴奋',
    '喜欢', '好玩', '想试试', '感兴趣', '迫不及待'
  ]

  // 穿越感关键词
  private readonly FLOW_KEYWORDS = [
    '时间过得很快', '忘记时间', '沉浸', '专注', '停不下来',
    '不知不觉', '投入', '完全进入状态', '心流'
  ]

  /**
   * PBL流程 Step 1: 接单后的问题拆解与确认
   * 使用模糊词引导学生自己思考
   */
  async pblBreakdownTask(userId: string, taskId: string) {
    try {
      const user = await User.findById(userId)
      const task = await RealProject.findById(taskId)

      if (!user || !task) {
        throw new Error('用户或任务不存在')
      }

      const prompt = `你是一个PBL引导者，学生刚接了一个项目：

项目标题：${task.title}
项目描述：${task.description}
项目难度：${task.difficulty}
需要能力：${task.requiredAbilities?.join(', ')}

学生信息：
- OPC人格：${user.personalityTag || '未知'}
- 等级：Lv.${user.level || 1}
- 完成项目数：${user.totalProjects || 0}

请帮助学生理解这个项目，使用PBL方法：

1. **不要直接告诉答案**，而是用引导性问题
2. **使用模糊词**让学生自己思考，比如：
   - "你觉得'${task.title}'这个项目的核心是什么？"
   - "哪些部分可能是关键的？"
   - "你想从哪里开始？"
3. **列出3-5个引导性问题**，帮助学生拆解项目
4. **给出模糊的方向提示**，比如"可能需要考虑XX方面"
5. **语气**：好奇、探索式，不是指令式

输出格式：
【项目理解引导】
[3-5个引导性问题]

【可能的方向】
[模糊的提示，不超过3点]

【接下来】
[邀请学生用自己的话表达对项目的理解]

字数：300-500字`

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 800
      })

      const response = completion.choices[0].message.content || '让我们一起探索这个项目吧！'

      // 保存对话
      await MentorConversation.create({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId),
        studentMessage: '[接单] 开始PBL引导',
        mentorResponse: response,
        context: 'task',
        detectedPassionSpark: false,
        detectedFlowMoment: false
      })

      log.info('PBL问题拆解完成', { userId, taskId })

      return {
        guidance: response,
        nextStep: 'student_understanding'
      }
    } catch (error: any) {
      log.error('PBL问题拆解失败', { userId, taskId, error: error.message })
      throw error
    }
  }

  /**
   * PBL流程 Step 2: 学生确认理解
   * 学生用自己的话表达对项目的理解
   */
  async pblConfirmUnderstanding(userId: string, taskId: string, studentUnderstanding: string) {
    try {
      const user = await User.findById(userId)
      const task = await RealProject.findById(taskId)

      // 获取之前的引导对话
      const previousGuidance = await MentorConversation.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId),
        studentMessage: '[接单] 开始PBL引导'
      }).sort({ createdAt: -1 })

      const prompt = `学生刚才表达了对项目的理解：

"${studentUnderstanding}"

项目实际要求：${task?.description}

请评估学生的理解是否准确，并：

1. **如果理解基本准确**：
   - 肯定他的思考："你抓住了关键点"
   - 补充1-2个可能遗漏的细节（用提问方式）
   - 鼓励开始行动："准备好了吗？从哪里开始？"

2. **如果理解有偏差**：
   - 不要直接说"不对"
   - 用引导性问题帮他发现："你提到XX，那YY部分呢？"
   - 给线索："我之前做类似项目时，发现ZZ很重要"

3. **生成初步任务拆解**（3-5个步骤）：
   - 不是详细步骤，是大方向
   - 每个步骤用问题形式："如何XX？"
   - 让学生自己填充细节

语气：温暖、支持、探索式
字数：300-400字`

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      })

      const response = completion.choices[0].message.content || '很好的思考！让我们继续深入。'

      // 保存对话
      await MentorConversation.create({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId),
        studentMessage: `[学生理解] ${studentUnderstanding}`,
        mentorResponse: response,
        context: 'task',
        detectedPassionSpark: false,
        detectedFlowMoment: false
      })

      log.info('PBL理解确认完成', { userId, taskId })

      return {
        feedback: response,
        nextStep: 'start_working'
      }
    } catch (error: any) {
      log.error('PBL理解确认失败', { userId, taskId, error: error.message })
      throw error
    }
  }

  /**
   * 增强版卡点支持
   * 根据任务+卡点→分析可以做什么→给学习路径
   */
  async reportStuckEnhanced(userId: string, taskId: string, stuckPoint: string, whatTriedSoFar?: string) {
    try {
      const user = await User.findById(userId)
      const task = await RealProject.findById(taskId)

      // 获取历史对话，了解学生进展
      const recentConversations = await MentorConversation.find({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId)
      }).sort({ createdAt: -1 }).limit(5)

      const conversationHistory = recentConversations.reverse().map(c =>
        `学生: ${c.studentMessage}\n导师: ${c.mentorResponse}`
      ).join('\n\n')

      const prompt = `学生在项目中卡住了。

【项目信息】
标题：${task?.title}
描述：${task?.description}
难度：${task?.difficulty}

【学生信息】
等级：Lv.${user?.level || 1}
人格：${user?.personalityTag}
已完成项目：${user?.totalProjects || 0}个

【卡点】
${stuckPoint}

【已尝试】
${whatTriedSoFar || '未提供'}

【最近对话】
${conversationHistory}

请提供PBL式的引导，包括：

## 1. 分析卡点本质
- 这个卡点背后的核心问题是什么？
- 不是"学生不会XX技能"，而是"学生在XX环节遇到了YY挑战"

## 2. 可以做什么（3个方向）
- 方向A：[最简单的突破口]
- 方向B：[折中方案]
- 方向C：[理想方案]

每个方向给出：
- 这个方向是什么
- 为什么这个方向可能有效
- 第一步可以做什么（具体行动）

## 3. 学习路径（如果需要学新东西）
- 需要学什么？（具体到工具/概念）
- 怎么学？（推荐资源类型，不要给具体链接）
- 预计时间

## 4. 鼓励与支持
- 结合学生的OPC人格特点
- 提醒学生之前克服过类似挑战（如果有）
- 情绪支持："我之前也在这里卡过..."

语气：
- ❌ 不说"你应该..."、"正确做法是..."
- ✅ 说"你可以试试..."、"我之前发现XX很有用"
- 温暖、支持、具体、可行

字数：500-700字`

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      })

      const response = completion.choices[0].message.content || '让我们一起找找突破口。'

      // 检测情绪
      const emotion = this.detectEmotion(stuckPoint)

      // 保存对话
      await MentorConversation.create({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId),
        studentMessage: `[卡点] ${stuckPoint}${whatTriedSoFar ? `\n已尝试: ${whatTriedSoFar}` : ''}`,
        mentorResponse: response,
        context: 'stuck',
        detectedPassionSpark: false,
        detectedFlowMoment: false
      })

      // 如果检测到负面情绪，记录成长记忆
      if (emotion === 'frustrated' || emotion === 'anxious') {
        await GrowthMemory.create({
          userId: new mongoose.Types.ObjectId(userId),
          memoryType: 'challenge_overcome',
          title: `克服卡点: ${stuckPoint.substring(0, 50)}`,
          description: `在${task?.title}项目中遇到挑战：${stuckPoint}`,
          relatedTaskId: new mongoose.Types.ObjectId(taskId),
          beforeState: stuckPoint,
          emotionalTone: emotion,
          significance: 6,
          tags: ['卡点', '挑战']
        })
      }

      log.info('增强版卡点支持完成', { userId, taskId, emotion })

      return {
        guidance: response,
        detectedEmotion: emotion
      }
    } catch (error: any) {
      log.error('增强版卡点支持失败', { userId, taskId, error: error.message })
      throw error
    }
  }

  /**
   * 作品审核系统
   * AI先审核学生的提交
   */
  async reviewWork(
    userId: string,
    taskId: string,
    submissionUrl: string,
    submissionDescription: string
  ) {
    try {
      const user = await User.findById(userId)
      const task = await RealProject.findById(taskId)

      if (!user || !task) {
        throw new Error('用户或任务不存在')
      }

      // 检查是第几轮审核
      const previousReviews = await WorkReview.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId)
      })

      const reviewRound = previousReviews + 1

      const prompt = `你是一个温和但专业的审核导师，学生提交了作品等待审核。

【项目要求】
标题：${task.title}
描述：${task.description}
难度：${(task as any).difficulty || '未知'}
客户期望：${(task as any).clientExpectation || '未明确'}

【学生提交】
作品链接：${submissionUrl}
学生说明：${submissionDescription}

【学生背景】
等级：Lv.${user.level || 1}
人格：${user.personalityTag}
这是第${reviewRound}轮提交

请进行多维度审核：

## 1. 打分（0-100分）
- overallScore: 总体评分
- qualityScore: 质量评分（细节、专业度）
- completenessScore: 完整度评分（是否符合要求）
- creativityScore: 创意评分（有无亮点）

## 2. 优点（strengths）
列出3-5个具体的优点，要具体：
- ❌ 不要说"做得不错"
- ✅ 要说"XX部分的处理很细腻，尤其是YY细节"

## 3. 改进建议（improvements）
列出3-5个具体的改进点：
- 按优先级排序
- 说明为什么需要改进
- 给出可行的改进方向（不是直接答案）

## 4. 详细反馈（detailedFeedback）
- 总体印象
- 结合学生的OPC人格特点给建议
- 如果是第1轮，更宽容；如果是第2+轮，更严格
- 鼓励式语气，看到进步

## 5. 状态判断（status）
- needs_improvement: 还需要优化（<70分）
- good_to_submit: 可以提交给客户了（70-85分）
- excellent: 优秀，超出预期（>85分）

## 6. 建议行动（suggestedActions）
- 如果需要改进，列出2-3个具体行动
- 如果可以提交，给出提交前的最后检查清单

请以JSON格式输出：
{
  "overallScore": 分数,
  "qualityScore": 分数,
  "completenessScore": 分数,
  "creativityScore": 分数,
  "strengths": ["优点1", "优点2", ...],
  "improvements": ["改进1", "改进2", ...],
  "detailedFeedback": "详细反馈文字",
  "status": "状态",
  "suggestedActions": ["行动1", "行动2", ...]
}`

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })

      const reviewResult = JSON.parse(completion.choices[0].message.content || '{}')

      // 保存审核记录
      const review = await WorkReview.create({
        userId: new mongoose.Types.ObjectId(userId),
        taskId: new mongoose.Types.ObjectId(taskId),
        submissionUrl,
        submissionDescription,
        reviewRound,
        overallScore: reviewResult.overallScore || 0,
        qualityScore: reviewResult.qualityScore || 0,
        completenessScore: reviewResult.completenessScore || 0,
        creativityScore: reviewResult.creativityScore || 0,
        strengths: reviewResult.strengths || [],
        improvements: reviewResult.improvements || [],
        detailedFeedback: reviewResult.detailedFeedback || '',
        status: reviewResult.status || 'needs_improvement',
        suggestedActions: reviewResult.suggestedActions || []
      })

      // 如果作品优秀，记录成长记忆
      if (reviewResult.status === 'excellent') {
        await GrowthMemory.create({
          userId: new mongoose.Types.ObjectId(userId),
          memoryType: 'milestone',
          title: `优秀作品: ${task.title}`,
          description: `在${task.title}项目中提交了优秀作品（${reviewResult.overallScore}分）`,
          relatedTaskId: new mongoose.Types.ObjectId(taskId),
          afterState: `完成优质作品，得分${reviewResult.overallScore}`,
          emotionalTone: 'proud',
          significance: 8,
          tags: ['优秀作品', task.category || '项目']
        })
      }

      log.info('作品审核完成', { userId, taskId, status: reviewResult.status, score: reviewResult.overallScore })

      return review
    } catch (error: any) {
      log.error('作品审核失败', { userId, taskId, error: error.message })
      throw error
    }
  }

  /**
   * 长记忆：成长对比分析
   * 对比"过去的你" vs "现在的你"
   */
  async analyzeGrowthComparison(userId: string) {
    try {
      const user = await User.findById(userId)

      // 获取成长记忆
      const memories = await GrowthMemory.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: 1 }).limit(50)

      if (memories.length < 2) {
        return {
          hasEnoughData: false,
          message: '数据还不够，继续成长吧！'
        }
      }

      // 获取早期和近期的对话记录
      const allConversations = await MentorConversation.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: 1 })

      const earlyConversations = allConversations.slice(0, 5)
      const recentConversations = allConversations.slice(-5)

      const prompt = `请分析学生的成长轨迹，对比"过去的TA" vs "现在的TA"。

【学生基本信息】
当前等级：Lv.${user?.level || 1}
完成项目：${user?.totalProjects || 0}个
OPC人格：${user?.personalityTag}

【成长记忆（${memories.length}条）】
${memories.map(m => `- ${m.title} (${m.memoryType}, 重要度${m.significance}/10)`).join('\n')}

【早期对话（起点）】
${earlyConversations.map(c => `学生: ${c.studentMessage.substring(0, 100)}`).join('\n')}

【近期对话（现在）】
${recentConversations.map(c => `学生: ${c.studentMessage.substring(0, 100)}`).join('\n')}

请生成深度成长对比报告：

## 1. 技能成长
- 过去：[早期的技能水平]
- 现在：[当前的技能水平]
- 突破点：[关键的进步时刻]

## 2. 心态变化
- 过去：[早期的心态特征]
- 现在：[当前的心态特征]
- 转折点：[关键的心态转变]

## 3. 热情发现
- 过去：[早期对什么感兴趣]
- 现在：[当前的热情所在]
- 火花时刻：[重要的热情火花]

## 4. 克服的挑战
- 列出2-3个重要的挑战
- 每个挑战如何克服
- 这些经历如何塑造了TA

## 5. 下一步可能性
- 基于当前的成长轨迹
- TA可能的发展方向
- 鼓励继续探索的领域

语气：
- 像在讲一个人的成长故事
- 真诚、温暖、看到真实的进步
- 不夸张，但充分肯定

字数：700-1000字`

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })

      const analysis = completion.choices[0].message.content || '你的成长故事正在书写...'

      log.info('成长对比分析完成', { userId, memoriesCount: memories.length })

      return {
        hasEnoughData: true,
        analysis,
        memoriesAnalyzed: memories.length,
        projectsCompleted: user?.totalProjects || 0
      }
    } catch (error: any) {
      log.error('成长对比分析失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 检测情绪
   */
  private detectEmotion(message: string): string {
    for (const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return emotion
      }
    }
    return 'neutral'
  }

  /**
   * 检测热情火花
   */
  private detectPassionSpark(message: string): boolean {
    return this.PASSION_KEYWORDS.some(keyword => message.includes(keyword))
  }

  /**
   * 检测穿越感时刻
   */
  private detectFlowMoment(message: string): boolean {
    return this.FLOW_KEYWORDS.some(keyword => message.includes(keyword))
  }
}

export const mentorServiceEnhanced = new MentorServiceEnhanced()
