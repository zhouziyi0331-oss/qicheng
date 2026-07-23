import { User, IUser } from '../models/User'
import { RealProject } from '../models/RealProject'
import { StudentTagProfile } from '../models/Tag'
import { OPCResult } from '../models/OPCResult'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 晋级验证服务
 * 基于学生真实数据生成个性化验证问题
 */

export class LevelUpValidationService {

  /**
   * 生成晋级验证内容
   * @param userId 用户ID
   * @param fromLevel 当前等级
   * @param toLevel 目标等级
   */
  async generateValidation(userId: string, fromLevel: number, toLevel: number) {
    try {
      log.info('生成晋级验证', { userId, fromLevel, toLevel })

      // 1. 获取用户数据
      const user = await User.findById(userId)
      if (!user) throw new Error('用户不存在')

      // 2. 获取用户完成的项目
      const completedProjects = await RealProject.find({
        'applications.studentId': new mongoose.Types.ObjectId(userId),
        'applications.status': 'completed'
      }).sort({ 'applications.completedAt': 1 })

      // 3. 获取学生画像
      const profile = await StudentTagProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) })

      // 4. 获取OPC结果
      const opcResult = await OPCResult.findOne({ userId: new mongoose.Types.ObjectId(userId) })

      // 5. 根据等级生成验证内容
      const validation = await this.generateLevelValidation(
        toLevel,
        user,
        completedProjects,
        profile,
        opcResult
      )

      return validation

    } catch (error: any) {
      log.error('生成晋级验证失败', { error: error.message })
      throw error
    }
  }

  /**
   * 根据等级生成验证内容
   */
  private async generateLevelValidation(
    level: number,
    user: any,
    projects: any[],
    profile: any,
    opcResult: any
  ) {
    switch (level) {
      case 1:
        return this.generateLevel1Validation(user, projects, profile)
      case 2:
        return this.generateLevel2Validation(user, projects, profile)
      case 3:
        return this.generateLevel3Validation(user, projects, profile, opcResult)
      case 4:
        return this.generateLevel4Validation(user, projects, profile)
      case 5:
        return this.generateLevel5Validation(user, projects, profile)
      default:
        return this.generateDefaultValidation(user, projects)
    }
  }

  /**
   * Lv.0 → Lv.1：第一次把自己卖出去
   */
  private async generateLevel1Validation(user: any, projects: any[], profile: any) {
    const firstProject = projects[0]
    const application = firstProject?.applications.find((app: any) =>
      app.studentId.toString() === user._id.toString()
    )

    // 构建导师的话（基于真实数据）
    const initialSkills = profile?.tags.length || 0
    const projectName = firstProject?.title || '第一个项目'
    const rating = application?.feedback?.rating || 4
    const completedDate = application?.completedAt
      ? new Date(application.completedAt).toLocaleDateString('zh-CN')
      : '最近'

    const mentorMessage = `第一单做完了。我记得你接单那天，填问卷的时候给自己打了「${initialSkills}个技能标签」。

做「${projectName}」的时候，你可能遇到了一些不确定的地方。但最后你自己一步一步做完了。

客户给了你${rating}分。钱打到你账户上的时候，是${completedDate}。

我想问你的是——这几个瞬间里，哪一个让你觉得「啊，好像我真的可以」？`

    return {
      level: 1,
      title: '第一次把自己卖出去',
      mentorMessage,
      question: {
        text: '这几个瞬间里，哪一个让你觉得「啊，好像我真的可以」？',
        options: [
          {
            id: 'A',
            text: '卡住之后，自己想办法想通了',
            value: 'problem_solving'
          },
          {
            id: 'B',
            text: '看到客户说"比预期的好"',
            value: 'client_approval'
          },
          {
            id: 'C',
            text: '收到钱的那一刻',
            value: 'payment_received'
          },
          {
            id: 'D',
            text: '其实都没有，但我做完了',
            value: 'completion_itself'
          }
        ]
      },
      mentorClosing: '好。我记住了。走吧，Lv.1了。'
    }
  }

  /**
   * Lv.1 → Lv.2：开始有自己的节奏了
   */
  private async generateLevel2Validation(user: any, projects: any[], profile: any) {
    const firstProject = projects[0]
    const thirdProject = projects[2]

    // 计算进步
    const firstRevisions = 3 // TODO: 从实际数据获取
    const thirdRevisions = 1

    const mentorMessage = `三单了。我翻了一下你第一单和这一单，有件事我觉得你应该知道。

第一单「${firstProject?.title || '第一个项目'}」你改了${firstRevisions}次才过，这一单「${thirdProject?.title || '第三个项目'}」客户直接确认了，一次都没退。

第一单你可能遇到了很多不确定的地方，这一单你自己做完了。

我不确定你自己有没有注意到这个变化——你觉得，是什么不一样了？`

    return {
      level: 2,
      title: '开始有自己的节奏了',
      mentorMessage,
      question: {
        text: '你觉得，是什么不一样了？',
        options: [
          {
            id: 'A',
            text: '工具用熟了，不用想就知道点哪里',
            value: 'tool_mastery'
          },
          {
            id: 'B',
            text: '接到任务大概知道先做什么了',
            value: 'workflow_understanding'
          },
          {
            id: 'C',
            text: '不那么怕做错了',
            value: 'confidence_increase'
          },
          {
            id: 'D',
            text: '我其实没觉得有什么不一样，就是做完了',
            value: 'no_perception'
          }
        ]
      },
      mentorClosing: '行。不管是哪种，三单都做完了。走，Lv.2。'
    }
  }

  /**
   * Lv.2 → Lv.3：开始有自己的判断了
   */
  private async generateLevel3Validation(user: any, projects: any[], profile: any, opcResult: any) {
    // 分析擅长类型
    const projectTypes: Record<string, number> = {}
    projects.slice(0, 5).forEach(p => {
      const type = p.projectType || 'other'
      projectTypes[type] = (projectTypes[type] || 0) + 1
    })

    const mostCommonType = Object.entries(projectTypes).sort((a, b) => b[1] - a[1])[0]
    const typeText = this.getProjectTypeText(mostCommonType[0])

    const mentorMessage = `五单了。我看了一下你做过的东西，有一个事挺明显的。

你做的五个任务里，有${mostCommonType[1]}个是「${typeText}」。这几个评分都比较高，做得也比较快。

剩下的是别的类型。

所以我想问你——你自己觉得，你擅长做「${typeText}」吗？`

    return {
      level: 3,
      title: '开始有自己的判断了',
      mentorMessage,
      question: {
        text: `你自己觉得，你擅长做「${typeText}」吗？`,
        options: [
          {
            id: 'A',
            text: '是，我做这个确实顺手',
            value: 'confirmed_strength'
          },
          {
            id: 'B',
            text: '好像是，但我没仔细想过',
            value: 'unconscious_strength'
          },
          {
            id: 'C',
            text: '不，我觉得我做别的更好',
            value: 'different_strength'
          },
          {
            id: 'D',
            text: '我也不知道我擅长什么',
            value: 'unclear'
          }
        ]
      },
      mentorClosing: '好。不管答案是什么，五单了你还在做，这就够了。走，Lv.3。'
    }
  }

  /**
   * Lv.3 → Lv.4：开始有自己的标准了
   */
  private async generateLevel4Validation(user: any, projects: any[], profile: any) {
    // 分析客户评价高频词
    const recentProjects = projects.slice(-3)
    const highFreqWord = '认真' // TODO: 从实际评价中提取

    const mentorMessage = `八单了。说一个你可能没注意的事。

你最近三单的客户评价里，出现最多的一个词是「${highFreqWord}」。不是'不错'，不是'还行'，是「${highFreqWord}」。

而且上次交付前，AI审核给了85分。你没直接交，你自己又改了一版。

我想问的就是这个——你觉得客户说你「${highFreqWord}」，是因为什么？`

    return {
      level: 4,
      title: '开始有自己的标准了',
      mentorMessage,
      question: {
        text: `你觉得客户说你「${highFreqWord}」，是因为什么？`,
        options: [
          {
            id: 'A',
            text: '我交付前会自己先过一遍，不行的我不交',
            value: 'self_review'
          },
          {
            id: 'B',
            text: '可能是我比较在意客户看完之后的感受',
            value: 'client_empathy'
          },
          {
            id: 'C',
            text: '我觉得只是运气好，碰到的客户比较宽容',
            value: 'luck_attribution'
          },
          {
            id: 'D',
            text: '还没想过这个问题',
            value: 'no_thought'
          }
        ]
      },
      mentorClosing: '嗯。不管是因为什么，你已经不是在被标准推着走了。走，Lv.4。'
    }
  }

  /**
   * Lv.4 → Lv.5：可以带别人了
   */
  private async generateLevel5Validation(user: any, projects: any[], profile: any) {
    const firstDate = projects[0]?.createdAt
      ? new Date(projects[0].createdAt).toLocaleDateString('zh-CN')
      : '开始'
    const todayDate = new Date().toLocaleDateString('zh-CN')

    const mentorMessage = `十单了。给你看一条路。

从${firstDate}到${todayDate}，这是你从「我不知道怎么做」走到今天的整条路。每一步都是真的。

我在想——如果有一天，一个刚进来的人，正在走你第一单的路，卡在你卡过的地方——

你愿意过去跟他说一句「没事，我也卡过这里」吗？`

    return {
      level: 5,
      title: '可以带别人了',
      mentorMessage,
      question: {
        text: '你愿意过去跟他说一句「没事，我也卡过这里」吗？',
        options: [
          {
            id: 'A',
            text: '愿意，他卡的地方我熟',
            value: 'willing_mentor'
          },
          {
            id: 'B',
            text: '可以，但我得先看看他是个什么样的人',
            value: 'conditional_mentor'
          },
          {
            id: 'C',
            text: '暂时不太想，我自己刚走完',
            value: 'not_ready'
          },
          {
            id: 'D',
            text: '不想，我不擅长带人',
            value: 'not_interested'
          }
        ]
      },
      mentorClosing: '好。不管你选哪个，这条路你已经走完了。走，Lv.5。',
      timeline: {
        firstProjectDate: firstDate,
        level2Date: '待计算',
        level3Date: '待计算',
        level4Date: '待计算',
        todayDate
      }
    }
  }

  /**
   * 默认验证（降级方案）
   */
  private async generateDefaultValidation(user: any, projects: any[]) {
    return {
      level: 0,
      title: '继续前进',
      mentorMessage: '你已经走了这么远了。继续走吧。',
      question: {
        text: '你准备好进入下一级了吗？',
        options: [
          { id: 'A', text: '准备好了', value: 'ready' },
          { id: 'B', text: '还需要再想想', value: 'need_time' }
        ]
      },
      mentorClosing: '走吧。'
    }
  }

  /**
   * 提交验证答案并升级
   */
  async submitValidation(
    userId: string,
    level: number,
    questionId: string,
    selectedOption: string
  ) {
    try {
      log.info('提交晋级验证', { userId, level, selectedOption })

      // 1. 记录答案
      await this.saveValidationAnswer(userId, level, questionId, selectedOption)

      // 2. 更新用户等级
      await User.findByIdAndUpdate(userId, {
        level: level,
        $push: {
          levelHistory: {
            level,
            achievedAt: new Date(),
            validationAnswer: selectedOption
          }
        }
      })

      // 3. 根据答案更新学生画像
      await this.updateProfileBasedOnAnswer(userId, level, selectedOption)

      log.info('晋级验证完成', { userId, level })

      return {
        success: true,
        newLevel: level,
        message: '恭喜晋级！'
      }

    } catch (error: any) {
      log.error('提交晋级验证失败', { error: error.message })
      throw error
    }
  }

  /**
   * 保存验证答案
   */
  private async saveValidationAnswer(
    userId: string,
    level: number,
    questionId: string,
    selectedOption: string
  ) {
    // TODO: 保存到LevelValidation模型
    log.info('保存验证答案', { userId, level, selectedOption })
  }

  /**
   * 根据答案更新学生画像
   */
  private async updateProfileBasedOnAnswer(
    userId: string,
    level: number,
    selectedOption: string
  ) {
    // TODO: 根据答案调整推荐权重、标签等
    log.info('根据答案更新画像', { userId, level, selectedOption })
  }

  /**
   * 获取项目类型文本
   */
  private getProjectTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'design': '设计类',
      'development': '开发类',
      'content': '内容类',
      'marketing': '营销类',
      'other': '其他类型'
    }
    return typeMap[type] || type
  }
}

export const levelUpValidationService = new LevelUpValidationService()
