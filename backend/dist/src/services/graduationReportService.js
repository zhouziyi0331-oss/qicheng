"use strict";
/**
 * Lv.6毕业报告生成服务
 * 模块三：Lv.6毕业万字报告（付费解锁）
 *
 * 功能：
 * 1. 学生达到Lv.6后自动触发报告生成
 * 2. 调用DeepSeek-V3生成六章完整报告（约10000字）
 * 3. 支持预览（第一章前300字 + 完整目录）
 * 4. 付费解锁完整报告（¥299）
 * 5. 支持PDF下载
 * 6. 报告可持续更新（每完成3个新项目）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const database_1 = require("../config/database");
class GraduationReportService {
    constructor() {
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
    }
    /**
     * 生成毕业报告（学生达到Lv.6时触发）
     */
    async generateGraduationReport(userId) {
        logger.info(`[毕业报告] 开始为学生 ${userId} 生成毕业报告`);
        // 1. 检查学生是否达到Lv.6
        const userLevel = await this.checkUserLevel(userId);
        if (userLevel < 6) {
            throw new Error(`学生尚未达到Lv.6，当前等级: Lv.${userLevel}`);
        }
        // 2. 检查是否已有报告
        const existingReport = await this.getExistingReport(userId);
        if (existingReport) {
            logger.info(`[毕业报告] 学生已有报告，报告ID: ${existingReport.id}`);
            return existingReport.id;
        }
        // 3. 收集学生所有数据
        const studentData = await this.collectStudentData(userId);
        // 4. 生成六章报告
        const report = await this.generateFullReport(studentData);
        // 5. 保存报告
        const reportId = await this.saveReport(userId, report);
        logger.info(`[毕业报告] 报告生成完成，报告ID: ${reportId}`);
        return reportId;
    }
    /**
     * 检查用户等级
     */
    async checkUserLevel(userId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT current_level FROM users WHERE id = $1`, [userId]);
            if (result.rows.length === 0) {
                throw new Error(`用户 ${userId} 不存在`);
            }
            return result.rows[0].current_level;
        }
        finally {
            client.release();
        }
    }
    /**
     * 检查是否已有报告
     */
    async getExistingReport(userId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT id, is_paid, created_at
         FROM growth_reports
         WHERE user_id = $1 AND report_type = 'graduation'
         LIMIT 1`, [userId]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 收集学生所有数据
     */
    async collectStudentData(userId) {
        const client = await database_1.pool.connect();
        try {
            // 1. 用户基本信息
            const userResult = await client.query(`SELECT id, username, current_level, created_at
         FROM users WHERE id = $1`, [userId]);
            const user = userResult.rows[0];
            // 2. 订单统计
            const orderStatsResult = await client.query(`SELECT
           COUNT(*) as total_orders,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
           COALESCE(SUM(CASE WHEN status = 'completed' THEN student_price END), 0) as total_earnings,
           COALESCE(AVG(CASE WHEN status = 'completed' THEN client_rating END), 0) as avg_rating
         FROM orders
         WHERE student_id = $1`, [userId]);
            const orderStats = orderStatsResult.rows[0];
            // 3. 所有订单详情
            const ordersResult = await client.query(`SELECT * FROM orders
         WHERE student_id = $1 AND status = 'completed'
         ORDER BY completed_at ASC`, [userId]);
            const orders = ordersResult.rows;
            // 4. 能力画像版本历史
            const profileVersionsResult = await client.query(`SELECT * FROM user_ability_profiles
         WHERE user_id = $1
         ORDER BY version ASC`, [userId]);
            const profileVersions = profileVersionsResult.rows;
            // 5. 初始画像和当前画像
            const initialProfile = profileVersions.find((p) => p.version === 1);
            const currentProfile = profileVersions.find((p) => p.is_current);
            // 6. 导师对话记录
            const mentorSessionsResult = await client.query(`SELECT * FROM mentor_sessions
         WHERE student_id = $1
         ORDER BY created_at ASC`, [userId]);
            const mentorSessions = mentorSessionsResult.rows;
            // 7. 成长观察记录
            const growthObservationsResult = await client.query(`SELECT * FROM mentor_growth_observations
         WHERE student_id = $1
         ORDER BY created_at ASC`, [userId]);
            const growthObservations = growthObservationsResult.rows;
            // 8. 组队记录
            const teamsResult = await client.query(`SELECT t.*, tm.role
         FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1`, [userId]);
            const teams = teamsResult.rows;
            // 9. 等级变化历史
            const levelHistoryResult = await client.query(`SELECT * FROM ability_dimension_history
         WHERE user_id = $1
         ORDER BY created_at ASC`, [userId]);
            const levelHistory = levelHistoryResult.rows;
            return {
                userId,
                username: user.username,
                currentLevel: user.current_level,
                joinedAt: user.created_at,
                totalOrders: parseInt(orderStats.total_orders),
                completedOrders: parseInt(orderStats.completed_orders),
                totalEarnings: parseFloat(orderStats.total_earnings),
                avgRating: parseFloat(orderStats.avg_rating),
                profileVersions,
                initialProfile,
                currentProfile,
                mentorSessions,
                growthObservations,
                teams,
                levelHistory,
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 生成完整的六章报告
     */
    async generateFullReport(studentData) {
        logger.info(`[毕业报告] 开始生成六章报告`);
        const chapters = [];
        // 生成六章
        for (let i = 1; i <= 6; i++) {
            logger.info(`[毕业报告] 生成第 ${i} 章...`);
            const chapter = await this.generateChapter(i, studentData);
            chapters.push(chapter);
        }
        // 计算总字数
        const totalWordCount = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
        // 生成预览内容（第一章前300字）
        const previewContent = chapters[0].content.substring(0, 300) + '...';
        // 生成目录
        const tableOfContents = chapters.map((ch) => `第${ch.chapter_number}章：${ch.chapter_title}`);
        logger.info(`[毕业报告] 六章报告生成完成，总字数: ${totalWordCount}`);
        return {
            chapters,
            total_word_count: totalWordCount,
            generated_at: new Date(),
            preview_content: previewContent,
            table_of_contents: tableOfContents,
        };
    }
    /**
     * 生成单个章节（严格按照技术规格）
     */
    async generateChapter(chapterNumber, studentData, retryCount = 0) {
        const chapterConfig = this.getChapterConfig(chapterNumber);
        const systemPrompt = this.buildChapterSystemPrompt(chapterNumber);
        const userPrompt = this.buildChapterUserPrompt(chapterNumber, studentData);
        logger.info(`[毕业报告] 生成第${chapterNumber}章，目标字数: ${chapterConfig.targetWords}字`);
        // 【关键】根据目标字数设置maxTokens（中文约1字=1.5tokens）
        const maxTokens = Math.ceil(chapterConfig.targetWords * 1.5);
        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: maxTokens,
            temperature: chapterConfig.temperature,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('AI返回的内容类型不正确');
        }
        const chapterContent = content.text;
        const wordCount = chapterContent.length;
        logger.info(`[毕业报告] 第${chapterNumber}章实际字数: ${wordCount}字`);
        // 【关键】字数验证
        if (wordCount < chapterConfig.minWords && retryCount === 0) {
            logger.warn(`[毕业报告] 第${chapterNumber}章字数不足(${wordCount}/${chapterConfig.minWords})，重试生成...`);
            // 重试时增加maxTokens
            return this.generateChapter(chapterNumber, studentData, 1);
        }
        // 重试后仍不足，记录错误
        if (wordCount < chapterConfig.minWords) {
            logger.error(`[毕业报告] 第${chapterNumber}章重试后字数仍不足: ${wordCount}/${chapterConfig.minWords}字`);
        }
        return {
            chapter_number: chapterNumber,
            chapter_title: chapterConfig.title,
            content: chapterContent,
            word_count: wordCount,
        };
    }
    /**
     * 获取章节配置（包含最低字数要求）
     */
    getChapterConfig(chapterNumber) {
        const configs = {
            1: {
                title: '你的成长轨迹',
                targetWords: 1800,
                minWords: 1500,
                temperature: 0.7
            },
            2: {
                title: '你的核心优势体系',
                targetWords: 2200,
                minWords: 2000,
                temperature: 0.5
            },
            3: {
                title: '你的OPC定位与市场机会',
                targetWords: 2500,
                minWords: 2000,
                temperature: 0.7
            },
            4: {
                title: '你的客户获取地图',
                targetWords: 2000,
                minWords: 1500,
                temperature: 0.7
            },
            5: {
                title: '你的独立接单工具箱',
                targetWords: 1500,
                minWords: 1000,
                temperature: 0.5
            },
            6: {
                title: '下一步——从OPC到联合体',
                targetWords: 1200,
                minWords: 1000,
                temperature: 0.7
            },
        };
        return configs[chapterNumber];
    }
    /**
     * 构建章节的System Prompt（严格按照技术规格）
     */
    buildChapterSystemPrompt(chapterNumber) {
        const basePrompt = `你是启程平台的AI成长导师，正在为达到Lv.6的学生撰写毕业报告。

这是一份付费报告（¥299），学生期待看到：
1. 基于真实数据的深度分析
2. 具体的成长轨迹和突破点
3. 可操作的未来建议
4. 专业但温暖的语气

【硬性要求】
- 必须引用学生的真实项目名称、真实数据
- 禁止使用"你做得很好""继续加油"等空话
- 必须达到最低字数要求
- 每个建议都必须具体可操作`;
        const chapterPrompts = {
            1: `${basePrompt}

你正在撰写第一章：你的成长轨迹（最低1500字）

【必须包含的内容】
1. 按时间线列出学生完成的所有项目（必须包含真实项目名称）
2. 六维数据从初始版本到当前版本的变化趋势
3. 关键转折点：跳级、首次组队、首次打回后独立解决（如有）
4. 完成的所有项目概览：总订单数、总收入、平均评分

【数据来源】
- orders表：所有已完成订单的项目名称、完成时间、收入、评分
- user_ability_profiles：所有版本的六维数据
- level_configs：等级变化记录
- jump_test_records：跳级记录（如有）

【写作风格】
叙事性强，有画面感，让学生回顾自己的成长历程。

【输出要求】
直接输出章节正文，不要包含章节标题。`,
            2: `${basePrompt}

你正在撰写第二章：你的核心优势体系（最低2000字）

【必须包含的内容】
1. 六大维度逐一解读（当前分数、成长历程、优势证据）
2. 人格标签深度解析（为什么是这个标签、这意味着什么）
3. 三大核心优势（从导师观察中提取出现频率最高的技能）
4. 独特工作风格描述（从38题测试+行为数据综合推断）

【数据来源】
- user_ability_profiles：当前六维分数和历史变化
- mentor_growth_observations：所有导师观察中的技能标签，统计出现频率
- personality_label：人格标签及历史变化

【写作风格】
分析性强，有数据支撑，帮助学生认识自己的优势。

【输出要求】
直接输出章节正文，不要包含章节标题。`,
            3: `${basePrompt}

你正在撰写第三章：你的OPC定位与市场机会（最低2000字）

【必须包含的内容】
1. 基于技能体系，推荐3个OPC定位方向（必须具体，不能是"内容创作者"这种泛泛的）
2. 每个定位方向的：市场需求分析、目标客户画像、竞争差异化
3. 学生的独特卖点（从优势体系中提炼）
4. 定价参考（基于已完成项目的收入数据）

【数据来源】
- orders：项目类型分布、平均收入
- skills_observed：学生的技能标签
- 市场通用数据：行业需求趋势

【写作风格】
实用性强，有市场洞察，帮助学生找到商业机会。

【输出要求】
直接输出章节正文，不要包含章节标题。`,
            4: `${basePrompt}

你正在撰写第四章：你的客户获取地图（最低1500字）

【必须包含的内容】
1. 目标客户画像（行业、规模、典型需求）
2. 客户出现的渠道（线上+线下，必须具体）
   - 线上：小红书搜索哪些关键词、哪些行业社群、哪些招聘平台
   - 线下：哪些行业展会、哪些创业咖啡馆、哪些行业协会
3. 接触策略（如何介绍自己、展示什么案例）
4. 话术模板（一句介绍自己、一个案例描述、一个报价逻辑）

【数据来源】
- 学生的赛道和技能方向
- 已完成项目的客户类型
- 行业通用渠道

【写作风格】
操作性强，有具体方法，帮助学生获取客户。

【输出要求】
直接输出章节正文，不要包含章节标题。必须给出具体的渠道名称和话术示例。`,
            5: `${basePrompt}

你正在撰写第五章：你的独立接单工具箱（最低1000字）

【必须包含的内容】
1. 工具栈推荐（基于使用频率最高的工具，必须列出具体工具名称）
2. 交付物模板（从已完成项目中提取最佳作品）
3. 工作流程SOP（接单→拆解→执行→交付）
4. 定价与合同模板（从历史订单中总结收入区间）

【数据来源】
- mentor_growth_observations：工具使用记录
- orders：已完成项目的交付物
- 任务执行数据：工作流程

【写作风格】
工具性强，有模板和清单，帮助学生标准化工作。

【输出要求】
直接输出章节正文，不要包含章节标题。必须列出具体的工具名称和SOP步骤。`,
            6: `${basePrompt}

你正在撰写第六章：下一步——从OPC到联合体（最低1000字）

【必须包含的内容】
1. 学生在启程的生态位（基于技能和组队历史）
2. 推荐合作的OPC类型（互补技能的学生）
3. 如何发起一个共创项目
4. 启程平台的持续支持

【数据来源】
- teams/team_members：组队记录（如有）
- 学生的技能标签：推荐互补的合作伙伴
- 平台资源：知识中台、需求中台

【写作风格】
展望性强，有愿景，帮助学生看到更大的可能性。

【输出要求】
直接输出章节正文，不要包含章节标题。如果学生有组队经历，必须引用；如果没有，推荐具体的互补技能类型。`,
        };
        return chapterPrompts[chapterNumber] || basePrompt;
    }
    /**
     * 构建章节的User Prompt
     */
    buildChapterUserPrompt(chapterNumber, studentData) {
        let prompt = `# 学生数据\n\n`;
        prompt += `## 基本信息\n`;
        prompt += `- 用户名：${studentData.username}\n`;
        prompt += `- 当前等级：Lv.${studentData.currentLevel}\n`;
        prompt += `- 入驻时间：${studentData.joinedAt}\n`;
        prompt += `- 完成订单数：${studentData.completedOrders}\n`;
        prompt += `- 总收入：¥${studentData.totalEarnings.toFixed(2)}\n`;
        prompt += `- 平均评分：${studentData.avgRating.toFixed(1)}/5\n\n`;
        // 根据章节添加特定数据
        if (chapterNumber === 1) {
            // 第一章：成长轨迹
            prompt += `## 能力画像版本历史\n`;
            studentData.profileVersions.forEach((profile) => {
                prompt += `\n### 版本 ${profile.version}\n`;
                prompt += `- 更新原因：${profile.updated_reason || '初始版本'}\n`;
                prompt += `- 信息处理：${profile.information_processing}\n`;
                prompt += `- 创作驱动：${profile.creative_drive}\n`;
                prompt += `- 工具学习：${profile.tool_learning}\n`;
                prompt += `- 任务执行：${profile.task_execution}\n`;
                prompt += `- 协作倾向：${profile.collaboration_tendency}\n`;
                prompt += `- 风险态度：${profile.risk_attitude}\n`;
            });
        }
        else if (chapterNumber === 2) {
            // 第二章：核心优势
            prompt += `## 当前能力画像\n`;
            if (studentData.currentProfile) {
                const cp = studentData.currentProfile;
                prompt += `- 信息处理：${cp.information_processing}\n`;
                prompt += `- 创作驱动：${cp.creative_drive}\n`;
                prompt += `- 工具学习：${cp.tool_learning}\n`;
                prompt += `- 任务执行：${cp.task_execution}\n`;
                prompt += `- 协作倾向：${cp.collaboration_tendency}\n`;
                prompt += `- 风险态度：${cp.risk_attitude}\n`;
                prompt += `- 人格标签：${cp.personality_label}\n`;
            }
            prompt += `\n## 导师成长观察（技能统计）\n`;
            const skillsMap = new Map();
            studentData.growthObservations.forEach((obs) => {
                if (obs.skills_observed && obs.skills_observed.skills) {
                    obs.skills_observed.skills.forEach((skill) => {
                        skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
                    });
                }
            });
            const topSkills = Array.from(skillsMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            topSkills.forEach(([skill, count]) => {
                prompt += `- ${skill}：出现 ${count} 次\n`;
            });
        }
        else if (chapterNumber === 3 || chapterNumber === 4) {
            // 第三章和第四章：市场定位和客户获取
            prompt += `## 项目类型统计\n`;
            const projectTypes = new Map();
            // 这里需要从订单数据中统计项目类型
            prompt += `（基于学生完成的项目类型进行分析）\n`;
        }
        else if (chapterNumber === 5) {
            // 第五章：工具箱
            prompt += `## 工具使用统计\n`;
            prompt += `（基于导师观察中的工具使用记录）\n`;
        }
        else if (chapterNumber === 6) {
            // 第六章：联合体
            if (studentData.teams.length > 0) {
                prompt += `## 组队经历\n`;
                studentData.teams.forEach((team) => {
                    prompt += `- 队伍：${team.name}，角色：${team.role}\n`;
                });
            }
        }
        prompt += `\n---\n请撰写第${chapterNumber}章的内容。`;
        return prompt;
    }
    /**
     * 保存报告到数据库
     */
    async saveReport(userId, report) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`INSERT INTO growth_reports
         (user_id, report_type, is_paid, preview_content, full_content_json, payment_amount)
         VALUES ($1, 'graduation', false, $2, $3, 299.00)
         RETURNING id`, [userId, report.preview_content, JSON.stringify(report)]);
            return result.rows[0].id;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取报告预览
     */
    async getReportPreview(userId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT id, preview_content, created_at, is_paid
         FROM growth_reports
         WHERE user_id = $1 AND report_type = 'graduation'
         LIMIT 1`, [userId]);
            if (result.rows.length === 0) {
                return null;
            }
            const report = result.rows[0];
            // 获取目录
            const fullReport = await this.getFullReport(report.id);
            const tableOfContents = fullReport
                ? fullReport.table_of_contents
                : [];
            return {
                id: report.id,
                preview_content: report.preview_content,
                table_of_contents: tableOfContents,
                is_paid: report.is_paid,
                created_at: report.created_at,
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取完整报告（需要已付费）
     */
    async getFullReport(reportId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT full_content_json, is_paid
         FROM growth_reports
         WHERE id = $1`, [reportId]);
            if (result.rows.length === 0) {
                return null;
            }
            const report = result.rows[0];
            if (!report.is_paid) {
                throw new Error('报告尚未付费解锁');
            }
            return report.full_content_json;
        }
        finally {
            client.release();
        }
    }
    /**
     * 处理报告付费
     */
    async processPayment(reportId, userId, paymentMethod, transactionId, pointsUsed = 0) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. 创建付费记录
            const amount = 299.00 - (pointsUsed * 0.01); // 假设100积分=1元
            await client.query(`INSERT INTO graduation_report_payments
         (user_id, report_id, amount, payment_method, transaction_id, points_used, points_value, status, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())`, [userId, reportId, amount, paymentMethod, transactionId, pointsUsed, pointsUsed * 0.01]);
            // 2. 更新报告状态
            await client.query(`UPDATE growth_reports
         SET is_paid = true, paid_at = NOW(), payment_amount = $1
         WHERE id = $2`, [amount, reportId]);
            await client.query('COMMIT');
            logger.info(`[毕业报告] 付费成功，报告ID: ${reportId}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 检查是否需要更新报告（每完成3个新项目）
     */
    async checkNeedUpdate(userId) {
        const client = await database_1.pool.connect();
        try {
            // 获取报告生成时间
            const reportResult = await client.query(`SELECT created_at, update_count
         FROM growth_reports
         WHERE user_id = $1 AND report_type = 'graduation'
         LIMIT 1`, [userId]);
            if (reportResult.rows.length === 0) {
                return false;
            }
            const report = reportResult.rows[0];
            // 统计报告生成后完成的订单数
            const orderResult = await client.query(`SELECT COUNT(*) as new_orders
         FROM orders
         WHERE student_id = $1 AND status = 'completed' AND completed_at > $2`, [userId, report.created_at]);
            const newOrders = parseInt(orderResult.rows[0].new_orders);
            // 每完成3个新项目可以更新一次
            return newOrders >= 3;
        }
        finally {
            client.release();
        }
    }
    /**
     * 更新报告（重新生成）
     */
    async updateReport(reportId, userId) {
        logger.info(`[毕业报告] 开始更新报告 ${reportId}`);
        // 1. 收集最新数据
        const studentData = await this.collectStudentData(userId);
        // 2. 重新生成报告
        const report = await this.generateFullReport(studentData);
        // 3. 更新数据库
        const client = await database_1.pool.connect();
        try {
            await client.query(`UPDATE growth_reports
         SET full_content_json = $1,
             preview_content = $2,
             update_count = update_count + 1,
             updated_at = NOW()
         WHERE id = $3`, [JSON.stringify(report), report.preview_content, reportId]);
            logger.info(`[毕业报告] 报告更新完成`);
        }
        finally {
            client.release();
        }
    }
}
exports.default = new GraduationReportService();
//# sourceMappingURL=graduationReportService.js.map