import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { MentorConversation } from '../models/MentorConversation'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * AI导师服务（简化版 - 只保留核心chat功能）
 */
export class MentorService {
  /**
   * AI对话核心方法
   */
  async chat(
    userId: string,
    message: string,
    context: any = {}
  ) {
    try {
      log.info('AI导师对话开始', { userId, message })

      // 1. 获取用户信息
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 2. 保存对话记录
      await MentorConversation.create({
        userId: new mongoose.Types.ObjectId(userId),
        userMessage: message,
        mentorResponse: '正在思考...',
        context: context.context || 'general',
        taskId: context.taskId ? new mongoose.Types.ObjectId(context.taskId) : undefined
      })

      // 3. 生成智能回复（降级方案 - 不依赖AI）
      const response = this.getDefaultResponse(message)
      const suggestions = this.generateSuggestions(message)

      return {
        response,
        suggestions,
        detectedPassionSpark: false,
        detectedFlowMoment: false
      }
    } catch (error: any) {
      log.error('AI导师对话失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 生成建议选项
   */
  private generateSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('困难') || lowerMessage.includes('问题') || lowerMessage.includes('卡住')) {
      return ['告诉你具体情况', '需要学习资源', '想要解决方案', '换个话题']
    }

    if (lowerMessage.includes('项目') || lowerMessage.includes('任务')) {
      return ['继续分析', '给我建议', '制定计划', '我明白了']
    }

    if (lowerMessage.includes('学习') || lowerMessage.includes('技能')) {
      return ['推荐学习路径', '找学习资源', '制定学习计划', '评估我的水平']
    }

    // 默认建议
    return ['继续聊聊', '换个话题', '给我建议', '我明白了']
  }

  /**
   * 默认回复（智能降级方案）
   */
  private getDefaultResponse(message: string): string {
    const lowerMessage = message.toLowerCase()

    // 困难相关
    if (lowerMessage.includes('困难') || lowerMessage.includes('问题') || lowerMessage.includes('卡住')) {
      return `我理解你遇到了困难。让我们一起来分析一下：

首先，把问题具体化是解决它的第一步。你能告诉我更多细节吗？比如：
- 困难具体表现在哪里？
- 你已经尝试过什么方法？
- 你希望达到什么样的结果？

有了这些信息，我就能给你更有针对性的建议。记住，每个困难都是成长的机会，我们一起来突破它！`
    }

    // 项目相关
    if (lowerMessage.includes('项目') || lowerMessage.includes('任务')) {
      return `很好，让我们来分析你的项目。

一个成功的项目需要三个要素：
1. 明确的目标 - 你想达成什么？
2. 合理的计划 - 分几步走？每步做什么？
3. 持续的执行 - 如何保持动力？

你的项目目前处在哪个阶段？是刚开始构思，还是已经在执行中了？告诉我更多，我会给你具体的指导。`
    }

    // 学习相关
    if (lowerMessage.includes('学习') || lowerMessage.includes('技能')) {
      return `学习新技能是很棒的选择！

有效学习的三个关键：
1. 从实践中学 - 边做边学，而不是只看不练
2. 保持小步快跑 - 每天进步一点点
3. 及时反馈 - 知道自己哪里做得好，哪里需要改进

你想学什么？我可以帮你制定一个实用的学习计划。`
    }

    // 默认回复
    return `我在这里陪伴你成长。你可以：

📊 和我聊聊你的项目，我帮你分析规划
💡 向我提出你的困惑，我给你解决思路
🎯 告诉我你的目标，我帮你制定计划
🚀 分享你的进展，我陪你持续前进

从哪里开始都可以，我会认真倾听并提供帮助 😊`
  }
}

export const mentorService = new MentorService()
