"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskProgressService = exports.TaskProgressService = void 0;
const openai_1 = __importDefault(require("openai"));
const TaskProgress_1 = require("../models/TaskProgress");
const PracticeProject_1 = require("../models/PracticeProject");
const RealProject_1 = require("../models/RealProject");
const mongoose_1 = __importDefault(require("mongoose"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder'
});
/**
 * 任务进度服务
 *
 * 核心功能：根据真实项目内容，AI生成个性化的任务拆解
 * 每个项目的拆解都是独一无二的，不是通用模板
 */
class TaskProgressService {
    /**
     * 为项目生成任务拆解（AI深度分析项目内容）
     */
    async generateTaskDecomposition(userId, projectType, projectId) {
        // 1. 获取项目详细信息
        const project = projectType === 'practice'
            ? await PracticeProject_1.PracticeProject.findById(projectId)
            : await RealProject_1.RealProject.findById(projectId);
        if (!project) {
            throw new Error('项目不存在');
        }
        // 2. 调用GPT-4进行深度分析和任务拆解
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `你是一位经验丰富的项目管理专家和技术导师。

你的任务是：根据用户提供的项目详情，进行深度分析和任务拆解。

重要要求：
1. 必须根据项目的具体内容来拆解，不要使用通用模板
2. 每个任务要有清晰的思路说明（为什么这样做）
3. 每个任务要有具体的步骤（怎么做）
4. 步骤要详细、可执行，包含时间估算和实用建议
5. 考虑项目的难度和用户的能力水平

返回JSON格式：
{
  "tasks": [
    {
      "taskNumber": 1,
      "title": "任务标题",
      "description": "任务描述",
      "approach": "这个任务的做法思路（为什么这样做，从哪里入手）",
      "steps": [
        {
          "stepNumber": 1,
          "content": "具体步骤内容",
          "estimatedTime": "预计时间（如：2小时、1天）",
          "tips": ["实用建议1", "实用建议2"]
        }
      ],
      "estimatedDuration": "总预计时长",
      "deliverables": [
        {
          "name": "交付物名称",
          "description": "交付物说明"
        }
      ]
    }
  ],
  "aiRecommendations": [
    {
      "type": "task_order",
      "content": "建议内容",
      "priority": "high"
    }
  ]
}`
                },
                {
                    role: 'user',
                    content: `请为以下项目生成详细的任务拆解：

项目标题：${project.title}
项目描述：${'description' in project ? project.description : ''}
${projectType === 'practice' ? `项目类型：实践项目` : `项目类型：真实接单项目`}
${projectType === 'real' && 'difficulty' in project ? `难度等级：${project.difficulty}` : ''}
${projectType === 'real' && 'requirements' in project ? `项目需求：${project.requirements}` : ''}

请根据以上信息，生成3-6个具体任务的详细拆解，包括思路、步骤、时间估算和建议。`
                }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });
        const aiResult = JSON.parse(completion.choices[0].message.content || '{}');
        // 3. 创建任务进度记录
        const taskProgress = new TaskProgress_1.TaskProgress({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            projectType,
            projectId: new mongoose_1.default.Types.ObjectId(projectId),
            projectSnapshot: {
                title: project.title,
                description: 'description' in project ? project.description : '',
                difficulty: projectType === 'real' && 'difficulty' in project ? project.difficulty : 'medium'
            },
            tasks: aiResult.tasks.map((task) => ({
                ...task,
                status: task.taskNumber === 1 ? 'pending' : 'pending',
                progress: 0,
                deliverables: task.deliverables.map((d) => ({
                    ...d,
                    completed: false
                }))
            })),
            overallProgress: 0,
            status: 'planning',
            aiRecommendations: aiResult.aiRecommendations || []
        });
        await taskProgress.save();
        return taskProgress;
    }
    /**
     * 获取项目的任务进度
     */
    async getTaskProgress(userId, projectId) {
        return await TaskProgress_1.TaskProgress.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        });
    }
    /**
     * 更新任务状态
     */
    async updateTaskStatus(userId, progressId, taskNumber, updates) {
        const taskProgress = await TaskProgress_1.TaskProgress.findOne({
            _id: new mongoose_1.default.Types.ObjectId(progressId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!taskProgress) {
            throw new Error('任务进度不存在');
        }
        // 找到对应的任务
        const taskIndex = taskProgress.tasks.findIndex(t => t.taskNumber === taskNumber);
        if (taskIndex === -1) {
            throw new Error('任务不存在');
        }
        // 更新任务状态
        Object.assign(taskProgress.tasks[taskIndex], updates);
        // 重新计算整体进度
        const completedTasks = taskProgress.tasks.filter(t => t.status === 'completed').length;
        taskProgress.overallProgress = Math.round((completedTasks / taskProgress.tasks.length) * 100);
        // 更新项目状态
        if (taskProgress.overallProgress === 100) {
            taskProgress.status = 'completed';
        }
        else if (taskProgress.overallProgress > 0) {
            taskProgress.status = 'in_progress';
        }
        await taskProgress.save();
        return taskProgress;
    }
    /**
     * 记录任务中遇到的问题和解决方案
     */
    async addChallenge(userId, progressId, taskNumber, problem, solution) {
        const taskProgress = await TaskProgress_1.TaskProgress.findOne({
            _id: new mongoose_1.default.Types.ObjectId(progressId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!taskProgress) {
            throw new Error('任务进度不存在');
        }
        const taskIndex = taskProgress.tasks.findIndex(t => t.taskNumber === taskNumber);
        if (taskIndex === -1) {
            throw new Error('任务不存在');
        }
        if (!taskProgress.tasks[taskIndex].challenges) {
            taskProgress.tasks[taskIndex].challenges = [];
        }
        taskProgress.tasks[taskIndex].challenges.push({
            problem,
            solution,
            recordedAt: new Date()
        });
        await taskProgress.save();
        return taskProgress;
    }
    /**
     * 添加任务反思
     */
    async addReflection(userId, progressId, taskNumber, reflection) {
        const taskProgress = await TaskProgress_1.TaskProgress.findOne({
            _id: new mongoose_1.default.Types.ObjectId(progressId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!taskProgress) {
            throw new Error('任务进度不存在');
        }
        const taskIndex = taskProgress.tasks.findIndex(t => t.taskNumber === taskNumber);
        if (taskIndex === -1) {
            throw new Error('任务不存在');
        }
        taskProgress.tasks[taskIndex].reflection = reflection;
        await taskProgress.save();
        return taskProgress;
    }
    /**
     * 生成项目完成总结（AI分析）
     */
    async generateProjectSummary(userId, progressId) {
        const taskProgress = await TaskProgress_1.TaskProgress.findOne({
            _id: new mongoose_1.default.Types.ObjectId(progressId),
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!taskProgress) {
            throw new Error('任务进度不存在');
        }
        if (taskProgress.status !== 'completed') {
            throw new Error('项目尚未完成');
        }
        // 调用AI生成总结
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `你是项目总结专家。根据用户的项目执行数据，生成洞察性的项目总结。

返回JSON格式：
{
  "keyAchievements": ["关键成就1", "关键成就2"],
  "skillsImproved": ["提升的能力1", "提升的能力2"],
  "nextSteps": ["下一步建议1", "下一步建议2"]
}`
                },
                {
                    role: 'user',
                    content: `项目：${taskProgress.projectSnapshot.title}

完成的任务：
${taskProgress.tasks.map(t => `- ${t.title}（状态：${t.status}，进度：${t.progress}%）`).join('\n')}

遇到的挑战：
${taskProgress.tasks.flatMap(t => t.challenges || []).map(c => `- 问题：${c.problem} | 解决：${c.solution}`).join('\n')}

请生成项目总结，包括关键成就、提升的能力、下一步建议。`
                }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });
        const aiResult = JSON.parse(completion.choices[0].message.content || '{}');
        // 计算总时间
        const completedTasks = taskProgress.tasks.filter(t => t.status === 'completed');
        const totalChallenges = taskProgress.tasks.reduce((sum, t) => sum + (t.challenges?.length || 0), 0);
        taskProgress.projectSummary = {
            totalTimeSpent: this.calculateTotalTime(taskProgress.tasks),
            tasksCompleted: completedTasks.length,
            challengesFaced: totalChallenges,
            keyAchievements: aiResult.keyAchievements || [],
            skillsImproved: aiResult.skillsImproved || [],
            nextSteps: aiResult.nextSteps || []
        };
        await taskProgress.save();
        return taskProgress;
    }
    /**
     * 获取用户所有项目的任务进度列表
     */
    async getUserTaskProgressList(userId, status) {
        const query = { userId: new mongoose_1.default.Types.ObjectId(userId) };
        if (status) {
            query.status = status;
        }
        return await TaskProgress_1.TaskProgress.find(query).sort({ updatedAt: -1 });
    }
    /**
     * 计算总时间（辅助方法）
     */
    calculateTotalTime(tasks) {
        const completedTasks = tasks.filter(t => t.startedAt && t.completedAt);
        if (completedTasks.length === 0) {
            return '0小时';
        }
        const totalMs = completedTasks.reduce((sum, t) => {
            const duration = new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime();
            return sum + duration;
        }, 0);
        const hours = Math.round(totalMs / (1000 * 60 * 60));
        return `${hours}小时`;
    }
}
exports.TaskProgressService = TaskProgressService;
exports.taskProgressService = new TaskProgressService();
//# sourceMappingURL=taskProgress.service.js.map