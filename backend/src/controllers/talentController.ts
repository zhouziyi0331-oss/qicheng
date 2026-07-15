import { Request, Response } from 'express';
import { TalentTagInferenceService } from '../services/talentTagInferenceService';
import { TalentMatchingService } from '../services/talentMatchingService';
import { CapabilityExtractionService } from '../services/capabilityExtractionService';
import { RequirementBreakdownService } from '../services/requirementBreakdownService';
import { pool } from '../config/database';

export class TalentController {
  // 获取学生天赋画像
  static async getStudentTalentProfile(req: Request, res: Response) {
    try {
      const studentId = req.params.studentId || (req as any).user?.id;

      if (!studentId) {
        return res.status(400).json({ success: false, message: '缺少学生ID' });
      }

      // 获取天赋标签
      const talentResult = await pool.query(
        `SELECT st.*, tt.tag_name, tt.category, tt.description, tt.manifestation
         FROM student_talent_tags st
         JOIN talent_tags tt ON st.tag_id = tt.id
         WHERE st.student_id = $1 AND st.is_active = true
         ORDER BY st.strength_level DESC, st.confidence DESC`,
        [studentId]
      );

      // 获取工具使用情况
      const toolsResult = await pool.query(
        `SELECT tool_name, proficiency_level, usage_count, capabilities, last_used_at
         FROM student_tool_usage
         WHERE student_id = $1
         ORDER BY usage_count DESC, last_used_at DESC
         LIMIT 20`,
        [studentId]
      );

      // 获取案例经验
      const casesResult = await pool.query(
        `SELECT case_type, experience_count, recent_cases, last_experienced_at
         FROM student_case_experience
         WHERE student_id = $1
         ORDER BY experience_count DESC
         LIMIT 20`,
        [studentId]
      );

      // 获取领域理解
      const domainsResult = await pool.query(
        `SELECT domain_name, understanding_level, depth_score, acquired_from_tasks
         FROM student_domain_understanding
         WHERE student_id = $1
         ORDER BY depth_score DESC`,
        [studentId]
      );

      res.json({
        success: true,
        data: {
          talents: talentResult.rows,
          tools: toolsResult.rows,
          cases: casesResult.rows,
          domains: domainsResult.rows
        }
      });
    } catch (error) {
      console.error('获取学生天赋画像失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 获取所有天赋标签列表（供企业选择）
  static async getAllTalentTags(req: Request, res: Response) {
    try {
      const result = await pool.query(
        `SELECT id, tag_name, category, description, manifestation, suitable_tasks
         FROM talent_tags
         ORDER BY category, tag_name`
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('获取天赋标签列表失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 获取所有业务场景标签
  static async getAllBusinessScenarios(req: Request, res: Response) {
    try {
      const result = await pool.query(
        `SELECT id, tag_name, category, description, required_understanding
         FROM business_scenario_tags
         ORDER BY category, tag_name`
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('获取业务场景标签失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 为任务匹配学生（使用新的天赋匹配算法）
  static async matchStudentsForTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { topN = 20 } = req.query;

      const matches = await TalentMatchingService.matchStudentsForTask(
        taskId,
        parseInt(topN as string)
      );

      res.json({
        success: true,
        data: matches
      });
    } catch (error) {
      console.error('任务匹配失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 手动触发天赋推断（从OPC分数）
  static async inferTalentsFromOPC(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      const { opcScores } = req.body;

      if (!opcScores) {
        return res.status(400).json({ success: false, message: '缺少OPC分数' });
      }

      await TalentTagInferenceService.inferFromOPC(studentId, opcScores);

      res.json({
        success: true,
        message: '天赋推断完成'
      });
    } catch (error) {
      console.error('天赋推断失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 手动触发能力提取（从任务完成）
  static async extractCapabilitiesFromTask(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      const { taskId } = req.params;

      // 获取任务信息
      const taskResult = await pool.query(
        'SELECT id, title, description, requirements FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }

      // 获取交付物信息
      const deliverableResult = await pool.query(
        'SELECT description, links FROM task_submissions WHERE task_id = $1 AND student_id = $2 ORDER BY created_at DESC LIMIT 1',
        [taskId, studentId]
      );

      if (deliverableResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: '未找到交付物' });
      }

      const extracted = await CapabilityExtractionService.extractFromTaskCompletion(
        studentId,
        taskId,
        taskResult.rows[0],
        deliverableResult.rows[0]
      );

      res.json({
        success: true,
        data: extracted,
        message: '能力提取完成'
      });
    } catch (error) {
      console.error('能力提取失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 创建任务需求拆解
  static async createRequirementBreakdown(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { breakdown } = req.body;

      if (!breakdown || !Array.isArray(breakdown)) {
        return res.status(400).json({ success: false, message: '无效的拆解结构' });
      }

      await RequirementBreakdownService.createBreakdown(taskId, breakdown);

      res.json({
        success: true,
        message: '需求拆解创建成功'
      });
    } catch (error) {
      console.error('创建需求拆解失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 获取任务需求拆解
  static async getRequirementBreakdown(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      const breakdown = await RequirementBreakdownService.getBreakdownTree(taskId);

      res.json({
        success: true,
        data: breakdown
      });
    } catch (error) {
      console.error('获取需求拆解失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 为子需求匹配学生
  static async matchStudentsForRequirement(req: Request, res: Response) {
    try {
      const { taskId, requirementId } = req.params;
      const { topN = 10 } = req.query;

      const matches = await RequirementBreakdownService.matchStudentsForRequirement(
        taskId,
        parseInt(requirementId, 10),
        parseInt(topN as string, 10)
      );

      res.json({
        success: true,
        data: matches
      });
    } catch (error) {
      console.error('子需求匹配失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  // 获取学生的成长统计（天赋&能力）
  static async getStudentGrowthStats(req: Request, res: Response) {
    try {
      const studentId = req.params.studentId || (req as any).user?.id;

      // 天赋标签统计
      const talentStats = await pool.query(
        `SELECT
           COUNT(*) as total_talents,
           COUNT(*) FILTER (WHERE strength_level = 'core') as core_talents,
           COUNT(*) FILTER (WHERE strength_level = 'prominent') as prominent_talents,
           COUNT(*) FILTER (WHERE strength_level = 'clear') as clear_talents,
           COUNT(*) FILTER (WHERE strength_level = 'emerging') as emerging_talents,
           AVG(confidence) as avg_confidence
         FROM student_talent_tags
         WHERE student_id = $1 AND is_active = true`,
        [studentId]
      );

      // 工具掌握统计
      const toolStats = await pool.query(
        `SELECT
           COUNT(*) as total_tools,
           COUNT(*) FILTER (WHERE proficiency_level = 'expert') as expert_tools,
           COUNT(*) FILTER (WHERE proficiency_level = 'advanced') as advanced_tools,
           COUNT(*) FILTER (WHERE proficiency_level = 'intermediate') as intermediate_tools,
           COUNT(*) FILTER (WHERE proficiency_level = 'basic') as basic_tools,
           SUM(usage_count) as total_usage
         FROM student_tool_usage
         WHERE student_id = $1`,
        [studentId]
      );

      // 案例经验统计
      const caseStats = await pool.query(
        `SELECT
           COUNT(*) as total_case_types,
           SUM(experience_count) as total_cases
         FROM student_case_experience
         WHERE student_id = $1`,
        [studentId]
      );

      res.json({
        success: true,
        data: {
          talents: talentStats.rows[0],
          tools: toolStats.rows[0],
          cases: caseStats.rows[0]
        }
      });
    } catch (error) {
      console.error('获取成长统计失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
}
