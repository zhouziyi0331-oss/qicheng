"use strict";
// AI导师系统 - 控制器
// 实现5大触发场景的完整逻辑
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTaskStartGuidance = sendTaskStartGuidance;
exports.handleStuckMessage = handleStuckMessage;
exports.generateRejectionFeedback = generateRejectionFeedback;
exports.checkIdleStudents = checkIdleStudents;
exports.celebrateMilestone = celebrateMilestone;
exports.getConversations = getConversations;
const db_1 = require("../../utils/db");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
// ══════════════════════════════════════════════════════════════
// 场景1：任务开始时的「第一步引导」
// ══════════════════════════════════════════════════════════════
async function sendTaskStartGuidance(taskId, studentId) {
    try {
        // 获取任务信息
        const task = await (0, db_1.queryOne)('SELECT title, description, track_type, acceptance_criteria FROM tasks WHERE id = $1', [taskId]);
        if (!task)
            return;
        // 获取学生信息
        const student = await (0, db_1.queryOne)('SELECT opc_label, level, tasks_completed, six_dim_scores FROM student_capabilities WHERE student_id = $1', [studentId]);
        // 获取学生历史使用过的工具
        const toolHistory = await (0, db_1.query)(`SELECT DISTINCT jsonb_array_elements_text(milestone_data->'tools_used') as tool
       FROM student_milestones
       WHERE student_id = $1 AND milestone_type = 'new_tool'`, [studentId]);
        const usedTools = toolHistory.map((t) => t.tool).join(', ') || '暂无';
        // 构建AI Prompt
        const prompt = `你是启程平台的AI导师，学生刚接了一个任务。你的名字叫"启程小猫"，是一只顶着书本的可爱小猫。

## 任务信息
- 标题：${task.title}
- 描述：${task.description}
- 类型：${task.track_type === 'A' ? '内容创作' : '工具开发'}
- 验收标准：${task.acceptance_criteria || '按要求完成任务'}

## 学生信息
- OPC标签：${student?.opc_label || '未测评'}
- 等级：Lv.${student?.level || 0}
- 历史任务数：${student?.tasks_completed || 0}
- 用过的工具：${usedTools}

## 你的任务
生成「第一步引导卡」，包含：
1. **任务拆解建议**（3-5步，具体可操作）
2. **工具推荐**（基于学生历史使用过的工具，如果是新手就推荐简单工具）
3. **参考方向**（搜索关键词或开源方案）
4. **开放邀请**（鼓励学生随时求助）

## 语气要求（非常重要）
- 简短、口语、有画面感
- 好奇、温暖、具体
- 不说教，不用专业术语
- 像朋友聊天一样，不要太正式
- 可以用emoji，但不要过度

## 示例格式
你接到了「XXX」的任务，恭喜！🎉

我帮你拆了一下，这个任务大概分3步：
① ...
② ...
③ ...

你用过这几个工具吗？从哪个开始最顺手？

请生成引导消息（200字以内）：`;
        const startTime = Date.now();
        let mentorResponse = '';
        // 调用Claude API
        if (process.env.ANTHROPIC_API_KEY) {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }],
            });
            mentorResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        }
        else {
            // 降级方案：规则引擎
            mentorResponse = `你接到了「${task.title}」的任务，恭喜！🎉

我帮你拆了一下，这个任务大概分3步：
① 先仔细看一遍任务要求，找到关键点
② 准备好需要的工具和素材
③ 按步骤完成，不确定的地方随时问我

${student?.tasks_completed === 0 ? '这是你的第一单，不用紧张，我会一直陪着你。' : ''}

如果卡住了，随时告诉我卡在哪里，我们一起想办法！`;
        }
        const responseTime = Date.now() - startTime;
        // 保存对话记录
        await (0, db_1.query)(`INSERT INTO mentor_conversations (student_id, task_id, trigger_type, mentor_response, response_time_ms)
       VALUES ($1, $2, $3, $4, $5)`, [studentId, taskId, 'task_start', mentorResponse, responseTime]);
        // 30秒后推送通知
        setTimeout(async () => {
            await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`, [
                studentId,
                'mentor_guidance',
                '🐱 AI导师',
                mentorResponse.substring(0, 50) + '...',
                JSON.stringify({ taskId, fullMessage: mentorResponse }),
            ]);
        }, 30000);
        console.log(`[Mentor] Task start guidance sent to student ${studentId} for task ${taskId}`);
    }
    catch (error) {
        console.error('[Mentor] Error sending task start guidance:', error);
    }
}
// ══════════════════════════════════════════════════════════════
// 场景2：学生主动说「我卡住了」
// ══════════════════════════════════════════════════════════════
async function handleStuckMessage(req, res, next) {
    try {
        const studentId = req.user.userId;
        const { taskId, message } = req.body;
        // 检测是否是求助消息
        const stuckKeywords = ['卡住', '不知道', '怎么做', '帮我', '不会', '不懂', '不明白', '搞不定'];
        const isStuck = stuckKeywords.some(kw => message.includes(kw));
        if (!isStuck) {
            // 普通对话
            res.json({ success: true, data: { isStuck: false } });
            return;
        }
        // 记录卡点
        await (0, db_1.query)(`INSERT INTO student_stuck_points (student_id, task_id, stuck_description)
       VALUES ($1, $2, $3)`, [studentId, taskId, message]);
        // 获取任务信息
        const task = await (0, db_1.queryOne)('SELECT title, description FROM tasks WHERE id = $1', [taskId]);
        // 获取最近对话
        const recentConversations = await (0, db_1.query)(`SELECT user_message, mentor_response FROM mentor_conversations
       WHERE student_id = $1 AND task_id = $2
       ORDER BY created_at DESC LIMIT 5`, [studentId, taskId]);
        // 获取历史卡点
        const stuckHistory = await (0, db_1.query)(`SELECT stuck_description, resolved FROM student_stuck_points
       WHERE student_id = $1
       ORDER BY created_at DESC LIMIT 5`, [studentId]);
        // 检查是否连续3次说「还是不会」
        const recentStuckCount = stuckHistory.filter(s => !s.resolved).length;
        const needDetailedGuidance = recentStuckCount >= 3;
        // 构建AI Prompt
        const prompt = `你是启程平台的AI导师"启程小猫"，学生遇到困难向你求助。

## 学生消息
"${message}"

## 任务信息
- 标题：${task?.title}
- 描述：${task?.description}

## 最近对话
${recentConversations.map((c) => `学生：${c.user_message || '（无）'}\n导师：${c.mentor_response}`).join('\n\n')}

## 学生历史卡点
${stuckHistory.map((s) => `- ${s.stuck_description} (${s.resolved ? '已解决' : '未解决'})`).join('\n')}

## 你的任务
${needDetailedGuidance
            ? '学生已经连续3次说不会了，需要升级为「分步演示模式」——把这一步拆成更小的子步骤，每次只给一个子步骤。'
            : '按照三步响应逻辑：\n1. 定位卡点 - 先问「你卡在哪一步了？」\n2. 给出线索，不给答案 - 工具推荐、拆解思路、搜索关键词\n3. 邀请学生试一步 - 「你先试试这一步，做完告诉我结果怎么样」'}

## 语气要求（非常重要）
- 好奇、温暖、具体
- 不说「你做错了」
- 不直接给完整答案
- 像朋友聊天一样
- 必须在30秒内响应

请生成回复（150字以内）：`;
        const startTime = Date.now();
        let mentorResponse = '';
        if (process.env.ANTHROPIC_API_KEY) {
            const aiMessage = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 400,
                messages: [{ role: 'user', content: prompt }],
            });
            mentorResponse = aiMessage.content[0].type === 'text' ? aiMessage.content[0].text : '';
        }
        else {
            // 降级方案
            mentorResponse = `好，我们来看看。你现在做到哪一步了？是完全没有开始，还是已经有了一些想法但不知道怎么继续？

如果你能告诉我具体卡在哪里，我可以给你一些线索。`;
        }
        const responseTime = Date.now() - startTime;
        // 保存对话记录
        await (0, db_1.query)(`INSERT INTO mentor_conversations (student_id, task_id, trigger_type, user_message, mentor_response, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`, [studentId, taskId, 'stuck', message, mentorResponse, responseTime]);
        res.json({
            success: true,
            data: {
                isStuck: true,
                response: mentorResponse,
                responseTime,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
// ══════════════════════════════════════════════════════════════
// 场景3：交付物被AI审核打回
// ══════════════════════════════════════════════════════════════
async function generateRejectionFeedback(submissionId, rejectionReason) {
    try {
        // 获取提交信息
        const submission = await (0, db_1.queryOne)(`SELECT student_id, task_id, submission_note, file_urls
       FROM task_submissions WHERE id = $1`, [submissionId]);
        if (!submission)
            return '';
        // 获取任务信息
        const task = await (0, db_1.queryOne)('SELECT title, description, acceptance_criteria FROM tasks WHERE id = $1', [submission.task_id]);
        // 构建AI Prompt
        const prompt = `你是启程平台的AI导师"启程小猫"，学生的交付物被AI审核打回。

## 任务信息
- 标题：${task?.title}
- 验收标准：${task?.acceptance_criteria || '按要求完成任务'}

## 学生提交
- 提交说明：${submission.submission_note || '（无说明）'}
- 附件数量：${submission.file_urls?.length || 0}个

## 打回原因（AI审核结果）
${rejectionReason}

## 你的任务
生成打回消息，必须包含四部分：
1. **先肯定已完成的部分** - 找到值得肯定的地方（即使很小）
2. **指向具体问题位置** - 精确到具体位置（如「第2张图的文字排版」）
3. **给出方向线索** - 不给完整答案，给方向
4. **邀请对话** - 「如果你不确定怎么改，告诉我你的想法」

## 语气要求（非常重要）
- 不说「你做错了」「这不对」
- 永远描述「哪里可以更好」
- 具体、温暖、有画面感
- 像朋友给建议一样

请生成打回消息（200字以内）：`;
        const startTime = Date.now();
        let mentorResponse = '';
        if (process.env.ANTHROPIC_API_KEY) {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }],
            });
            mentorResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        }
        else {
            // 降级方案
            mentorResponse = `这次的提交整体方向是对的！

有一个地方需要调整：${rejectionReason}

你可以试试重新检查一下这部分，看看有没有更好的处理方式。

如果你不确定怎么改，告诉我你的想法，我们一起看看。`;
        }
        const responseTime = Date.now() - startTime;
        // 保存对话记录
        await (0, db_1.query)(`INSERT INTO mentor_conversations (student_id, task_id, trigger_type, mentor_response, response_time_ms)
       VALUES ($1, $2, $3, $4, $5)`, [submission.student_id, submission.task_id, 'rejected', mentorResponse, responseTime]);
        // 推送通知
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`, [
            submission.student_id,
            'submission_rejected',
            '交付物需要调整',
            mentorResponse.substring(0, 50) + '...',
            JSON.stringify({ taskId: submission.task_id, submissionId, fullMessage: mentorResponse }),
        ]);
        return mentorResponse;
    }
    catch (error) {
        console.error('[Mentor] Error generating rejection feedback:', error);
        return '';
    }
}
// ══════════════════════════════════════════════════════════════
// 场景4：学生长时间无操作（检测到卡点）
// ══════════════════════════════════════════════════════════════
async function checkIdleStudents() {
    try {
        // 查找超过2小时没有操作的学生
        const idleStudents = await (0, db_1.query)(`
      SELECT DISTINCT
        ts.student_id,
        ts.task_id,
        t.title,
        t.deadline,
        ts.updated_at as last_activity
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.status = 'in_progress'
        AND ts.updated_at < NOW() - INTERVAL '2 hours'
        AND NOT EXISTS (
          SELECT 1 FROM mentor_conversations mc
          WHERE mc.student_id = ts.student_id
            AND mc.task_id = ts.task_id
            AND mc.trigger_type = 'idle'
            AND mc.created_at > NOW() - INTERVAL '2 hours'
        )
    `);
        for (const student of idleStudents) {
            // 获取轻推次数
            const nudgeLog = await (0, db_1.queryOne)('SELECT nudge_count FROM mentor_nudge_log WHERE student_id = $1 AND task_id = $2', [student.student_id, student.task_id]);
            const nudgeCount = nudgeLog?.nudge_count || 0;
            let message = '';
            if (nudgeCount === 0) {
                // 第一次轻推
                message = `你好，我注意到你有一段时间没有动了——是卡住了，还是在忙别的？如果卡住了，告诉我在哪里，我们一起看看。`;
            }
            else if (nudgeCount === 1) {
                // 第二次轻推
                const daysLeft = Math.ceil((new Date(student.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                message = `还在吗？这个任务还有${daysLeft}天截止，如果需要帮助随时说。`;
            }
            else {
                // 第三次轻推 - 推测卡点
                message = `我帮你把这个任务拆了一下，你现在可能卡在第一步——先看看任务要求，找到关键点。你可以先试试这一步，做完告诉我。`;
            }
            // 保存对话记录
            await (0, db_1.query)(`INSERT INTO mentor_conversations (student_id, task_id, trigger_type, mentor_response)
         VALUES ($1, $2, $3, $4)`, [student.student_id, student.task_id, 'idle', message]);
            // 更新轻推记录
            await (0, db_1.query)(`INSERT INTO mentor_nudge_log (student_id, task_id, nudge_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (student_id, task_id)
         DO UPDATE SET nudge_count = mentor_nudge_log.nudge_count + 1, last_nudge_at = NOW()`, [student.student_id, student.task_id]);
            // 推送通知
            await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, body)
         VALUES ($1, $2, $3, $4)`, [student.student_id, 'mentor_nudge', '🐱 AI导师', message]);
            console.log(`[Mentor] Nudge sent to student ${student.student_id} for task ${student.task_id}`);
        }
    }
    catch (error) {
        console.error('[Mentor] Error checking idle students:', error);
    }
}
// ══════════════════════════════════════════════════════════════
// 场景5：学生完成里程碑 · 见证与夸奖
// ══════════════════════════════════════════════════════════════
async function celebrateMilestone(studentId, milestoneType, milestoneData) {
    try {
        // 获取学生信息
        const student = await (0, db_1.queryOne)('SELECT opc_label, level, tasks_completed FROM student_capabilities WHERE student_id = $1', [studentId]);
        // 获取历史里程碑
        const milestoneHistory = await (0, db_1.query)(`SELECT milestone_type, mentor_message FROM student_milestones
       WHERE student_id = $1
       ORDER BY created_at DESC LIMIT 5`, [studentId]);
        // 构建AI Prompt
        const prompt = `你是启程平台的AI导师"启程小猫"，学生刚刚达成了一个成长里程碑。

## 里程碑类型
${milestoneType}

## 里程碑数据
${JSON.stringify(milestoneData, null, 2)}

## 学生信息
- OPC标签：${student?.opc_label}
- 等级：Lv.${student?.level}
- 完成任务数：${student?.tasks_completed}

## 历史里程碑
${milestoneHistory.map((m) => `- ${m.milestone_type}: ${m.mentor_message}`).join('\n')}

## 你的任务
生成具体的夸奖消息，必须：
- **有对比** - 「上次你在[X]这里卡了很久，这次你直接就处理好了」
- **有细节** - 「你在[具体位置]的处理方式很聪明」
- **有展望** - 「按这个速度，你下一单可以试试[更难的任务类型]了」

## 禁止用语
- 「你很棒！」
- 「继续加油！」
- 「你做得很好！」

## 语气要求
- 具体、真实、有细节
- 像朋友真心夸奖一样
- 让学生感受到「被看见」

请生成见证消息（100字以内）：`;
        const startTime = Date.now();
        let mentorResponse = '';
        if (process.env.ANTHROPIC_API_KEY) {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }],
            });
            mentorResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        }
        else {
            // 降级方案
            if (milestoneType === 'first_task') {
                mentorResponse = `你刚刚完成了第一单，这是最难的一步！很多人在这里就放弃了，但你坚持下来了。下一单会更顺手的。`;
            }
            else if (milestoneType === 'level_up') {
                mentorResponse = `你升到Lv.${student?.level}了！这意味着你现在可以接更有挑战的任务了。`;
            }
            else {
                mentorResponse = `恭喜你达成新的里程碑！继续保持这个节奏。`;
            }
        }
        const responseTime = Date.now() - startTime;
        // 保存里程碑记录
        await (0, db_1.query)(`INSERT INTO student_milestones (student_id, milestone_type, milestone_data, mentor_message)
       VALUES ($1, $2, $3, $4)`, [studentId, milestoneType, JSON.stringify(milestoneData), mentorResponse]);
        // 保存对话记录
        await (0, db_1.query)(`INSERT INTO mentor_conversations (student_id, trigger_type, mentor_response, response_time_ms)
       VALUES ($1, $2, $3, $4)`, [studentId, 'milestone', mentorResponse, responseTime]);
        // 推送通知
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, body)
       VALUES ($1, $2, $3, $4)`, [studentId, 'milestone', '🎉 成长里程碑', mentorResponse]);
        console.log(`[Mentor] Milestone celebrated for student ${studentId}: ${milestoneType}`);
    }
    catch (error) {
        console.error('[Mentor] Error celebrating milestone:', error);
    }
}
// ══════════════════════════════════════════════════════════════
// 获取对话历史
// ══════════════════════════════════════════════════════════════
async function getConversations(req, res, next) {
    try {
        const studentId = req.user.userId;
        const { taskId } = req.params;
        const conversations = await (0, db_1.query)(`SELECT id, trigger_type, user_message, mentor_response, created_at
       FROM mentor_conversations
       WHERE student_id = $1 AND (task_id = $2 OR task_id IS NULL)
       ORDER BY created_at ASC`, [studentId, taskId]);
        res.json({ success: true, data: conversations });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=controller.js.map