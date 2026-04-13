import { pool } from '../utils/db';
import logger from '../utils/logger';

/**
 * 任务赛道类型
 */
export type TaskTrack = 'content' | 'tool';

/**
 * 任务等级 (0-4)
 */
export type TaskLevel = 0 | 1 | 2 | 3 | 4;

/**
 * 难度评估
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'stretch';

/**
 * 学生能力画像
 */
export interface StudentAbility {
  userId: number;
  openness: number;
  persistence: number;
  creativity: number;
  primaryTrack: TaskTrack;
  currentLevel: TaskLevel;
  totalCompletedTasks: number;
  skills: string[];
}

/**
 * 任务需求
 */
export interface TaskRequirement {
  taskId: number;
  track: TaskTrack;
  level: TaskLevel;
  requiredOpenness: number;
  requiredPersistence: number;
  requiredCreativity: number;
  isStretchProject: boolean;
}

/**
 * 匹配结果
 */
export interface MatchResult {
  studentId: number;
  taskId: number;
  matchScore: number; // 0-100
  difficultyLevel: DifficultyLevel;
  matchReasons: string[];
  estimatedGrowth: {
    openness: number;
    persistence: number;
    creativity: number;
  };
}

/**
 * 智能匹配服务
 */
export class MatchingService {
  /**
   * 为任务匹配最合适的学生（Top N）
   */
  async matchStudentsForTask(taskId: number, topN: number = 10): Promise<MatchResult[]> {
    try {
      // 1. 获取任务需求
      const taskResult = await pool.query(
        `SELECT id, track, level, required_openness, required_persistence,
                required_creativity, is_stretch_project
         FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task: TaskRequirement = {
        taskId: taskResult.rows[0].id,
        track: taskResult.rows[0].track,
        level: taskResult.rows[0].level,
        requiredOpenness: taskResult.rows[0].required_openness || 50,
        requiredPersistence: taskResult.rows[0].required_persistence || 50,
        requiredCreativity: taskResult.rows[0].required_creativity || 50,
        isStretchProject: taskResult.rows[0].is_stretch_project || false,
      };

      // 2. 获取所有学生能力画像
      const studentsResult = await pool.query(
        `SELECT user_id, openness, persistence, creativity, primary_track,
                current_level, total_completed_tasks, skills
         FROM student_abilities
         WHERE current_level <= $1 + 1`, // 只匹配当前等级±1的学生
        [task.level]
      );

      // 3. 计算每个学生的匹配度
      const matches: MatchResult[] = studentsResult.rows.map((student) => {
        return this.calculateMatch(
          {
            userId: student.user_id,
            openness: student.openness,
            persistence: student.persistence,
            creativity: student.creativity,
            primaryTrack: student.primary_track,
            currentLevel: student.current_level,
            totalCompletedTasks: student.total_completed_tasks,
            skills: student.skills || [],
          },
          task
        );
      });

      // 4. 按匹配度排序，返回Top N
      matches.sort((a, b) => b.matchScore - a.matchScore);
      return matches.slice(0, topN);
    } catch (error) {
      logger.error('Error matching students for task', { taskId, error });
      throw error;
    }
  }

  /**
   * 为学生推荐最合适的任务（Top N）
   */
  async matchTasksForStudent(userId: number, topN: number = 20): Promise<MatchResult[]> {
    try {
      // 1. 获取学生能力画像
      const studentResult = await pool.query(
        `SELECT user_id, openness, persistence, creativity, primary_track,
                current_level, total_completed_tasks, skills
         FROM student_abilities WHERE user_id = $1`,
        [userId]
      );

      if (studentResult.rows.length === 0) {
        throw new Error('Student ability profile not found');
      }

      const student: StudentAbility = {
        userId: studentResult.rows[0].user_id,
        openness: studentResult.rows[0].openness,
        persistence: studentResult.rows[0].persistence,
        creativity: studentResult.rows[0].creativity,
        primaryTrack: studentResult.rows[0].primary_track,
        currentLevel: studentResult.rows[0].current_level,
        totalCompletedTasks: studentResult.rows[0].total_completed_tasks,
        skills: studentResult.rows[0].skills || [],
      };

      // 2. 获取可用任务（当前等级±1）
      const tasksResult = await pool.query(
        `SELECT id, track, level, required_openness, required_persistence,
                required_creativity, is_stretch_project
         FROM tasks
         WHERE status = 'published'
           AND level >= $1 - 1
           AND level <= $1 + 1
           AND accepted_student_id IS NULL`,
        [student.currentLevel]
      );

      // 3. 计算每个任务的匹配度
      const matches: MatchResult[] = tasksResult.rows.map((task) => {
        return this.calculateMatch(student, {
          taskId: task.id,
          track: task.track,
          level: task.level,
          requiredOpenness: task.required_openness || 50,
          requiredPersistence: task.required_persistence || 50,
          requiredCreativity: task.required_creativity || 50,
          isStretchProject: task.is_stretch_project || false,
        });
      });

      // 4. 按匹配度排序，返回Top N
      matches.sort((a, b) => b.matchScore - a.matchScore);
      return matches.slice(0, topN);
    } catch (error) {
      logger.error('Error matching tasks for student', { userId, error });
      throw error;
    }
  }

  /**
   * 核心匹配算法：计算学生与任务的匹配度
   */
  private calculateMatch(student: StudentAbility, task: TaskRequirement): MatchResult {
    const matchReasons: string[] = [];
    let totalScore = 0;

    // 1. 赛道匹配（权重30%）
    let trackScore = 0;
    if (student.primaryTrack === task.track) {
      trackScore = 100;
      matchReasons.push(`主赛道匹配（${task.track === 'content' ? 'AI内容创作' : 'AI工具开发'}）`);
    } else if (task.isStretchProject) {
      trackScore = 70;
      matchReasons.push('探索项目，适合跨赛道尝试');
    } else {
      trackScore = 40;
    }
    totalScore += trackScore * 0.3;

    // 2. 等级匹配（权重25%）
    let levelScore = 0;
    const levelDiff = Math.abs(student.currentLevel - task.level);
    if (levelDiff === 0) {
      levelScore = 100;
      matchReasons.push('等级完全匹配，难度适中');
    } else if (levelDiff === 1 && task.level > student.currentLevel) {
      levelScore = 85;
      matchReasons.push('略高一级，有成长空间');
    } else if (levelDiff === 1 && task.level < student.currentLevel) {
      levelScore = 70;
      matchReasons.push('略低一级，可快速完成');
    } else {
      levelScore = 30;
    }
    totalScore += levelScore * 0.25;

    // 3. 能力匹配（权重45%）
    const opennessGap = task.requiredOpenness - student.openness;
    const persistenceGap = task.requiredPersistence - student.persistence;
    const creativityGap = task.requiredCreativity - student.creativity;

    // 计算能力匹配度（差距越小越好，但允许一定挑战）
    const opennessScore = this.calculateAbilityScore(opennessGap);
    const persistenceScore = this.calculateAbilityScore(persistenceGap);
    const creativityScore = this.calculateAbilityScore(creativityGap);

    const abilityScore = (opennessScore + persistenceScore + creativityScore) / 3;
    totalScore += abilityScore * 0.45;

    // 添加能力匹配理由
    if (opennessGap > 10) {
      matchReasons.push('需要提升开放性能力');
    }
    if (persistenceGap > 10) {
      matchReasons.push('需要提升坚持性能力');
    }
    if (creativityGap > 10) {
      matchReasons.push('需要提升创造性能力');
    }
    if (opennessGap <= 5 && persistenceGap <= 5 && creativityGap <= 5) {
      matchReasons.push('能力完全匹配');
    }

    // 4. 经验加成
    if (student.totalCompletedTasks >= 10) {
      totalScore += 5;
      matchReasons.push('经验丰富，完成率高');
    }

    // 5. 确定难度等级
    let difficultyLevel: DifficultyLevel;
    const avgGap = (opennessGap + persistenceGap + creativityGap) / 3;
    if (avgGap < -10) {
      difficultyLevel = 'easy';
    } else if (avgGap < 5) {
      difficultyLevel = 'moderate';
    } else if (avgGap < 15) {
      difficultyLevel = 'challenging';
    } else {
      difficultyLevel = 'stretch';
    }

    // 6. 预估成长值
    const estimatedGrowth = {
      openness: Math.max(0, Math.min(10, opennessGap)),
      persistence: Math.max(0, Math.min(10, persistenceGap)),
      creativity: Math.max(0, Math.min(10, creativityGap)),
    };

    return {
      studentId: student.userId,
      taskId: task.taskId,
      matchScore: Math.round(Math.max(0, Math.min(100, totalScore))),
      difficultyLevel,
      matchReasons,
      estimatedGrowth,
    };
  }

  /**
   * 计算单项能力匹配分数
   * @param gap 能力差距（需求 - 当前）
   * @returns 分数 0-100
   */
  private calculateAbilityScore(gap: number): number {
    if (gap <= 0) {
      // 学生能力超过需求，完全匹配
      return 100;
    } else if (gap <= 10) {
      // 差距在10以内，适度挑战
      return 90 - gap * 2;
    } else if (gap <= 20) {
      // 差距在20以内，有挑战
      return 70 - (gap - 10) * 3;
    } else {
      // 差距过大，不太合适
      return Math.max(0, 40 - (gap - 20) * 2);
    }
  }

  /**
   * 保存匹配结果到数据库
   */
  async saveMatchResults(matches: MatchResult[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const match of matches) {
        await client.query(
          `INSERT INTO ai_matches
           (task_id, student_id, match_score, match_reason, difficulty_level,
            estimated_growth_openness, estimated_growth_persistence, estimated_growth_creativity, match_reasons)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (task_id, student_id)
           DO UPDATE SET
             match_score = EXCLUDED.match_score,
             match_reason = EXCLUDED.match_reason,
             difficulty_level = EXCLUDED.difficulty_level,
             estimated_growth_openness = EXCLUDED.estimated_growth_openness,
             estimated_growth_persistence = EXCLUDED.estimated_growth_persistence,
             estimated_growth_creativity = EXCLUDED.estimated_growth_creativity,
             match_reasons = EXCLUDED.match_reasons,
             updated_at = CURRENT_TIMESTAMP`,
          [
            match.taskId,
            match.studentId,
            match.matchScore,
            match.matchReasons.join('; '),
            match.difficultyLevel,
            match.estimatedGrowth.openness,
            match.estimatedGrowth.persistence,
            match.estimatedGrowth.creativity,
            JSON.stringify(match.matchReasons),
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error saving match results', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务的匹配学生列表
   */
  async getMatchedStudentsForTask(taskId: number, limit: number = 10) {
    const result = await pool.query(
      `SELECT
         am.student_id,
         am.match_score,
         am.difficulty_level,
         am.match_reasons,
         am.estimated_growth_openness,
         am.estimated_growth_persistence,
         am.estimated_growth_creativity,
         u.username,
         u.avatar,
         sa.openness,
         sa.persistence,
         sa.creativity,
         sa.current_level,
         sa.total_completed_tasks
       FROM ai_matches am
       JOIN users u ON am.student_id = u.id
       JOIN student_abilities sa ON am.student_id = sa.user_id
       WHERE am.task_id = $1
       ORDER BY am.match_score DESC
       LIMIT $2`,
      [taskId, limit]
    );

    return result.rows.map((row) => ({
      studentId: row.student_id,
      username: row.username,
      avatar: row.avatar,
      matchScore: row.match_score,
      difficultyLevel: row.difficulty_level,
      matchReasons: row.match_reasons,
      estimatedGrowth: {
        openness: row.estimated_growth_openness,
        persistence: row.estimated_growth_persistence,
        creativity: row.estimated_growth_creativity,
      },
      abilities: {
        openness: row.openness,
        persistence: row.persistence,
        creativity: row.creativity,
      },
      currentLevel: row.current_level,
      totalCompletedTasks: row.total_completed_tasks,
    }));
  }

  /**
   * 获取学生的推荐任务列表
   */
  async getMatchedTasksForStudent(userId: number, limit: number = 20) {
    const result = await pool.query(
      `SELECT
         am.task_id,
         am.match_score,
         am.difficulty_level,
         am.match_reasons,
         am.estimated_growth_openness,
         am.estimated_growth_persistence,
         am.estimated_growth_creativity,
         t.title,
         t.description,
         t.track,
         t.level,
         t.budget_range,
         t.duration,
         t.student_price,
         t.is_stretch_project,
         c.company_name
       FROM ai_matches am
       JOIN tasks t ON am.task_id = t.id
       JOIN companies c ON t.company_id = c.id
       WHERE am.student_id = $1
         AND t.status = 'published'
         AND t.accepted_student_id IS NULL
       ORDER BY am.match_score DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map((row) => ({
      taskId: row.task_id,
      title: row.title,
      description: row.description,
      track: row.track,
      level: row.level,
      budgetRange: row.budget_range,
      duration: row.duration,
      studentPrice: row.student_price,
      isStretchProject: row.is_stretch_project,
      companyName: row.company_name,
      matchScore: row.match_score,
      difficultyLevel: row.difficulty_level,
      matchReasons: row.match_reasons,
      estimatedGrowth: {
        openness: row.estimated_growth_openness,
        persistence: row.estimated_growth_persistence,
        creativity: row.estimated_growth_creativity,
      },
    }));
  }
}

export const matchingService = new MatchingService();
