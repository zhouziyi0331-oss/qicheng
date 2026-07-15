/**
 * 导师Agent增强包装层
 * Phase R2: 为现有mentorService添加6层记忆能力 + 12触发场景专门处理
 *
 * 🔒 重要：本文件不修改mentorService.ts和mentorCoreService.ts
 * 采用包装模式，在外部添加记忆增强
 */
import { MentorTrigger, AgentInvocationResult } from '../types/orchestrator';
export declare class MentorCompanionAgentEnhanced {
    /**
     * 处理导师消息（增强版）
     * 流程：加载6层记忆 → 调用现有mentorService → 保存记忆更新
     */
    handleMessage(userId: string, message: string, trigger: MentorTrigger, context?: Record<string, any>): Promise<AgentInvocationResult>;
    /**
     * 为导师加载完整记忆
     */
    private loadMemoryForMentor;
    /**
     * 构建记忆摘要（注入到prompt）
     */
    private buildMemorySummary;
    /**
     * 从response中更新记忆
     */
    private updateMemoryFromResponse;
    /**
     * 情绪检测（增强版）
     */
    private detectEmotion;
    /**
     * 获取情绪强度
     */
    private getEmotionIntensity;
    /**
     * 判断是否为值得记录的重要话语
     */
    private isMemorableQuote;
    /**
     * 判断是否为卡点消息
     */
    private isStuckMessage;
    /**
     * 提取对话主题
     */
    private extractTopic;
    /**
     * Phase R2: 12个触发场景的专门处理逻辑
     */
    handleTrigger(userId: string, trigger: MentorTrigger, context: Record<string, any>): Promise<AgentInvocationResult>;
    /**
     * 场景1: 学生主动对话
     * 策略：直接回应，保持苏格拉底式引导
     */
    private handleUserInitiated;
    /**
     * 场景2: 任务接取
     * 策略：欢迎开场 + 任务要点提醒 + 建立L2任务记忆
     */
    private handleTaskAccepted;
    /**
     * 场景3: 主动求助（卡点）
     * 策略：先接住情绪 → 查询L4成长档案找类似案例 → 给线索不给答案
     */
    private handleStuckHelpRequest;
    /**
     * 场景4: 情绪低落检测
     * 策略：情感支持为主 + 轻量引导 + 记录到L2情绪时间线
     */
    private handleEmotionalDistress;
    /**
     * 场景5: 任务完成
     * 策略：庆祝 + 反思引导 + 生成L4任务微报告 + 更新L3近期摘要
     */
    private handleTaskCompleted;
    /**
     * 场景6: 主动关怀
     * 策略：查看L3近期状态 + L2当前任务进度，提供个性化关怀
     */
    private handleProactiveCheckin;
    /**
     * 场景7: 质控打回安慰
     * 策略：接住挫败感 + 归因外部化 + 具体改进建议
     */
    private handleTaskRejectedComfort;
    /**
     * 场景8: 里程碑达成
     * 策略：庆祝 + 回顾成长路径 + 记录到L4里程碑
     */
    private handleMilestoneReached;
    /**
     * 场景9: 长时间未活跃
     * 策略：温和召回 + 展示进度可视化 + 低压力邀请
     */
    private handleLongSilence;
    /**
     * 场景10: 突破性时刻
     * 策略：强化正向体验 + 记录突破到L4 + 鼓励复现
     */
    private handleBreakthroughMoment;
    /**
     * 场景11: 模式识别触发
     * 策略：温和指出模式 + 提供选择而非指令
     */
    private handlePatternRecognition;
    /**
     * 场景12: 关系深化
     * 策略：分享导师脆弱性 + 深度对话 + 更新L6关系阶段
     */
    private handleRelationshipDeepening;
}
export declare const mentorCompanionAgentEnhanced: MentorCompanionAgentEnhanced;
//# sourceMappingURL=mentorCompanionAgentEnhanced.d.ts.map