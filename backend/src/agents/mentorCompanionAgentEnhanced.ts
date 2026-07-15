/**
 * 导师Agent增强包装层
 * Phase R2: 为现有mentorService添加6层记忆能力 + 12触发场景专门处理
 *
 * 🔒 重要：本文件不修改mentorService.ts和mentorCoreService.ts
 * 采用包装模式，在外部添加记忆增强
 */

import { memoryService } from '../services/memoryService';
import { mentorService } from '../services/mentorService';
import logger from '../utils/logger';
import {
  MentorTrigger,
  EventData,
  AgentInvocationResult,
  MentorMemory
} from '../types/orchestrator';

export class MentorCompanionAgentEnhanced {
  /**
   * 处理导师消息（增强版）
   * 流程：加载6层记忆 → 调用现有mentorService → 保存记忆更新
   */
  async handleMessage(
    userId: string,
    message: string,
    trigger: MentorTrigger,
    context?: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const startTime = Date.now();

    try {
      // 1. 加载6层记忆
      const memory = await this.loadMemoryForMentor(userId, context?.taskId);

      // 2. 构建增强的上下文（包含记忆）
      const enhancedContext = {
        ...context,
        memory,
        trigger,
        // 添加记忆摘要到prompt
        memorySummary: this.buildMemorySummary(memory)
      };

      // 3. 🔒 调用现有mentorService（不修改原有代码）
      // mentorService.sendMessage需要 (userId, sessionId, message)
      const sessionId = context?.sessionId || `session_${Date.now()}`;

      let response: string;

      // 开发测试模式：跳过mentorService调用（因为缺少mentor_messages表）
      if (process.env.NODE_ENV === 'development') {
        response = `[测试模式] 导师回复 (${trigger}): ${context?.systemPrompt || '已处理'}`;
        logger.info(`[测试模式] 跳过mentorService调用，触发场景: ${trigger}`);
      } else {
        response = await mentorService.sendMessage(userId, sessionId, message);
      }

      // 4. 从response中提取记忆更新信号
      await this.updateMemoryFromResponse(userId, message, { content: response }, context?.taskId);

      // 5. 更新L6关系记忆（每次对话）
      await memoryService.updateRelationshipMemory(userId, {
        addSummary: {
          topic: this.extractTopic(message),
          emotionalTone: this.detectEmotion(message),
          outcome: 'responded'
        }
      });

      return {
        success: true,
        agentName: 'mentorCompanionAgentEnhanced',
        data: { response, memory },
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error('导师Agent增强层处理失败:', error);
      return {
        success: false,
        agentName: 'mentorCompanionAgentEnhanced',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 为导师加载完整记忆
   */
  private async loadMemoryForMentor(userId: string, taskId?: string): Promise<MentorMemory> {
    try {
      const memory = await memoryService.loadAllLayers(userId);

      // 如果有任务上下文，加载L2
      if (taskId) {
        const taskContext = await memoryService.loadTaskContext(userId, taskId);
        memory.L2_task = taskContext || undefined;
      }

      return memory;
    } catch (error) {
      logger.error('加载导师记忆失败:', error);
      return {}; // 降级：记忆加载失败不阻塞核心功能
    }
  }

  /**
   * 构建记忆摘要（注入到prompt）
   */
  private buildMemorySummary(memory: MentorMemory): string {
    const parts: string[] = [];

    // L5: 核心画像
    if (memory.L5_core) {
      const { nickname, level, talentProfile, track } = memory.L5_core;
      parts.push(`【学生画像】${nickname}，Lv.${level}，${track || '未确定赛道'}`);

      if (talentProfile) {
        parts.push(`天赋类型：${talentProfile.personality_tag}`);
      }
    }

    // L6: 关系记忆
    if (memory.L6_relationship) {
      const { relationshipStage, totalConversations, memorableQuotes } = memory.L6_relationship;
      parts.push(`【关系】${relationshipStage}阶段，已对话${totalConversations}次`);

      if (memorableQuotes && memorableQuotes.length > 0) {
        const lastQuote = memorableQuotes[memorableQuotes.length - 1];
        parts.push(`曾说过："${lastQuote.quote}"`);
      }
    }

    // L3: 近期状态
    if (memory.L3_recent) {
      const { tasksCompleted30d, emotionTrend, topStuckTypes } = memory.L3_recent;
      parts.push(`【近期】完成${tasksCompleted30d}单，情绪${emotionTrend}`);

      if (topStuckTypes && topStuckTypes.length > 0) {
        parts.push(`常卡在：${topStuckTypes.join('、')}`);
      }
    }

    // L2: 当前任务
    if (memory.L2_task) {
      const { taskPhase, stuckPoints, hintsGiven } = memory.L2_task;
      parts.push(`【当前任务】${taskPhase}阶段`);

      if (stuckPoints && stuckPoints.length > 0) {
        const unresolvedCount = stuckPoints.filter(p => !p.resolved).length;
        if (unresolvedCount > 0) {
          parts.push(`有${unresolvedCount}个卡点待解决`);
        }
      }

      if (hintsGiven && hintsGiven.length > 0) {
        parts.push(`已给过${hintsGiven.length}个提示`);
      }
    }

    // L4: 成长轨迹
    if (memory.L4_growth) {
      const { milestones, taskMicroReports } = memory.L4_growth;

      if (milestones && milestones.length > 0) {
        const lastMilestone = milestones[milestones.length - 1];
        parts.push(`【里程碑】最近达成：${lastMilestone.description}`);
      }

      if (taskMicroReports && taskMicroReports.length > 0) {
        const lastReport = taskMicroReports[taskMicroReports.length - 1];
        if (lastReport.breakthrough) {
          parts.push(`上次突破：${lastReport.breakthrough}`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * 从response中更新记忆
   */
  private async updateMemoryFromResponse(
    userId: string,
    userMessage: string,
    mentorResponse: { content: string },
    taskId?: string
  ): Promise<void> {
    try {
      // 检测情绪
      const emotion = this.detectEmotion(userMessage);

      // 如果检测到重要话语，记录到L6
      if (this.isMemorableQuote(userMessage)) {
        await memoryService.updateRelationshipMemory(userId, {
          addQuote: {
            quote: userMessage,
            context: '对话中'
          }
        });
      }

      // 如果有任务上下文，更新L2
      if (taskId && emotion) {
        await memoryService.updateTaskContext(userId, taskId, {
          addEmotionEvent: {
            emotion,
            intensity: this.getEmotionIntensity(userMessage)
          }
        });

        // 检测卡点
        if (this.isStuckMessage(userMessage)) {
          await memoryService.updateTaskContext(userId, taskId, {
            addStuckPoint: {
              description: userMessage,
              resolved: false
            }
          });
        }

        // 记录导师给的提示
        if (mentorResponse.content && mentorResponse.content.length > 0) {
          await memoryService.updateTaskContext(userId, taskId, {
            addHint: mentorResponse.content.substring(0, 100)
          });
        }
      }

    } catch (error) {
      logger.error('更新记忆失败:', error);
      // 记忆更新失败不影响核心功能
    }
  }

  /**
   * 情绪检测（增强版）
   */
  private detectEmotion(message: string): string {
    const emotions = {
      frustrated: ['不会', '不懂', '太难', '卡住', '做不出', '完全没思路', '不知道怎么办'],
      anxious: ['紧张', '担心', '着急', '来不及', '压力', '焦虑', '怕'],
      confused: ['不理解', '不明白', '混乱', '糊涂', '搞不清', '模糊'],
      excited: ['太好了', '明白了', '学会了', '成功了', '做到了', '懂了'],
      discouraged: ['放弃', '算了', '不想做', '没意思', '没信心'],
      neutral: []
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(kw => message.includes(kw))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * 获取情绪强度
   */
  private getEmotionIntensity(message: string): number {
    // 简单规则：感叹号越多，强度越高
    const exclamationCount = (message.match(/！|!/g) || []).length;
    return Math.min(exclamationCount * 0.3 + 0.5, 1.0);
  }

  /**
   * 判断是否为值得记录的重要话语
   */
  private isMemorableQuote(message: string): boolean {
    // 规则：包含"想"、"希望"、"梦想"等关键词，或长度超过50字
    const keywords = ['想', '希望', '梦想', '目标', '计划', '喜欢', '擅长', '将来', '未来'];
    return keywords.some(kw => message.includes(kw)) || message.length > 50;
  }

  /**
   * 判断是否为卡点消息
   */
  private isStuckMessage(message: string): boolean {
    const stuckKeywords = ['不会', '不懂', '卡住', '做不出', '不知道', '求助', '帮帮我'];
    return stuckKeywords.some(kw => message.includes(kw));
  }

  /**
   * 提取对话主题
   */
  private extractTopic(message: string): string {
    // 简单实现：取前20个字符
    return message.substring(0, 20) + (message.length > 20 ? '...' : '');
  }

  /**
   * Phase R2: 12个触发场景的专门处理逻辑
   */
  async handleTrigger(
    userId: string,
    trigger: MentorTrigger,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    logger.info(`[handleTrigger] 收到触发场景: ${trigger}, userId: ${userId}`);

    // 调试：记录完整context
    console.log(`[handleTrigger] trigger=${trigger}, context=`, JSON.stringify(context));

    // 根据不同触发场景，构建不同的消息和处理策略
    switch (trigger) {
      case MentorTrigger.USER_INITIATED:
        return this.handleUserInitiated(userId, context);

      case MentorTrigger.TASK_ACCEPTED:
        return this.handleTaskAccepted(userId, context);

      case MentorTrigger.STUCK_HELP_REQUEST:
        return this.handleStuckHelpRequest(userId, context);

      case MentorTrigger.EMOTIONAL_DISTRESS_DETECTED:
        return this.handleEmotionalDistress(userId, context);

      case MentorTrigger.TASK_COMPLETED:
        return this.handleTaskCompleted(userId, context);

      case MentorTrigger.PROACTIVE_CHECKIN:
        return this.handleProactiveCheckin(userId, context);

      case MentorTrigger.TASK_REJECTED_COMFORT:
        return this.handleTaskRejectedComfort(userId, context);

      case MentorTrigger.MILESTONE_REACHED:
        logger.info(`[handleTrigger] 路由到handleMilestoneReached`);
        return this.handleMilestoneReached(userId, context);

      case MentorTrigger.LONG_SILENCE:
        return this.handleLongSilence(userId, context);

      case MentorTrigger.BREAKTHROUGH_MOMENT:
        return this.handleBreakthroughMoment(userId, context);

      case MentorTrigger.PATTERN_RECOGNITION:
        return this.handlePatternRecognition(userId, context);

      case MentorTrigger.RELATIONSHIP_DEEPENING:
        return this.handleRelationshipDeepening(userId, context);

      default:
        logger.warn(`[handleTrigger] 未知触发场景: ${trigger}`);
        return this.handleMessage(userId, context.message || '', trigger, context);
    }
  }

  /**
   * 场景1: 学生主动对话
   * 策略：直接回应，保持苏格拉底式引导
   */
  private async handleUserInitiated(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const message = context.message || '';
    return this.handleMessage(userId, message, MentorTrigger.USER_INITIATED, context);
  }

  /**
   * 场景2: 任务接取
   * 策略：欢迎开场 + 任务要点提醒 + 建立L2任务记忆
   */
  private async handleTaskAccepted(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { taskId, taskTitle, taskDifficulty } = context;

    // 初始化L2任务记忆
    if (taskId) {
      await memoryService.createTaskContext(userId, taskId, {
        taskPhase: 'started',
        stuckPoints: [],
        hintsGiven: [],
        emotionTimeline: [],
        mentorAssessment: {
          confidenceLevel: 0.5,
          skillGaps: [],
          strengths: []
        }
      });
    }

    const message = `开始任务：${taskTitle || '新任务'}`;
    return this.handleMessage(userId, message, MentorTrigger.TASK_ACCEPTED, {
      ...context,
      systemPrompt: '这是学生刚接取的任务，给予鼓励和简要指导，不要直接给答案'
    });
  }

  /**
   * 场景3: 主动求助（卡点）
   * 策略：先接住情绪 → 查询L4成长档案找类似案例 → 给线索不给答案
   */
  private async handleStuckHelpRequest(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const message = context.message || '遇到困难了';
    const { taskId } = context;

    // 记录卡点到L2
    if (taskId) {
      await memoryService.updateTaskContext(userId, taskId, {
        addStuckPoint: {
          description: message,
          resolved: false
        }
      });
    }

    // 加载记忆，查看历史卡点模式
    const memory = await this.loadMemoryForMentor(userId, taskId);
    let similarStuckPattern = '';

    if (memory.L3_recent?.topStuckTypes && memory.L3_recent.topStuckTypes.length > 0) {
      similarStuckPattern = `（你之前也在${memory.L3_recent.topStuckTypes[0]}上卡过）`;
    }

    return this.handleMessage(userId, message, MentorTrigger.STUCK_HELP_REQUEST, {
      ...context,
      systemPrompt: `学生遇到卡点${similarStuckPattern}。先接住情绪（"我理解这个确实挺难的"），然后用苏格拉底式提问引导思考，不要直接给答案。`
    });
  }

  /**
   * 场景4: 情绪低落检测
   * 策略：情感支持为主 + 轻量引导 + 记录到L2情绪时间线
   */
  private async handleEmotionalDistress(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { taskId, detectedEmotion, emotionIntensity } = context;

    // 记录情绪事件到L2
    if (taskId) {
      await memoryService.updateTaskContext(userId, taskId, {
        addEmotionEvent: {
          emotion: detectedEmotion || 'distressed',
          intensity: emotionIntensity || 0.7
        }
      });
    }

    const message = context.message || '我感觉有点难受';

    return this.handleMessage(userId, message, MentorTrigger.EMOTIONAL_DISTRESS_DETECTED, {
      ...context,
      systemPrompt: '学生情绪低落，优先提供情感支持和陪伴，暂时不要推进任务。可以分享相似经历，让学生感觉不孤单。'
    });
  }

  /**
   * 场景5: 任务完成
   * 策略：庆祝 + 反思引导 + 生成L4任务微报告 + 更新L3近期摘要
   */
  private async handleTaskCompleted(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { taskId, taskTitle, completionTime } = context;

    // 生成L4任务微报告（简化版）
    const memory = await this.loadMemoryForMentor(userId, taskId);
    const keyLearnings: string[] = [];
    let breakthrough: string | undefined;

    if (memory.L2_task?.stuckPoints) {
      const resolvedStuck = memory.L2_task.stuckPoints.filter(p => p.resolved);
      if (resolvedStuck.length > 0) {
        breakthrough = `克服了${resolvedStuck.length}个卡点`;
      }
    }

    if (taskId) {
      await memoryService.updateGrowthArchive(userId, {
        addTaskReport: {
          taskId,
          completionDate: new Date(),
          keyLearnings,
          breakthrough
        }
      });

      // 更新L3近期摘要（完成任务数+1）
      await memoryService.updateRecentSummary(userId, {
        incrementTasksCompleted: true
      });
    }

    const message = `完成了任务：${taskTitle || '任务'}`;

    return this.handleMessage(userId, message, MentorTrigger.TASK_COMPLETED, {
      ...context,
      systemPrompt: '庆祝学生完成任务！引导反思：最困难的部分是什么？学到了什么？可以用到未来哪里？'
    });
  }

  /**
   * 场景6: 主动关怀
   * 策略：查看L3近期状态 + L2当前任务进度，提供个性化关怀
   */
  private async handleProactiveCheckin(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const memory = await this.loadMemoryForMentor(userId);

    let checkinMessage = '最近怎么样？';

    // 根据L3近期状态定制关怀
    if (memory.L3_recent) {
      const { tasksInProgress, lastActiveAt, emotionTrend } = memory.L3_recent;

      if (tasksInProgress > 0) {
        checkinMessage = `看到你有${tasksInProgress}个任务在进行中，进展如何？`;
      } else if (lastActiveAt) {
        const daysSinceActive = Math.floor(
          (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceActive > 3) {
          checkinMessage = `好几天没见到你了，最近还好吗？`;
        }
      }

      if (emotionTrend === 'declining') {
        checkinMessage += ' 感觉你最近情绪不太高，想聊聊吗？';
      }
    }

    return this.handleMessage(userId, checkinMessage, MentorTrigger.PROACTIVE_CHECKIN, {
      ...context,
      systemPrompt: '这是主动关怀，语气要温暖自然，像朋友而非监督者。'
    });
  }

  /**
   * 场景7: 质控打回安慰
   * 策略：接住挫败感 + 归因外部化 + 具体改进建议
   */
  private async handleTaskRejectedComfort(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { taskId, rejectionReason } = context;

    // 记录到L2情绪事件
    if (taskId) {
      await memoryService.updateTaskContext(userId, taskId, {
        addEmotionEvent: {
          emotion: 'disappointed',
          intensity: 0.6
        }
      });
    }

    const message = `任务被打回了：${rejectionReason || '需要修改'}`;

    return this.handleMessage(userId, message, MentorTrigger.TASK_REJECTED_COMFORT, {
      ...context,
      systemPrompt: '任务被质控打回，学生可能有挫败感。先接住情绪（"第一次很难达到要求很正常"），然后给具体改进方向。强调这是学习过程的一部分。'
    });
  }

  /**
   * 场景8: 里程碑达成
   * 策略：庆祝 + 回顾成长路径 + 记录到L4里程碑
   */
  private async handleMilestoneReached(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { milestone, milestoneType, impact } = context;

    // 强制抛出错误来确认这个方法被调用了
    if (!milestone) {
      throw new Error(`[TEST] handleMilestoneReached被调用但milestone为空: ${JSON.stringify(context)}`);
    }

    console.log(`[DEBUG handleMilestoneReached] 开始处理，userId=${userId}, milestone=${milestone}`);

    // 记录里程碑到L4
    try {
      logger.info(`[handleMilestoneReached] 开始记录里程碑: ${milestone}`);
      console.log(`[DEBUG] 调用 updateGrowthArchive, milestone=${milestone}, type=${milestoneType}`);

      await memoryService.updateGrowthArchive(userId, {
        addMilestone: {
          type: milestoneType || 'achievement',
          description: milestone || '达成里程碑',
          impact: impact || '重要成长节点'
        }
      });

      console.log(`[DEBUG] updateGrowthArchive 完成`);
      logger.info(`[handleMilestoneReached] 里程碑记录成功`);
    } catch (error) {
      console.error(`[DEBUG] updateGrowthArchive 失败:`, error);
      logger.error(`[handleMilestoneReached] 里程碑记录失败:`, error);
      // 继续执行，不因记忆更新失败而中断
    }

    // 检查是否应该升级关系阶段
    const memory = await this.loadMemoryForMentor(userId);
    if (memory.L6_relationship) {
      const { relationshipStage, totalConversations } = memory.L6_relationship;

      // 简单规则：对话超过10次且达成里程碑 → warming阶段
      if (relationshipStage === 'new' && totalConversations >= 10) {
        await memoryService.updateRelationshipMemory(userId, {
          updateStage: 'warming'
        });
      }
    }

    const message = `达成里程碑：${milestone || '重要成就'}`;

    return this.handleMessage(userId, message, MentorTrigger.MILESTONE_REACHED, {
      ...context,
      systemPrompt: '庆祝里程碑！回顾学生的成长路径，强调ta已经走了多远。可以展望下一个目标。'
    });
  }

  /**
   * 场景9: 长时间未活跃
   * 策略：温和召回 + 展示进度可视化 + 低压力邀请
   */
  private async handleLongSilence(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const memory = await this.loadMemoryForMentor(userId);

    let silenceMessage = '好久不见，想你了！';

    // 根据L5画像和L3状态定制召回策略
    if (memory.L5_core && memory.L3_recent) {
      const { tasksInProgress } = memory.L3_recent;

      if (tasksInProgress > 0) {
        silenceMessage = `你的任务还在等你呢，随时回来继续就好~`;
      } else {
        silenceMessage = `有个新任务感觉很适合你，要不要看看？`;
      }
    }

    return this.handleMessage(userId, silenceMessage, MentorTrigger.LONG_SILENCE, {
      ...context,
      systemPrompt: '长时间未活跃召回，语气要轻松无压力，像老朋友打招呼。不要责备或施压。'
    });
  }

  /**
   * 场景10: 突破性时刻
   * 策略：强化正向体验 + 记录突破到L4 + 鼓励复现
   */
  private async handleBreakthroughMoment(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { breakthrough, taskId } = context;

    // 记录突破到L4最近的任务报告
    if (taskId) {
      await memoryService.updateGrowthArchive(userId, {
        addTaskReport: {
          taskId,
          completionDate: new Date(),
          keyLearnings: [breakthrough || '重要突破'],
          breakthrough: breakthrough || '实现了重要突破'
        }
      });
    }

    const message = `突破：${breakthrough || '学生有重要突破'}`;

    return this.handleMessage(userId, message, MentorTrigger.BREAKTHROUGH_MOMENT, {
      ...context,
      systemPrompt: '学生有突破性进展！强烈庆祝和肯定，帮助ta意识到这个突破的意义。询问"你是怎么做到的？"强化成功经验。'
    });
  }

  /**
   * 场景11: 模式识别触发
   * 策略：温和指出模式 + 提供选择而非指令
   */
  private async handlePatternRecognition(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    const { pattern, patternType } = context;

    // 从L3和L4中提取模式证据
    const memory = await this.loadMemoryForMentor(userId);
    let patternEvidence = '';

    if (patternType === 'stuck_pattern' && memory.L3_recent?.topStuckTypes) {
      patternEvidence = `我注意到你最近几次都在${memory.L3_recent.topStuckTypes[0]}上遇到困难`;
    }

    const message = pattern || patternEvidence || '发现了一个模式';

    return this.handleMessage(userId, message, MentorTrigger.PATTERN_RECOGNITION, {
      ...context,
      systemPrompt: '识别到学生的行为模式。用好奇而非评判的语气提出观察，给学生选择是否改变，而不是强制建议。'
    });
  }

  /**
   * 场景12: 关系深化
   * 策略：分享导师脆弱性 + 深度对话 + 更新L6关系阶段
   */
  private async handleRelationshipDeepening(
    userId: string,
    context: Record<string, any>
  ): Promise<AgentInvocationResult> {
    // 更新L6关系阶段到 'trusted' 或 'deep'
    const memory = await this.loadMemoryForMentor(userId);

    if (memory.L6_relationship) {
      const { relationshipStage, totalConversations } = memory.L6_relationship;

      // 规则：warming阶段 + 对话超过30次 → trusted
      if (relationshipStage === 'warming' && totalConversations >= 30) {
        await memoryService.updateRelationshipMemory(userId, {
          updateStage: 'trusted'
        });
      }
      // 规则：trusted阶段 + 对话超过50次 → deep
      else if (relationshipStage === 'trusted' && totalConversations >= 50) {
        await memoryService.updateRelationshipMemory(userId, {
          updateStage: 'deep'
        });
      }
    }

    const message = context.message || '我们聊得越来越深入了';

    return this.handleMessage(userId, message, MentorTrigger.RELATIONSHIP_DEEPENING, {
      ...context,
      systemPrompt: '关系进入深层。可以分享一些导师（AI）的"脆弱性"或不确定性，建立更真实的连接。鼓励深度对话。'
    });
  }
}

export const mentorCompanionAgentEnhanced = new MentorCompanionAgentEnhanced();
