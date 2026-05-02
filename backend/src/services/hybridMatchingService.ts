import { pool } from '../utils/db';
import logger from '../utils/logger';
import { embeddingService } from './embeddingService';

/**
 * 混合匹配服务：规则匹配 + AI向量匹配
 * 结合传统规则评分和AI语义相似度，提供更智能的匹配
 */
export class HybridMatchingService {
  /**
   * 混合匹配：为任务匹配学生
   * @param taskId 任务ID
   * @param topN 返回前N个匹配结果
   * @param useAI 是否启用AI向量匹配（默认true）
   */
  async matchStudentsForTask(
    taskId: string | number,
    topN: number = 10,
    useAI: boolean = true
  ): Promise<any[]> {
    try {
      // 1. 获取任务信息
      const taskResult = await pool.query(
        `SELECT id, title, description, track, level,
                required_openness, required_persistence, required_creativity,
                is_stretch_project, combined_embedding
         FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = taskResult.rows[0];

      // 2. 获取候选学生
      const studentsResult = await pool.query(
        `SELECT u.id, u.nickname as username, u.avatar_url as avatar,
                sa.openness, sa.persistence, sa.creativity,
                sa.primary_track, sa.current_level, sa.total_completed_tasks,
                u.profile_embedding
         FROM users u
         JOIN student_abilities sa ON u.id = sa.user_id
         WHERE sa.current_level <= $1 + 1
           AND u.role = 'student'`,
        [task.level]
      );

      // 3. 计算每个学生的匹配分数
      const matches = await Promise.all(
        studentsResult.rows.map(async (student) => {
          // 规则匹配分数（0-100）
          const ruleScore = this.calculateRuleBasedScore(student, task);

          // AI向量相似度分数（0-100）
          let aiScore = 0;
          if (useAI && task.combined_embedding && student.profile_embedding) {
            try {
              // Parse embeddings if they are strings
              const taskEmbedding = typeof task.combined_embedding === 'string'
                ? JSON.parse(task.combined_embedding)
                : task.combined_embedding;
              const studentEmbedding = typeof student.profile_embedding === 'string'
                ? JSON.parse(student.profile_embedding)
                : student.profile_embedding;

              const similarity = embeddingService.calculateCosineSimilarity(
                taskEmbedding,
                studentEmbedding
              );
              aiScore = similarity * 100; // 转换为0-100分
            } catch (error) {
              logger.warn('Failed to calculate vector similarity', { error });
            }
          }

          // 混合分数：规则60% + AI 40%
          const finalScore = useAI && aiScore > 0
            ? ruleScore * 0.6 + aiScore * 0.4
            : ruleScore;

          return {
            studentId: student.id,
            username: student.username,
            avatar: student.avatar,
            ruleScore: Math.round(ruleScore),
            aiScore: Math.round(aiScore),
            finalScore: Math.round(finalScore),
            abilities: {
              openness: student.openness,
              persistence: student.persistence,
              creativity: student.creativity,
            },
            currentLevel: student.current_level,
            totalCompletedTasks: student.total_completed_tasks,
            primaryTrack: student.primary_track,
          };
        })
      );

      // 4. 按最终分数排序
      matches.sort((a, b) => b.finalScore - a.finalScore);

      // 5. 保存匹配结果到日志
      await this.saveMatchLogs(taskId, matches.slice(0, topN));

      return matches.slice(0, topN);
    } catch (error) {
      logger.error('Error in hybrid matching for task', { taskId, error });
      throw error;
    }
  }

  /**
   * 混合匹配：为学生推荐任务
   */
  async matchTasksForStudent(
    userId: string | number,
    topN: number = 20,
    useAI: boolean = true
  ): Promise<any[]> {
    try {
      // 1. 获取学生信息
      const studentResult = await pool.query(
        `SELECT u.id, u.profile_embedding,
                sa.openness, sa.persistence, sa.creativity,
                sa.primary_track, sa.current_level, sa.total_completed_tasks
         FROM users u
         JOIN student_abilities sa ON u.id = sa.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (studentResult.rows.length === 0) {
        throw new Error('Student not found');
      }

      const student = studentResult.rows[0];

      // 2. 获取可用任务
      const tasksResult = await pool.query(
        `SELECT id, title, description, track, level,
                required_openness, required_persistence, required_creativity,
                is_stretch_project, budget_net, deadline, combined_embedding
         FROM tasks
         WHERE status = 'active'
           AND level >= $1 - 1
           AND level <= $1 + 1
           AND deleted_at IS NULL`,
        [student.current_level]
      );

      // 3. 计算每个任务的匹配分数
      const matches = await Promise.all(
        tasksResult.rows.map(async (task) => {
          // 规则匹配分数
          const ruleScore = this.calculateRuleBasedScore(student, task);

          // AI向量相似度分数
          let aiScore = 0;
          if (useAI && student.profile_embedding && task.combined_embedding) {
            try {
              // Parse embeddings if they are strings
              const studentEmbedding = typeof student.profile_embedding === 'string'
                ? JSON.parse(student.profile_embedding)
                : student.profile_embedding;
              const taskEmbedding = typeof task.combined_embedding === 'string'
                ? JSON.parse(task.combined_embedding)
                : task.combined_embedding;

              const similarity = embeddingService.calculateCosineSimilarity(
                studentEmbedding,
                taskEmbedding
              );
              aiScore = similarity * 100;
            } catch (error) {
              logger.warn('Failed to calculate vector similarity', { error });
            }
          }

          // 混合分数
          const finalScore = useAI && aiScore > 0
            ? ruleScore * 0.6 + aiScore * 0.4
            : ruleScore;

          return {
            taskId: task.id,
            title: task.title,
            description: task.description,
            track: task.track,
            level: task.level,
            budget: task.budget_net,
            deadline: task.deadline,
            ruleScore: Math.round(ruleScore),
            aiScore: Math.round(aiScore),
            finalScore: Math.round(finalScore),
          };
        })
      );

      // 4. 按最终分数排序
      matches.sort((a, b) => b.finalScore - a.finalScore);

      return matches.slice(0, topN);
    } catch (error) {
      logger.error('Error in hybrid matching for student', { userId, error });
      throw error;
    }
  }

  /**
   * 规则匹配算法（保留原有逻辑）
   */
  private calculateRuleBasedScore(student: any, task: any): number {
    let totalScore = 0;

    // 1. 赛道匹配（30%）
    let trackScore = 0;
    if (student.primary_track === task.track) {
      trackScore = 100;
    } else if (task.is_stretch_project) {
      trackScore = 70;
    } else {
      trackScore = 40;
    }
    totalScore += trackScore * 0.3;

    // 2. 等级匹配（25%）
    let levelScore = 0;
    const levelDiff = Math.abs(student.current_level - task.level);
    if (levelDiff === 0) {
      levelScore = 100;
    } else if (levelDiff === 1 && task.level > student.current_level) {
      levelScore = 85;
    } else if (levelDiff === 1 && task.level < student.current_level) {
      levelScore = 70;
    } else {
      levelScore = 30;
    }
    totalScore += levelScore * 0.25;

    // 3. 能力匹配（45%）
    const opennessGap = (task.required_openness || 50) - student.openness;
    const persistenceGap = (task.required_persistence || 50) - student.persistence;
    const creativityGap = (task.required_creativity || 50) - student.creativity;

    const opennessScore = this.calculateAbilityScore(opennessGap);
    const persistenceScore = this.calculateAbilityScore(persistenceGap);
    const creativityScore = this.calculateAbilityScore(creativityGap);

    const abilityScore = (opennessScore + persistenceScore + creativityScore) / 3;
    totalScore += abilityScore * 0.45;

    // 4. 经验加成
    if (student.total_completed_tasks >= 10) {
      totalScore += 5;
    }

    return Math.max(0, Math.min(100, totalScore));
  }

  /**
   * 计算单项能力匹配分数
   */
  private calculateAbilityScore(gap: number): number {
    if (gap <= 0) {
      return 100;
    } else if (gap <= 10) {
      return 90 - gap * 2;
    } else if (gap <= 20) {
      return 70 - (gap - 10) * 3;
    } else {
      return Math.max(0, 40 - (gap - 20) * 2);
    }
  }

  /**
   * 保存匹配日志
   */
  private async saveMatchLogs(taskId: string | number, matches: any[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing matches for this task
      await client.query('DELETE FROM ai_matches WHERE task_id = $1', [taskId]);
      await client.query('DELETE FROM ai_match_logs WHERE task_id = $1', [taskId]);

      for (const match of matches) {
        // Insert into ai_matches (for API queries)
        await client.query(
          `INSERT INTO ai_matches
           (task_id, student_id, match_score, match_reason, difficulty_level)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            taskId,
            match.studentId,
            match.finalScore,
            `规则评分: ${match.ruleScore}, AI相似度: ${match.aiScore}`,
            'medium'
          ]
        );

        // Insert into ai_match_logs (for historical tracking)
        await client.query(
          `INSERT INTO ai_match_logs
           (task_id, student_id, vector_similarity, rule_based_score, final_score, ai_reasoning)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            taskId,
            match.studentId,
            match.aiScore / 100, // 转换回0-1范围
            match.ruleScore,
            match.finalScore,
            `规则评分: ${match.ruleScore}, AI相似度: ${match.aiScore}, 最终分数: ${match.finalScore}`,
          ]
        );
      }

      await client.query('COMMIT');
      logger.info('Match logs saved successfully', { taskId, matchCount: matches.length });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error saving match logs', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 为任务生成并保存 embedding
   */
  async generateTaskEmbedding(taskId: string | number): Promise<void> {
    try {
      const taskResult = await pool.query(
        'SELECT id, title, description FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = taskResult.rows[0];
      const embeddings = await embeddingService.generateTaskEmbedding(
        task.title,
        task.description
      );

      await pool.query(
        `UPDATE tasks
         SET title_embedding = $1,
             description_embedding = $2,
             combined_embedding = $3
         WHERE id = $4`,
        [
          JSON.stringify(embeddings.titleEmbedding),
          JSON.stringify(embeddings.descriptionEmbedding),
          JSON.stringify(embeddings.combinedEmbedding),
          taskId,
        ]
      );

      logger.info('Task embedding generated', { taskId });
    } catch (error) {
      logger.error('Error generating task embedding', { taskId, error });
      throw error;
    }
  }

  /**
   * 为学生生成并保存 embedding
   */
  async generateStudentEmbedding(userId: string | number): Promise<void> {
    try {
      const studentResult = await pool.query(
        `SELECT
           u.id,
           u.nickname,
           u.university,
           u.major,
           u.grade,
           sa.primary_track,
           sa.current_level,
           sa.openness,
           sa.persistence,
           sa.creativity,
           sa.total_completed_tasks,
           sa.level_0_completed,
           sa.level_1_completed,
           sa.level_2_completed,
           sa.level_3_completed,
           sa.level_4_completed
         FROM users u
         LEFT JOIN student_abilities sa ON u.id = sa.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (studentResult.rows.length === 0) {
        throw new Error('Student not found');
      }

      const student = studentResult.rows[0];

      // 构建学生档案描述
      const profileText = `
学生档案：
姓名：${student.nickname || '未设置'}
学校：${student.university || '未设置'}
专业：${student.major || '未设置'}
年级：${student.grade || '未设置'}
主赛道：${student.primary_track === 'content' ? '内容创作' : student.primary_track === 'tool' ? '工具开发' : '未设置'}
当前等级：${student.current_level || 0}
能力特征：
- 开放性：${student.openness || 0}/10（探索新事物的意愿）
- 坚持性：${student.persistence || 0}/10（完成任务的毅力）
- 创造力：${student.creativity || 0}/10（创新思维能力）
完成任务统计：
- 总完成任务数：${student.total_completed_tasks || 0}
- 各等级完成情况：L0=${student.level_0_completed || 0}, L1=${student.level_1_completed || 0}, L2=${student.level_2_completed || 0}, L3=${student.level_3_completed || 0}, L4=${student.level_4_completed || 0}
      `.trim();

      // 生成技能描述（基于赛道和等级）
      const skillsText = `
技能特长：
主要方向：${student.primary_track === 'content' ? '内容创作、文案写作、视频制作' : student.primary_track === 'tool' ? '工具开发、编程、技术实现' : '综合能力'}
技能等级：${student.current_level || 0}级（共5级）
擅长领域：${student.primary_track === 'content' ? '创意表达、内容策划、用户沟通' : student.primary_track === 'tool' ? '技术开发、问题解决、系统设计' : '学习成长'}
      `.trim();

      // 生成兴趣描述（基于能力特征）
      const interestsText = `
兴趣特点：
${student.openness >= 7 ? '喜欢探索新领域，对新技术和新方法充满好奇' : student.openness >= 4 ? '愿意尝试新事物，保持开放心态' : '偏好熟悉的领域，稳扎稳打'}
${student.persistence >= 7 ? '具有很强的毅力，能够坚持完成困难任务' : student.persistence >= 4 ? '有一定的坚持能力，能够完成常规任务' : '需要更多激励和支持'}
${student.creativity >= 7 ? '富有创造力，善于提出创新想法' : student.creativity >= 4 ? '有一定创新思维，能够改进现有方案' : '偏好按照既定方法执行'}
      `.trim();

      const embeddings = await embeddingService.generateStudentEmbedding({
        skills: [skillsText],
        interests: [interestsText],
        bio: profileText,
      });

      await pool.query(
        `UPDATE users
         SET skills_embedding = $1,
             interests_embedding = $2,
             profile_embedding = $3
         WHERE id = $4`,
        [
          JSON.stringify(embeddings.skillsEmbedding),
          JSON.stringify(embeddings.interestsEmbedding),
          JSON.stringify(embeddings.profileEmbedding),
          userId,
        ]
      );

      logger.info('Student embedding generated', { userId });
    } catch (error) {
      logger.error('Error generating student embedding', { userId, error });
      throw error;
    }
  }
}

export const hybridMatchingService = new HybridMatchingService();
