import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import vectorEmbeddingService from './vectorEmbeddingService';

/**
 * 工作条件匹配引擎
 * 不匹配"描述"，而是匹配"模式" - 判断学生的工作条件和项目的需求条件是否适配
 */

interface MatchAnalysis {
  taskId: string;
  studentId: string;
  overallFit: 'high' | 'medium' | 'low';
  fitScore: number;
  dimensionMatches: {
    informationReception: DimensionMatch;
    creationDrive: DimensionMatch;
    learningApproach: DimensionMatch;
    executionRhythm: DimensionMatch;
    autonomy: DimensionMatch;
    riskTolerance: DimensionMatch;
  };
  matchPoints: string[];
  frictionPoints: string[];
  adjustmentSuggestions: string[];
  recommendationForStudent: string;
  recommendationForCompany: string;
  vectorSimilarity?: number;
}

interface DimensionMatch {
  match: boolean;
  score: number; // 0-1
  reason: string;
}

class WorkConditionMatchingEngine {
  /**
   * 为任务找到最匹配的学生（使用向量检索 + 规则匹配）
   */
  async findBestStudentsForTask(taskId: string, limit: number = 10): Promise<MatchAnalysis[]> {
    logger.info(`Finding best students for task ${taskId}`);

    // 1. 获取项目需求画像
    const projectProfile = await this.getProjectProfile(taskId);
    if (!projectProfile) {
      throw new Error(`Project profile not found for task ${taskId}`);
    }

    // 2. 使用向量检索获取候选学生（如果有向量）
    let studentProfiles;
    if (projectProfile.requirement_vector) {
      logger.info('Using vector similarity search');
      studentProfiles = await this.getStudentsByVectorSimilarity(
        projectProfile.requirement_vector,
        limit * 3 // 获取3倍数量，再用规则匹配精排
      );
    } else {
      logger.info('Vector not available, using all student profiles');
      studentProfiles = await this.getAllStudentProfiles();
    }

    // 3. 对每个学生进行适配性分析（规则匹配）
    const matches: MatchAnalysis[] = [];
    for (const studentProfile of studentProfiles) {
      const analysis = await this.analyzeMatch(projectProfile, studentProfile);
      matches.push(analysis);
    }

    // 4. 按适配度排序（综合向量相似度和规则匹配分数）
    matches.sort((a, b) => {
      // 如果有向量相似度，综合考虑
      if (a.vectorSimilarity !== undefined && b.vectorSimilarity !== undefined) {
        const scoreA = a.fitScore * 0.6 + a.vectorSimilarity * 0.4;
        const scoreB = b.fitScore * 0.6 + b.vectorSimilarity * 0.4;
        return scoreB - scoreA;
      }
      // 否则只用规则匹配分数
      return b.fitScore - a.fitScore;
    });

    // 5. 保存匹配记录
    for (const match of matches.slice(0, limit)) {
      await this.saveMatchRecord(match);
    }

    return matches.slice(0, limit);
  }

  /**
   * 使用向量相似度检索学生
   */
  private async getStudentsByVectorSimilarity(
    requirementVector: any,
    limit: number
  ): Promise<any[]> {
    try {
      // 将向量转换为数组格式
      const vectorArray = typeof requirementVector === 'string'
        ? JSON.parse(requirementVector)
        : requirementVector;

      // 使用pgvector的余弦距离运算符 <=>
      const result = await query(
        `SELECT
          swcp.*,
          1 - (swcp.profile_vector <=> $1::vector) as similarity
         FROM student_work_condition_profiles swcp
         WHERE swcp.profile_vector IS NOT NULL
         ORDER BY swcp.profile_vector <=> $1::vector
         LIMIT $2`,
        [JSON.stringify(vectorArray), limit]
      );

      logger.info(`Vector search found ${result.rows.length} candidates`);
      return result.rows;

    } catch (error: unknown) {
      logger.error('Vector similarity search failed, falling back to all profiles:', error);
      return this.getAllStudentProfiles();
    }
  }

  /**
   * 核心方法：分析学生和项目的适配度
   * 结合规则匹配和向量相似度
   */
  private async analyzeMatch(projectProfile: any, studentProfile: any): Promise<MatchAnalysis> {
    // 计算向量相似度（如果有）
    let vectorSimilarity: number | undefined;
    if (studentProfile.similarity !== undefined) {
      // 从向量检索结果中获取
      vectorSimilarity = studentProfile.similarity;
    } else if (projectProfile.requirement_vector && studentProfile.profile_vector) {
      // 手动计算
      try {
        const projectVec = typeof projectProfile.requirement_vector === 'string'
          ? JSON.parse(projectProfile.requirement_vector)
          : projectProfile.requirement_vector;
        const studentVec = typeof studentProfile.profile_vector === 'string'
          ? JSON.parse(studentProfile.profile_vector)
          : studentProfile.profile_vector;

        vectorSimilarity = vectorEmbeddingService.calculateCosineSimilarity(projectVec, studentVec);
      } catch (error: unknown) {
        logger.warn('Failed to calculate vector similarity:', error);
      }
    }

    // 六个维度的逐一分析（规则匹配）
    const dimensionMatches = {
      informationReception: this.matchInformationReception(
        studentProfile.information_reception,
        projectProfile.information_reception_need
      ),
      creationDrive: this.matchCreationDrive(
        studentProfile.creation_drive,
        projectProfile.creation_drive_need
      ),
      learningApproach: this.matchLearningApproach(
        studentProfile.learning_approach,
        projectProfile.learning_approach_need
      ),
      executionRhythm: this.matchExecutionRhythm(
        studentProfile.execution_rhythm,
        projectProfile.execution_rhythm_need
      ),
      autonomy: this.matchAutonomy(
        studentProfile.autonomy_need,
        projectProfile.autonomy_need
      ),
      riskTolerance: this.matchRiskTolerance(
        studentProfile.risk_tolerance,
        projectProfile.risk_level
      )
    };

    // 计算整体适配度（规则匹配分数）
    const ruleFitScore = this.calculateOverallFit(dimensionMatches);

    // 综合分数：规则匹配60% + 向量相似度40%
    const fitScore = vectorSimilarity !== undefined
      ? ruleFitScore * 0.6 + vectorSimilarity * 0.4
      : ruleFitScore;

    const overallFit = fitScore > 0.7 ? 'high' : fitScore > 0.5 ? 'medium' : 'low';

    // 提取匹配点和摩擦点
    const matchPoints: string[] = [];
    const frictionPoints: string[] = [];

    Object.entries(dimensionMatches).forEach(([dimension, match]) => {
      if (match.match && match.score > 0.7) {
        matchPoints.push(match.reason);
      } else if (!match.match || match.score < 0.5) {
        frictionPoints.push(match.reason);
      }
    });

    // 生成调整建议
    const adjustmentSuggestions = this.generateAdjustmentSuggestions(frictionPoints, dimensionMatches);

    // 生成推荐理由
    const recommendationForStudent = this.generateStudentRecommendation(matchPoints, projectProfile);
    const recommendationForCompany = this.generateCompanyRecommendation(matchPoints, studentProfile);

    return {
      taskId: projectProfile.task_id,
      studentId: studentProfile.student_id,
      overallFit,
      fitScore,
      dimensionMatches,
      matchPoints,
      frictionPoints,
      adjustmentSuggestions,
      recommendationForStudent,
      recommendationForCompany,
      vectorSimilarity
    };
  }

  /**
   * 匹配维度1：信息接收方式
   */
  private matchInformationReception(studentPref: any, projectNeed: any): DimensionMatch {
    const student = typeof studentPref === 'string' ? JSON.parse(studentPref) : studentPref;
    const project = typeof projectNeed === 'string' ? JSON.parse(projectNeed) : projectNeed;

    // 学生习惯先看整体框架 + 项目有明确参考案例 = 高度匹配
    if (student.preference.includes('整体框架') && project.condition.includes('参考案例')) {
      return {
        match: true,
        score: 0.9,
        reason: '学生习惯先看整体框架再动手，项目正好有明确的参考案例和方向说明，信息接收方式高度匹配'
      };
    }

    // 学生习惯从具体任务开始 + 项目需要先理解整体 = 不匹配
    if (student.preference.includes('具体任务') && project.requirement.includes('整体框架')) {
      return {
        match: false,
        score: 0.3,
        reason: '学生习惯从具体任务开始，但项目需要先理解整体框架，可能需要调整工作方式'
      };
    }

    // 默认：适度匹配
    return {
      match: true,
      score: 0.6,
      reason: '学生的信息接收方式和项目需求基本适配'
    };
  }

  /**
   * 匹配维度2：创作驱动
   */
  private matchCreationDrive(studentDrive: any, projectNeed: any): DimensionMatch {
    const student = typeof studentDrive === 'string' ? JSON.parse(studentDrive) : studentDrive;
    const project = typeof projectNeed === 'string' ? JSON.parse(projectNeed) : projectNeed;

    // 学生从视觉中获得动力 + 项目产出视觉内容 = 高度匹配
    if (student.source.includes('视觉') && project.outputType.includes('视觉')) {
      return {
        match: true,
        score: 0.95,
        reason: '学生从视觉创作中获得动力，项目产出正是视觉内容，创作驱动完美匹配'
      };
    }

    // 学生从逻辑中获得动力 + 项目需要视觉创作 = 不匹配
    if (student.source.includes('逻辑') && project.outputType.includes('视觉')) {
      return {
        match: false,
        score: 0.2,
        reason: '学生的动力来自逻辑推演，但项目需要视觉创作能力，创作驱动不匹配'
      };
    }

    // 默认：适度匹配
    return {
      match: true,
      score: 0.6,
      reason: '学生的创作驱动和项目需求基本适配'
    };
  }

  /**
   * 匹配维度3：学习切入方式
   */
  private matchLearningApproach(studentApproach: any, projectNeed: any): DimensionMatch {
    const student = typeof studentApproach === 'string' ? JSON.parse(studentApproach) : studentApproach;
    const project = typeof projectNeed === 'string' ? JSON.parse(projectNeed) : projectNeed;

    // 学生喜欢直接上手 + 项目可以立即开始 = 高度匹配
    if (student.style.includes('直接上手') && project.startingPoint.includes('立即开始')) {
      return {
        match: true,
        score: 0.9,
        reason: '学生习惯拿到就开始做，项目有明确的第一步可以立即上手，学习方式高度匹配'
      };
    }

    // 学生需要先学习 + 项目需要立即开始 = 不匹配
    if (student.style.includes('先学习') && project.startingPoint.includes('立即开始')) {
      return {
        match: false,
        score: 0.4,
        reason: '学生习惯先系统学习再动手，但项目需要快速上手，可能需要调整学习节奏'
      };
    }

    // 默认：适度匹配
    return {
      match: true,
      score: 0.6,
      reason: '学生的学习方式和项目需求基本适配'
    };
  }

  /**
   * 匹配维度4：执行节奏
   */
  private matchExecutionRhythm(studentRhythm: any, projectNeed: any): DimensionMatch {
    const student = typeof studentRhythm === 'string' ? JSON.parse(studentRhythm) : studentRhythm;
    const project = typeof projectNeed === 'string' ? JSON.parse(projectNeed) : projectNeed;

    // 学生喜欢快速迭代 + 项目接受迭代 = 高度匹配
    if (student.pattern.includes('快速版本') && project.flexibility.includes('迭代')) {
      return {
        match: true,
        score: 0.95,
        reason: '学生习惯先出概念稿再打磨，项目正好接受迭代交付，执行节奏完美匹配'
      };
    }

    // 学生追求一次到位 + 项目需要快速迭代 = 不匹配
    if (student.pattern.includes('一次性') && project.flexibility.includes('快速')) {
      return {
        match: false,
        score: 0.3,
        reason: '学生习惯充分规划后一次到位，但项目需要快速迭代，执行节奏不匹配'
      };
    }

    // 默认：适度匹配
    return {
      match: true,
      score: 0.6,
      reason: '学生的执行节奏和项目需求基本适配'
    };
  }

  /**
   * 匹配维度5：自主度
   */
  private matchAutonomy(studentNeed: any, projectNeed: any): DimensionMatch {
    const student = typeof studentNeed === 'string' ? JSON.parse(studentNeed) : studentNeed;
    const project = typeof projectNeed === 'string' ? JSON.parse(projectNeed) : projectNeed;

    // 学生喜欢独立工作 + 项目给方向后放手 = 高度匹配
    if (student.level.includes('独立') && project.communicationFrequency.includes('放手')) {
      return {
        match: true,
        score: 0.9,
        reason: '学生偏好独立完成，需求方给出方向后基本放手，协作方式高度匹配'
      };
    }

    // 学生喜欢独立工作 + 项目需要频繁沟通 = 不匹配
    if (student.level.includes('独立') && project.communicationFrequency.includes('频繁')) {
      return {
        match: false,
        score: 0.4,
        reason: '学生偏好独立工作，但项目需要频繁沟通，可能需要调整协作方式'
      };
    }

    // 默认：适度匹配
    return {
      match: true,
      score: 0.6,
      reason: '学生的协作偏好和项目需求基本适配'
    };
  }

  /**
   * 匹配维度6：风险承受度
   */
  private matchRiskTolerance(studentTolerance: any, projectRisk: any): DimensionMatch {
    const student = typeof studentTolerance === 'string' ? JSON.parse(studentTolerance) : studentTolerance;
    const project = typeof projectRisk === 'string' ? JSON.parse(projectRisk) : projectRisk;

    // 学生审慎偏冒险 + 项目有挑战但有参考 = 高度匹配
    if (student.attitude.includes('评估可行性') && project.certainty.includes('参考案例')) {
      return {
        match: true,
        score: 0.9,
        reason: '学生愿意接受挑战但会评估可行性，项目有挑战但方向明确，风险态度高度匹配'
      };
    }

    // 学生稳健型 + 项目需要探索 = 不匹配
    if (student.attitude.includes('稳健') && project.certainty.includes('不确定')) {
      return {
        match: false,
        score: 0.3,
        reason: '学生偏好明确可控的项目，但项目需要探索和创新，风险承受度不匹配'
      };
    }

    // 默认：适度匹配
    return {
      match: true,
      score: 0.6,
      reason: '学生的风险态度和项目需求基本适配'
    };
  }

  /**
   * 计算整体适配度
   */
  private calculateOverallFit(dimensionMatches: any): number {
    // 六个维度的加权平均
    const weights = {
      informationReception: 0.15,
      creationDrive: 0.25, // 创作驱动权重最高
      learningApproach: 0.15,
      executionRhythm: 0.20, // 执行节奏权重较高
      autonomy: 0.15,
      riskTolerance: 0.10
    };

    let totalScore = 0;
    Object.entries(dimensionMatches).forEach(([dimension, match]: [string, any]) => {
      totalScore += match.score * weights[dimension as keyof typeof weights];
    });

    return Math.round(totalScore * 100) / 100;
  }

  /**
   * 生成调整建议
   */
  private generateAdjustmentSuggestions(frictionPoints: string[], dimensionMatches: any): string[] {
    const suggestions: string[] = [];

    if (frictionPoints.length === 0) {
      return suggestions;
    }

    // 基于摩擦点生成具体的调整建议
    if (!dimensionMatches.autonomy.match) {
      suggestions.push('建议在项目开始时明确沟通节奏，找到双方都舒服的协作方式');
    }

    if (!dimensionMatches.executionRhythm.match) {
      suggestions.push('建议在项目规划时就明确交付节奏，是否接受迭代，避免后期摩擦');
    }

    if (!dimensionMatches.informationReception.match) {
      suggestions.push('建议需求方在项目开始时提供更完整的背景信息和参考案例');
    }

    return suggestions;
  }

  /**
   * 生成面向学生的推荐理由
   */
  private generateStudentRecommendation(matchPoints: string[], projectProfile: any): string {
    if (matchPoints.length === 0) {
      return '这个项目和你的工作方式有一定差距，可能需要调整';
    }

    // 选择最重要的匹配点
    const topMatch = matchPoints[0];
    return topMatch.replace('学生', '你').replace('项目', '这个项目');
  }

  /**
   * 生成面向企业的推荐理由
   */
  private generateCompanyRecommendation(matchPoints: string[], studentProfile: any): string {
    if (matchPoints.length === 0) {
      return '这位学生和项目需求有一定差距';
    }

    // 选择最重要的匹配点
    const topMatch = matchPoints[0];
    return topMatch.replace('学生', '这位学生').replace('项目', '你的项目');
  }

  /**
   * 获取项目画像
   */
  private async getProjectProfile(taskId: string): Promise<any> {
    return await queryOne(
      `SELECT * FROM project_requirement_profiles WHERE task_id = $1`,
      [taskId]
    );
  }

  /**
   * 获取所有学生画像
   */
  private async getAllStudentProfiles(): Promise<any[]> {
    return await query(
      `SELECT * FROM student_work_condition_profiles`
    );
  }

  /**
   * 保存匹配记录
   */
  private async saveMatchRecord(match: MatchAnalysis): Promise<void> {
    try {
      await queryOne(
        `INSERT INTO work_condition_matches (
          task_id, student_id, overall_fit, fit_score,
          dimension_matches, match_points, friction_points,
          adjustment_suggestions, recommendation_for_student,
          recommendation_for_company, vector_similarity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (task_id, student_id)
        DO UPDATE SET
          overall_fit = $3,
          fit_score = $4,
          dimension_matches = $5,
          match_points = $6,
          friction_points = $7,
          adjustment_suggestions = $8,
          recommendation_for_student = $9,
          recommendation_for_company = $10,
          vector_similarity = $11`,
        [
          match.taskId,
          match.studentId,
          match.overallFit,
          match.fitScore,
          JSON.stringify(match.dimensionMatches),
          match.matchPoints,
          match.frictionPoints,
          match.adjustmentSuggestions,
          match.recommendationForStudent,
          match.recommendationForCompany,
          match.vectorSimilarity || null
        ]
      );
    } catch (error: unknown) {
      logger.error('Failed to save match record:', error);
    }
  }
}

export default new WorkConditionMatchingEngine();
