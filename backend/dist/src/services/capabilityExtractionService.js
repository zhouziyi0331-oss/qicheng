"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityExtractionService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class CapabilityExtractionService {
    /**
     * 从任务完成中提取学生的能力标签
     */
    static async extractFromTaskCompletion(studentId, taskId, taskInfo, deliverableInfo) {
        const client = await db_1.pool.connect();
        try {
            logger_1.default.info(`[CapabilityExtraction] 从任务 ${taskId} 提取学生 ${studentId} 的能力标签`);
            // 1. 从任务描述中提取标签
            const extracted = await this.extractFromText(client, taskInfo.title + ' ' + taskInfo.description + ' ' + (taskInfo.requirements || ''));
            // 2. 记录工具使用
            for (const tool of extracted.tools) {
                await this.recordToolUsage(client, studentId, taskId, tool);
            }
            // 3. 记录案例经验
            for (const caseType of extracted.caseTypes) {
                await this.recordCaseExperience(client, studentId, taskId, caseType, deliverableInfo?.quality);
            }
            // 4. 记录领域理解
            for (const domain of extracted.domainKnowledge) {
                await this.recordDomainUnderstanding(client, studentId, taskId, domain);
            }
            logger_1.default.info(`[CapabilityExtraction] 提取完成: 工具${extracted.tools.length}个, 案例${extracted.caseTypes.length}个, 领域${extracted.domainKnowledge.length}个`);
        }
        catch (error) {
            logger_1.default.error('[CapabilityExtraction] 提取失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 从文本中提取标签（基于规则）
     */
    static async extractFromText(client, text) {
        const lowerText = text.toLowerCase();
        // 获取所有提取规则
        const rulesResult = await client.query(`
      SELECT rule_type, trigger_keywords, extracted_value, confidence
      FROM tag_extraction_rules
      WHERE is_active = true
    `);
        const tools = new Set();
        const caseTypes = new Set();
        const domainKnowledge = new Set();
        const scenarios = new Set();
        for (const rule of rulesResult.rows) {
            // 检查是否匹配关键词
            const keywords = rule.trigger_keywords || [];
            const matched = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
            if (matched) {
                const value = rule.extracted_value;
                switch (rule.rule_type) {
                    case 'tool_detection':
                        tools.add(value);
                        break;
                    case 'case_extraction':
                        caseTypes.add(value);
                        break;
                    case 'domain_inference':
                        domainKnowledge.add(value);
                        break;
                }
            }
        }
        return {
            tools: Array.from(tools),
            caseTypes: Array.from(caseTypes),
            domainKnowledge: Array.from(domainKnowledge),
            scenarios: Array.from(scenarios)
        };
    }
    /**
     * 记录工具使用
     */
    static async recordToolUsage(client, studentId, taskId, toolName) {
        // 检查是否已存在
        const existingResult = await client.query('SELECT id, usage_count, proficiency_level, verified_by_tasks FROM student_tool_usage WHERE student_id = $1 AND tool_name = $2', [studentId, toolName]);
        if (existingResult.rows.length > 0) {
            // 更新
            const existing = existingResult.rows[0];
            const newUsageCount = existing.usage_count + 1;
            const verifiedByTasks = existing.verified_by_tasks || [];
            if (!verifiedByTasks.includes(taskId)) {
                verifiedByTasks.push(taskId);
            }
            // 根据使用次数升级熟练度
            let newProficiency = existing.proficiency_level;
            if (newUsageCount >= 10)
                newProficiency = 'expert';
            else if (newUsageCount >= 5)
                newProficiency = 'advanced';
            else if (newUsageCount >= 3)
                newProficiency = 'intermediate';
            await client.query(`UPDATE student_tool_usage 
         SET usage_count = $1, 
             proficiency_level = $2,
             verified_by_tasks = $3,
             last_used_at = NOW()
         WHERE id = $4`, [newUsageCount, newProficiency, verifiedByTasks, existing.id]);
            logger_1.default.info(`[CapabilityExtraction] 更新工具: ${toolName} → ${newProficiency} (${newUsageCount}次)`);
        }
        else {
            // 新增
            await client.query(`INSERT INTO student_tool_usage 
         (student_id, tool_name, usage_count, proficiency_level, verified_by_tasks)
         VALUES ($1, $2, 1, 'basic', $3)`, [studentId, toolName, [taskId]]);
            logger_1.default.info(`[CapabilityExtraction] 新增工具: ${toolName} (basic)`);
        }
    }
    /**
     * 记录案例经验
     */
    static async recordCaseExperience(client, studentId, taskId, caseType, quality) {
        // 解析案例类型，提取category和subcategory
        const parts = caseType.split('_');
        const category = parts[0] || 'general';
        const subcategory = parts.slice(0, 2).join('_');
        // 检查是否已存在
        const existingResult = await client.query('SELECT id, experience_count, quality_avg, task_ids FROM student_case_experience WHERE student_id = $1 AND case_type = $2', [studentId, caseType]);
        if (existingResult.rows.length > 0) {
            // 更新
            const existing = existingResult.rows[0];
            const newExperienceCount = existing.experience_count + 1;
            const taskIds = existing.task_ids || [];
            if (!taskIds.includes(taskId)) {
                taskIds.push(taskId);
            }
            // 更新平均质量
            let newQualityAvg = existing.quality_avg;
            if (quality !== undefined) {
                if (newQualityAvg) {
                    newQualityAvg = (newQualityAvg * existing.experience_count + quality) / newExperienceCount;
                }
                else {
                    newQualityAvg = quality;
                }
            }
            await client.query(`UPDATE student_case_experience 
         SET experience_count = $1,
             quality_avg = $2,
             task_ids = $3,
             last_done_at = NOW()
         WHERE id = $4`, [newExperienceCount, newQualityAvg, taskIds, existing.id]);
            logger_1.default.info(`[CapabilityExtraction] 更新案例: ${caseType} → ${newExperienceCount}次`);
        }
        else {
            // 新增
            await client.query(`INSERT INTO student_case_experience 
         (student_id, case_category, case_subcategory, case_type, experience_count, quality_avg, task_ids)
         VALUES ($1, $2, $3, $4, 1, $5, $6)`, [studentId, category, subcategory, caseType, quality, [taskId]]);
            logger_1.default.info(`[CapabilityExtraction] 新增案例: ${caseType}`);
        }
    }
    /**
     * 记录领域理解
     */
    static async recordDomainUnderstanding(client, studentId, taskId, domainAspect) {
        // 解析领域
        const parts = domainAspect.split('_');
        const domain = parts[0] || 'general';
        // 检查是否已存在
        const existingResult = await client.query('SELECT id, understanding_level, confidence, demonstrated_in_tasks FROM student_domain_understanding WHERE student_id = $1 AND domain_aspect = $2', [studentId, domainAspect]);
        if (existingResult.rows.length > 0) {
            // 更新
            const existing = existingResult.rows[0];
            const demonstratedInTasks = existing.demonstrated_in_tasks || [];
            if (!demonstratedInTasks.includes(taskId)) {
                demonstratedInTasks.push(taskId);
            }
            // 根据体现次数提升理解深度
            const demonstratedCount = demonstratedInTasks.length;
            let newLevel = existing.understanding_level;
            let newConfidence = parseFloat(existing.confidence);
            if (demonstratedCount >= 10) {
                newLevel = 'expert';
                newConfidence = Math.min(newConfidence + 0.03, 0.95);
            }
            else if (demonstratedCount >= 5) {
                newLevel = 'advanced';
                newConfidence = Math.min(newConfidence + 0.05, 0.9);
            }
            else if (demonstratedCount >= 3) {
                newLevel = 'intermediate';
                newConfidence = Math.min(newConfidence + 0.05, 0.85);
            }
            else {
                newConfidence = Math.min(newConfidence + 0.05, 0.8);
            }
            await client.query(`UPDATE student_domain_understanding 
         SET understanding_level = $1,
             confidence = $2,
             demonstrated_in_tasks = $3,
             last_demonstrated_at = NOW()
         WHERE id = $4`, [newLevel, newConfidence, demonstratedInTasks, existing.id]);
            logger_1.default.info(`[CapabilityExtraction] 更新领域理解: ${domainAspect} → ${newLevel}`);
        }
        else {
            // 新增
            await client.query(`INSERT INTO student_domain_understanding 
         (student_id, domain, domain_aspect, understanding_level, confidence, demonstrated_in_tasks)
         VALUES ($1, $2, $3, 'basic', 0.6, $4)`, [studentId, domain, domainAspect, [taskId]]);
            logger_1.default.info(`[CapabilityExtraction] 新增领域理解: ${domainAspect} (basic)`);
        }
    }
    /**
     * 获取学生的完整能力画像
     */
    static async getStudentCapabilityProfile(studentId) {
        const client = await db_1.pool.connect();
        try {
            // 工具使用情况
            const toolsResult = await client.query(`SELECT tool_name, proficiency_level, usage_count, last_used_at
         FROM student_tool_usage
         WHERE student_id = $1
         ORDER BY usage_count DESC, last_used_at DESC`, [studentId]);
            // 案例经验
            const casesResult = await client.query(`SELECT case_type, experience_count, quality_avg, last_done_at
         FROM student_case_experience
         WHERE student_id = $1
         ORDER BY experience_count DESC, last_done_at DESC`, [studentId]);
            // 领域理解
            const domainsResult = await client.query(`SELECT domain, domain_aspect, understanding_level, confidence, last_demonstrated_at
         FROM student_domain_understanding
         WHERE student_id = $1
         ORDER BY confidence DESC, last_demonstrated_at DESC`, [studentId]);
            return {
                tools: toolsResult.rows,
                caseExperience: casesResult.rows,
                domainUnderstanding: domainsResult.rows
            };
        }
        finally {
            client.release();
        }
    }
}
exports.CapabilityExtractionService = CapabilityExtractionService;
//# sourceMappingURL=capabilityExtractionService.js.map