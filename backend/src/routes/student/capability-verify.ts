import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';

export async function verifyCapability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { taskId } = req.body;

    const taskResult = await pool.query(
      `SELECT t.id, t.title, t.required_skills, t.difficulty_level, t.estimated_hours
       FROM tasks t
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const task = taskResult.rows[0];
    const requiredSkills = task.required_skills || [];

    const studentSkillsResult = await pool.query(
      `SELECT skill_name, skill_level, case_count
       FROM student_skills
       WHERE student_id = $1`,
      [studentId]
    );

    const studentSkills = new Map(
      studentSkillsResult.rows.map(row => [row.skill_name, { level: row.skill_level, cases: row.case_count }])
    );

    const matchedSkills = [];
    const weakSkills = [];

    for (const requiredSkill of requiredSkills) {
      const studentSkill = studentSkills.get(requiredSkill.name);

      if (studentSkill && studentSkill.level >= requiredSkill.minLevel) {
        matchedSkills.push({
          skill: requiredSkill.name,
          studentLevel: studentSkill.level,
          requiredLevel: requiredSkill.minLevel,
          cases: studentSkill.cases,
          status: 'strong'
        });
      } else if (studentSkill && studentSkill.level === requiredSkill.minLevel - 1) {
        matchedSkills.push({
          skill: requiredSkill.name,
          studentLevel: studentSkill.level,
          requiredLevel: requiredSkill.minLevel,
          cases: studentSkill.cases,
          status: 'acceptable'
        });
      } else {
        weakSkills.push({
          skill: requiredSkill.name,
          studentLevel: studentSkill?.level || 0,
          requiredLevel: requiredSkill.minLevel,
          cases: studentSkill?.cases || 0,
          status: 'weak'
        });
      }
    }

    const studentHistoryResult = await pool.query(
      `SELECT COUNT(*) as total_completed,
       AVG(client_rating) as avg_rating,
       AVG(EXTRACT(DAY FROM (completed_at - started_at))) as avg_completion_days
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const history = studentHistoryResult.rows[0];
    const totalCompleted = parseInt(history.total_completed || '0');
    const avgRating = parseFloat(history.avg_rating || '0');
    const avgDays = parseFloat(history.avg_completion_days || '0');

    let confidenceScore = 50;

    if (weakSkills.length === 0) {
      confidenceScore += 30;
    } else if (weakSkills.length <= 1) {
      confidenceScore += 15;
    }

    if (matchedSkills.filter(s => s.status === 'strong').length >= requiredSkills.length * 0.7) {
      confidenceScore += 20;
    }

    if (totalCompleted >= 10) {
      confidenceScore += 15;
    } else if (totalCompleted >= 5) {
      confidenceScore += 10;
    } else if (totalCompleted >= 1) {
      confidenceScore += 5;
    }

    if (avgRating >= 4.5) {
      confidenceScore += 10;
    } else if (avgRating >= 4.0) {
      confidenceScore += 5;
    }

    if (task.estimated_hours && avgDays > 0) {
      const estimatedDays = task.estimated_hours / 8;
      if (avgDays <= estimatedDays) {
        confidenceScore += 5;
      }
    }

    confidenceScore = Math.min(confidenceScore, 95);

    const passed = weakSkills.length === 0 && confidenceScore >= 70;

    const suggestions = [];
    if (weakSkills.length > 0) {
      suggestions.push(`建议先补充${weakSkills.length}项技能经验后再接单`);
    }
    if (totalCompleted < 3) {
      suggestions.push('建议先完成更多基础项目积累经验');
    }
    if (avgRating < 4.0 && totalCompleted > 0) {
      suggestions.push('建议先提升历史项目质量评分');
    }

    res.json({
      success: true,
      data: {
        passed,
        confidence: confidenceScore,
        matchedSkills,
        weakSkills,
        studentHistory: {
          totalCompleted,
          avgRating: Math.round(avgRating * 10) / 10,
          avgCompletionDays: Math.round(avgDays * 10) / 10
        },
        suggestions: passed ? [] : suggestions,
        recommendation: passed
          ? '你的能力完全匹配该项目，可以开始'
          : confidenceScore >= 60
            ? '你基本具备该项目能力，但建议先准备一下'
            : '建议先提升相关技能后再接单'
      }
    });
  } catch (err) {
    next(err);
  }
}
