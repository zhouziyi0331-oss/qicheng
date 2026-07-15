import { pool } from '../utils/db';
import logger from '../utils/logger';

/**
 * 真正的向量生成服务 - 完全基于特征工程
 * 不依赖OpenAI Embedding API，从原始数据直接构建向量
 *
 * 适配版：使用qicheng的PostgreSQL pool
 */

// 技能分类体系 (8类 × 8技能 = 64维)
const SKILL_CATEGORIES = {
  'AI工具使用': ['ChatGPT', 'Claude', 'Midjourney', 'Stable Diffusion', 'Runway', 'ElevenLabs', 'HeyGen', 'Suno'],
  '内容创作': ['文案写作', '视频剪辑', '图像设计', '音频制作', '脚本创作', '故事板', '配音', '字幕'],
  '技术开发': ['Python', 'JavaScript', 'API集成', 'Prompt工程', '自动化脚本', 'Bot开发', 'Webhook', 'JSON'],
  '数据分析': ['数据清洗', '可视化', '统计分析', 'Excel', 'SQL', '报表制作', '趋势分析', 'A/B测试'],
  '营销推广': ['社交媒体', 'SEO', '广告投放', '用户增长', '内容运营', '社群运营', '转化优化', '品牌建设'],
  '项目管理': ['需求分析', '进度管理', '团队协作', '风险控制', '资源调度', '质量把控', '沟通协调', '文档管理'],
  '设计思维': ['用户研究', '原型设计', '交互设计', 'UI设计', '用户体验', '可用性测试', '信息架构', '视觉设计'],
  '商业分析': ['市场调研', '竞品分析', '商业模式', '财务分析', '定价策略', '成本控制', 'ROI分析', '增长策略']
};

// 领域分类 (7维)
const DOMAIN_KEYWORDS = {
  'ecommerce': ['电商', '跨境', '店铺', '选品', '物流', '客服', '转化', '购物车', '支付', '订单'],
  'content': ['内容', '创作', '自媒体', '短视频', '直播', 'IP', '粉丝', '播放量', '互动', '涨粉'],
  'service': ['服务', '餐饮', '酒店', '零售', '客户', '体验', '满意度', '复购', '会员', '门店'],
  'tech': ['技术', '开发', '产品', '软件', '系统', '平台', '架构', '代码', '测试', '部署'],
  'education': ['教育', '培训', '课程', '教学', '学习', '学员', '考试', '证书', '知识', '技能'],
  'government': ['政府', '乡村', '农业', '公共服务', '政务', '扶贫', '振兴', '惠民', '基层', '社区'],
  'startup': ['创业', '自由职业', '副业', '个人品牌', '变现', '接单', '兼职', '独立', '远程', '灵活']
};

// 难度指标
const DIFFICULTY_INDICATORS = {
  beginner: ['入门', '基础', '初级', '简单', '快速上手', '零基础', '新手', '小白'],
  intermediate: ['进阶', '中级', '实战', '综合', '应用', '提升', '深入', '实用'],
  advanced: ['高级', '深度', '复杂', '系统', '架构', '优化', '大规模', '专业', '精通']
};

export class VectorGenerationService {

  /**
   * 生成任务向量 (完全基于特征工程，不调用OpenAI)
   * 向量维度: 64 + 7 + 1 + 1 + 1 + 10 + 1 + 1 = 86维
   */
  async generateTaskVector(taskDescription: string, requirements: any): Promise<number[]> {
    logger.info('[Vector] Generating task vector from features...');

    // 1. 提取技能向量 (64维)
    const skillVector = this.extractSkillVector(taskDescription, requirements);

    // 2. 提取领域向量 (7维)
    const domainVector = this.extractDomainVector(taskDescription);

    // 3. 计算难度分数 (1维)
    const difficultyScore = this.calculateDifficultyScore(taskDescription, requirements);

    // 4. 计算复杂度分数 (1维)
    const complexityScore = this.calculateComplexityScore(taskDescription, requirements);

    // 5. 估算时间 (1维，归一化到0-1)
    const timeEstimate = this.estimateTime(taskDescription, requirements) / 20;

    // 6. 交付物类型向量 (10维)
    const deliverableType = this.extractDeliverableType(taskDescription, requirements);

    // 7. 工具数量 (1维，归一化)
    const toolCount = Math.min(this.countTools(taskDescription, requirements) / 5, 1);

    // 8. 步骤数量 (1维，归一化)
    const stepCount = Math.min(this.countSteps(requirements) / 10, 1);

    // 组合成完整向量
    const vector = [
      ...skillVector,           // 0-63
      ...domainVector,          // 64-70
      difficultyScore,          // 71
      complexityScore,          // 72
      timeEstimate,             // 73
      ...deliverableType,       // 74-83
      toolCount,                // 84
      stepCount                 // 85
    ];

    logger.info(`[Vector] Task vector generated: ${vector.length} dimensions`);
    return vector;
  }

  /**
   * 生成学生向量 (完全基于特征工程)
   * 向量维度: 64 + 7 + 1 + 1 + 1 + 1 + 1 + 1 = 77维
   */
  async generateStudentVector(studentId: string): Promise<number[]> {
    logger.info(`[Vector] Generating student vector for ${studentId}...`);

    const client = await pool.connect();
    try {
      // 1. 获取学生学习记录（适配qicheng数据库）
      const enrollmentResult = await client.query(`
        SELECT
          e.*,
          c.name as course_name,
          c.metadata as course_metadata
        FROM enrollments e
        LEFT JOIN atomic_courses c ON e.course_id = c.id
        WHERE e.student_id = $1
        ORDER BY e.enrolled_at DESC
      `, [studentId]);

      const enrollments = enrollmentResult.rows;

      // 2. 计算技能熟练度向量 (64维)
      const skillProficiency = this.calculateSkillProficiencyVector(enrollments);

      // 3. 计算领域经验向量 (7维)
      const domainExperience = this.calculateDomainExperienceVector(enrollments);

      // 4. 计算学习速度 (1维)
      const learningSpeed = this.calculateLearningSpeed(enrollments);

      // 5. 计算可靠性 (1维)
      const reliability = this.calculateReliability(enrollments);

      // 6. 计算完成率 (1维)
      const completionRate = enrollments.length > 0
        ? enrollments.filter((e: any) => e.status === 'completed').length / enrollments.length
        : 0;

      // 7. 计算平均质量 (1维)
      const scores = enrollments.filter((e: any) => e.final_score !== null).map((e: any) => e.final_score);
      const avgQuality = scores.length > 0
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length / 100
        : 0;

      // 8. 总学习时长 (1维，归一化)
      const totalHours = enrollments.reduce((sum: number, e: any) => {
        const metadata = e.course_metadata || {};
        return sum + (metadata.estimatedHours || 4);
      }, 0);
      const normalizedHours = Math.min(totalHours / 100, 1);

      // 9. 完成课程数 (1维，归一化)
      const coursesCompleted = enrollments.filter((e: any) => e.status === 'completed').length;
      const normalizedCourses = Math.min(coursesCompleted / 20, 1);

      // 组合成完整向量
      const vector = [
        ...skillProficiency,      // 0-63
        ...domainExperience,      // 64-70
        learningSpeed,            // 71
        reliability,              // 72
        completionRate,           // 73
        avgQuality,               // 74
        normalizedHours,          // 75
        normalizedCourses         // 76
      ];

      logger.info(`[Vector] Student vector generated: ${vector.length} dimensions`);
      return vector;
    } finally {
      client.release();
    }
  }

  /**
   * 提取技能向量 (64维)
   */
  private extractSkillVector(description: string, requirements: any): number[] {
    const vector = new Array(64).fill(0);
    const text = (description + JSON.stringify(requirements)).toLowerCase();
    let index = 0;

    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      for (const skill of skills) {
        const skillLower = skill.toLowerCase();
        if (text.includes(skillLower)) {
          vector[index] = 0.8;
        }
        index++;
      }
    }

    return vector;
  }

  /**
   * 提取领域向量 (7维)
   */
  private extractDomainVector(description: string): number[] {
    const vector = new Array(7).fill(0);
    const text = description.toLowerCase();
    const domains = Object.keys(DOMAIN_KEYWORDS);

    for (let i = 0; i < domains.length; i++) {
      const keywords = DOMAIN_KEYWORDS[domains[i] as keyof typeof DOMAIN_KEYWORDS];
      let matchCount = 0;

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          matchCount++;
        }
      }

      vector[i] = Math.min(matchCount / keywords.length, 1);
    }

    return vector;
  }

  /**
   * 计算难度分数
   */
  private calculateDifficultyScore(description: string, requirements: any): number {
    const text = (description + JSON.stringify(requirements)).toLowerCase();
    let score = 0.5;

    for (const [level, keywords] of Object.entries(DIFFICULTY_INDICATORS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          if (level === 'beginner') score = Math.min(score, 0.3);
          if (level === 'intermediate') score = 0.5;
          if (level === 'advanced') score = Math.max(score, 0.8);
        }
      }
    }

    const skillCount = this.countSkills(text);
    score += skillCount * 0.03;

    const stepCount = this.countSteps(requirements);
    score += stepCount * 0.02;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * 计算复杂度分数
   */
  private calculateComplexityScore(description: string, requirements: any): number {
    let score = 0;

    const toolCount = this.countTools(description, requirements);
    score += Math.min(toolCount * 0.1, 0.3);

    const stepCount = this.countSteps(requirements);
    score += Math.min(stepCount * 0.05, 0.3);

    const integrationKeywords = ['集成', '对接', '自动化', '工作流', '批量', '批处理'];
    for (const keyword of integrationKeywords) {
      if (description.includes(keyword)) score += 0.1;
    }

    const dataKeywords = ['数据分析', '大量', '数据库', '统计', '报表'];
    for (const keyword of dataKeywords) {
      if (description.includes(keyword)) score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * 估算时间
   */
  private estimateTime(description: string, requirements: any): number {
    let hours = 4;

    const text = description + JSON.stringify(requirements);

    if (text.includes('快速') || text.includes('1小时')) hours = 2;
    if (text.includes('一天') || text.includes('周末')) hours = 8;
    if (text.includes('一周') || text.includes('长期')) hours = 20;

    const stepCount = this.countSteps(requirements);
    hours += stepCount * 0.5;

    return Math.min(hours, 20);
  }

  /**
   * 提取交付物类型向量 (10维)
   */
  private extractDeliverableType(description: string, requirements: any): number[] {
    const types = [
      '文案', '视频', '图像', '音频', '代码',
      '报告', '方案', '模型', '数据', '其他'
    ];

    const vector = new Array(10).fill(0);
    const text = description + JSON.stringify(requirements);

    for (let i = 0; i < types.length; i++) {
      if (text.includes(types[i])) {
        vector[i] = 1;
      }
    }

    return vector;
  }

  /**
   * 计算技能熟练度向量 (64维)
   */
  private calculateSkillProficiencyVector(enrollments: any[]): number[] {
    const vector = new Array(64).fill(0);
    let index = 0;

    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      for (const skill of skills) {
        let proficiency = 0;

        for (const enrollment of enrollments) {
          const courseName = enrollment.course_name || '';

          if (courseName.includes(skill)) {
            if (enrollment.status === 'completed') {
              proficiency += 0.3;

              if (enrollment.final_score) {
                proficiency += (enrollment.final_score / 100) * 0.2;
              }
            } else if (enrollment.status === 'in_progress') {
              proficiency += 0.1;
            }
          }
        }

        vector[index] = Math.min(proficiency, 1);
        index++;
      }
    }

    return vector;
  }

  /**
   * 计算领域经验向量 (7维)
   */
  private calculateDomainExperienceVector(enrollments: any[]): number[] {
    const vector = new Array(7).fill(0);
    const domains = Object.keys(DOMAIN_KEYWORDS);

    for (let i = 0; i < domains.length; i++) {
      const keywords = DOMAIN_KEYWORDS[domains[i] as keyof typeof DOMAIN_KEYWORDS];
      let experience = 0;

      for (const enrollment of enrollments) {
        const courseName = enrollment.course_name || '';

        for (const keyword of keywords) {
          if (courseName.includes(keyword)) {
            experience += enrollment.status === 'completed' ? 0.2 : 0.1;
          }
        }
      }

      vector[i] = Math.min(experience, 1);
    }

    return vector;
  }

  /**
   * 计算学习速度
   */
  private calculateLearningSpeed(enrollments: any[]): number {
    const completed = enrollments.filter((e: any) => e.status === 'completed');
    if (completed.length === 0) return 0.5;

    let totalSpeed = 0;
    let count = 0;

    for (const enrollment of completed) {
      if (enrollment.completed_at && enrollment.enrolled_at) {
        const days = Math.ceil(
          (new Date(enrollment.completed_at).getTime() - new Date(enrollment.enrolled_at).getTime())
          / (1000 * 60 * 60 * 24)
        );

        const metadata = enrollment.course_metadata || {};
        const estimatedHours = metadata.estimatedHours || 4;
        const estimatedDays = Math.ceil(estimatedHours / 2);

        const speed = Math.min(estimatedDays / days, 2);
        totalSpeed += speed;
        count++;
      }
    }

    const avgSpeed = count > 0 ? totalSpeed / count : 0.5;
    return Math.min(Math.max(avgSpeed / 2, 0), 1);
  }

  /**
   * 计算可靠性
   */
  private calculateReliability(enrollments: any[]): number {
    if (enrollments.length === 0) return 0.5;

    const completed = enrollments.filter((e: any) => e.status === 'completed').length;
    const completionRate = completed / enrollments.length;

    const recent = enrollments.slice(0, 5);
    const recentCompleted = recent.filter((e: any) => e.status === 'completed').length;
    const recentRate = recent.length > 0 ? recentCompleted / recent.length : 0.5;

    const scores = enrollments.filter((e: any) => e.final_score !== null).map((e: any) => e.final_score);
    const avgScore = scores.length > 0
      ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length / 100
      : 0.5;

    return completionRate * 0.4 + recentRate * 0.4 + avgScore * 0.2;
  }

  // 辅助方法
  private countSkills(text: string): number {
    let count = 0;
    for (const skills of Object.values(SKILL_CATEGORIES)) {
      for (const skill of skills) {
        if (text.includes(skill.toLowerCase())) count++;
      }
    }
    return count;
  }

  private countTools(description: string, requirements: any): number {
    const text = description + JSON.stringify(requirements);
    let count = 0;

    for (const skills of Object.values(SKILL_CATEGORIES)) {
      for (const skill of skills) {
        if (text.includes(skill)) count++;
      }
    }

    return count;
  }

  private countSteps(requirements: any): number {
    if (!requirements) return 3;

    const text = JSON.stringify(requirements);
    const stepKeywords = ['步骤', '阶段', 'step', 'phase'];
    let count = 0;

    for (const keyword of stepKeywords) {
      const matches = text.match(new RegExp(keyword, 'gi'));
      if (matches) count += matches.length;
    }

    return Math.max(count, 3);
  }

  /**
   * 兼容方法：更新任务向量
   * 旧API兼容性
   */
  async updateTaskEmbedding(taskId: string): Promise<void> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, scenario, stages FROM atomic_courses WHERE id = $1',
        [taskId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = result.rows[0];
      await this.generateTaskVector(task.scenario, task.stages);
      logger.info(`[Vector] Task embedding updated: ${taskId}`);
    } finally {
      client.release();
    }
  }

  /**
   * 兼容方法：更新学生向量
   * 旧API兼容性
   */
  async updateStudentEmbedding(studentId: string): Promise<void> {
    await this.generateStudentVector(studentId);
    logger.info(`[Vector] Student embedding updated: ${studentId}`);
  }
}

export default new VectorGenerationService();
