import { queryOne } from '../utils/db';
import logger from '../utils/logger';
import vectorEmbeddingService from './vectorEmbeddingService';

/**
 * 项目需求分析服务
 * 从项目描述推导出"项目的客观工作条件需求"
 */

interface ProjectInfo {
  taskId: string;
  title: string;
  description: string;
  deliverableType: string; // 交付物类型：视觉内容、代码、文字、混合
  cycle: number; // 周期（天）
  budget: number;
  hasReference: boolean; // 是否有参考案例
  clientCommunicationStyle: string; // 客户沟通风格：频繁、适度、放手
}

interface ProjectRequirementProfile {
  taskId: string;

  // 六个维度的需求条件
  informationReceptionNeed: {
    condition: string; // 项目的信息提供情况
    requirement: string; // 对执行者的要求
  };

  creationDriveNeed: {
    outputType: string; // 产出类型
    requirement: string; // 对执行者的要求
  };

  learningApproachNeed: {
    startingPoint: string; // 项目起点
    requirement: string; // 对执行者的要求
  };

  executionRhythmNeed: {
    cycle: string; // 周期
    flexibility: string; // 灵活度
    requirement: string; // 对执行者的要求
  };

  autonomyNeed: {
    communicationFrequency: string; // 沟通频率
    requirement: string; // 对执行者的要求
  };

  riskLevel: {
    certainty: string; // 确定性
    requirement: string; // 对执行者的要求
  };

  // 综合需求文本（用于向量化）
  requirementText: string;

  // 项目类型
  projectType: string;
}

class ProjectAnalysisService {
  /**
   * 从项目信息生成需求条件画像
   */
  async generateRequirementProfile(projectInfo: ProjectInfo): Promise<ProjectRequirementProfile> {
    logger.info(`Generating requirement profile for task ${projectInfo.taskId}`);

    // 1. 分析信息接收需求
    const informationReceptionNeed = this.analyzeInformationReceptionNeed(projectInfo);

    // 2. 分析创作驱动需求
    const creationDriveNeed = this.analyzeCreationDriveNeed(projectInfo);

    // 3. 分析学习切入需求
    const learningApproachNeed = this.analyzeLearningApproachNeed(projectInfo);

    // 4. 分析执行节奏需求
    const executionRhythmNeed = this.analyzeExecutionRhythmNeed(projectInfo);

    // 5. 分析自主度需求
    const autonomyNeed = this.analyzeAutonomyNeed(projectInfo);

    // 6. 分析风险水平
    const riskLevel = this.analyzeRiskLevel(projectInfo);

    // 7. 确定项目类型
    const projectType = this.determineProjectType(projectInfo);

    // 8. 生成综合需求文本
    const requirementText = this.generateRequirementText(
      projectType,
      informationReceptionNeed,
      creationDriveNeed,
      learningApproachNeed,
      executionRhythmNeed,
      autonomyNeed,
      riskLevel
    );

    return {
      taskId: projectInfo.taskId,
      informationReceptionNeed,
      creationDriveNeed,
      learningApproachNeed,
      executionRhythmNeed,
      autonomyNeed,
      riskLevel,
      requirementText,
      projectType
    };
  }

  /**
   * 分析信息接收需求
   */
  private analyzeInformationReceptionNeed(projectInfo: ProjectInfo): any {
    if (projectInfo.hasReference && projectInfo.description.length > 200) {
      return {
        condition: '有明确参考案例和详细的项目说明',
        requirement: '执行者需要能从整体框架出发，先理解品牌调性和整体方向，再拆解到具体执行'
      };
    } else if (projectInfo.hasReference) {
      return {
        condition: '有参考案例但描述相对简略',
        requirement: '执行者需要能从参考案例中理解需求，有一定的需求理解能力'
      };
    } else if (projectInfo.description.length > 200) {
      return {
        condition: '有详细描述但没有参考案例',
        requirement: '执行者需要能从文字描述中提取关键信息，自己构建执行框架'
      };
    } else {
      return {
        condition: '需求描述相对模糊，需要执行者主动沟通确认',
        requirement: '执行者需要有较强的需求挖掘能力，能主动提问澄清需求'
      };
    }
  }

  /**
   * 分析创作驱动需求
   */
  private analyzeCreationDriveNeed(projectInfo: ProjectInfo): any {
    const type = projectInfo.deliverableType.toLowerCase();

    if (type.includes('视觉') || type.includes('设计') || type.includes('图')) {
      return {
        outputType: '视觉内容',
        requirement: '执行者需要从视觉创作中获得动力，对色彩、构图、视觉表现力敏感'
      };
    } else if (type.includes('代码') || type.includes('功能') || type.includes('开发')) {
      return {
        outputType: '功能实现',
        requirement: '执行者需要从解决问题、实现功能中获得成就感，逻辑思维强'
      };
    } else if (type.includes('文字') || type.includes('内容') || type.includes('文案')) {
      return {
        outputType: '文字内容',
        requirement: '执行者需要从文字表达、内容创作中获得满足感'
      };
    } else {
      return {
        outputType: '混合产出',
        requirement: '执行者需要能适应多种产出形式，既有创意又有执行力'
      };
    }
  }

  /**
   * 分析学习切入需求
   */
  private analyzeLearningApproachNeed(projectInfo: ProjectInfo): any {
    const needsNewTools = projectInfo.description.includes('新工具') ||
                          projectInfo.description.includes('学习') ||
                          projectInfo.description.includes('掌握');

    if (projectInfo.hasReference && !needsNewTools) {
      return {
        startingPoint: '有明确的第一步可以立即开始，参考案例清晰',
        requirement: '执行者可以直接上手，边做边学，不需要大量前期学习'
      };
    } else if (needsNewTools) {
      return {
        startingPoint: '需要先学习新工具或新技术',
        requirement: '执行者需要有较强的学习能力，愿意投入时间掌握新技能'
      };
    } else {
      return {
        startingPoint: '需要先理解需求和方向，再确定执行路径',
        requirement: '执行者需要有一定的项目规划能力，能自己确定学习和执行路径'
      };
    }
  }

  /**
   * 分析执行节奏需求
   */
  private analyzeExecutionRhythmNeed(projectInfo: ProjectInfo): any {
    const acceptsIteration = projectInfo.description.includes('迭代') ||
                            projectInfo.description.includes('初稿') ||
                            projectInfo.description.includes('反馈');

    if (acceptsIteration) {
      return {
        cycle: `${projectInfo.cycle}天`,
        flexibility: '接受迭代，建议先出概念稿确认方向',
        requirement: '执行者需要习惯快速迭代的工作方式，先出初稿再打磨'
      };
    } else if (projectInfo.cycle < 7) {
      return {
        cycle: `${projectInfo.cycle}天（紧急）`,
        flexibility: '周期紧张，需要快速交付',
        requirement: '执行者需要能快速上手，执行效率高，不拖延'
      };
    } else if (projectInfo.cycle > 30) {
      return {
        cycle: `${projectInfo.cycle}天（充裕）`,
        flexibility: '时间充足，可以充分打磨',
        requirement: '执行者需要有耐心，能持续投入，追求高完成度'
      };
    } else {
      return {
        cycle: `${projectInfo.cycle}天`,
        flexibility: '周期适中，需要合理规划',
        requirement: '执行者需要有基本的时间管理能力，能按节奏推进'
      };
    }
  }

  /**
   * 分析自主度需求
   */
  private analyzeAutonomyNeed(projectInfo: ProjectInfo): any {
    if (projectInfo.clientCommunicationStyle === '放手') {
      return {
        communicationFrequency: '需求方给出方向后基本放手，信任执行者',
        requirement: '执行者需要有较强的独立工作能力，能自主决策和推进'
      };
    } else if (projectInfo.clientCommunicationStyle === '频繁') {
      return {
        communicationFrequency: '需求方需要频繁沟通确认，参与度高',
        requirement: '执行者需要能适应频繁沟通，及时响应反馈'
      };
    } else {
      return {
        communicationFrequency: '需求方在关键节点参与，日常执行由执行者负责',
        requirement: '执行者需要能独立执行，同时在关键节点主动同步进度'
      };
    }
  }

  /**
   * 分析风险水平
   */
  private analyzeRiskLevel(projectInfo: ProjectInfo): any {
    const isExplorative = projectInfo.description.includes('探索') ||
                         projectInfo.description.includes('创新') ||
                         projectInfo.description.includes('尝试');

    if (projectInfo.hasReference && !isExplorative) {
      return {
        certainty: '方向明确，有参考案例，成功标准清晰',
        requirement: '执行者需要能按照既定方向执行，追求稳定的高质量产出'
      };
    } else if (isExplorative) {
      return {
        certainty: '需要探索和创新，结果有一定不确定性',
        requirement: '执行者需要能接受不确定性，愿意尝试新方向，有创新精神'
      };
    } else {
      return {
        certainty: '有基本方向但需要执行者发挥创造力',
        requirement: '执行者需要在有限的框架内发挥创意，平衡稳定性和创新性'
      };
    }
  }

  /**
   * 确定项目类型
   */
  private determineProjectType(projectInfo: ProjectInfo): string {
    const title = projectInfo.title.toLowerCase();
    const desc = projectInfo.description.toLowerCase();
    const type = projectInfo.deliverableType.toLowerCase();

    if (title.includes('品牌') || desc.includes('品牌')) {
      return '品牌视觉升级项目';
    } else if (type.includes('视觉') || type.includes('设计')) {
      return '视觉设计项目';
    } else if (type.includes('代码') || type.includes('开发')) {
      return '功能开发项目';
    } else if (type.includes('内容') || type.includes('文案')) {
      return '内容创作项目';
    } else {
      return '综合项目';
    }
  }

  /**
   * 生成综合需求文本
   */
  private generateRequirementText(
    projectType: string,
    informationReceptionNeed: any,
    creationDriveNeed: any,
    learningApproachNeed: any,
    executionRhythmNeed: any,
    autonomyNeed: any,
    riskLevel: any
  ): string {
    return `${projectType}。需求特征：${informationReceptionNeed.requirement}。审美要求：${creationDriveNeed.requirement}。工具适配：${learningApproachNeed.requirement}。交付节奏：${executionRhythmNeed.requirement}。协作方式：${autonomyNeed.requirement}。项目确定性：${riskLevel.requirement}。`;
  }

  /**
   * 保存项目需求画像到数据库
   */
  async saveRequirementProfile(profile: ProjectRequirementProfile): Promise<void> {
    try {
      // 生成向量
      const requirementVector = await vectorEmbeddingService.generateProjectRequirementVector(profile.requirementText);

      await queryOne(
        `INSERT INTO project_requirement_profiles (
          task_id,
          information_reception_need,
          creation_drive_need,
          learning_approach_need,
          execution_rhythm_need,
          autonomy_need,
          risk_level,
          requirement_text,
          requirement_vector,
          project_type,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (task_id)
        DO UPDATE SET
          information_reception_need = $2,
          creation_drive_need = $3,
          learning_approach_need = $4,
          execution_rhythm_need = $5,
          autonomy_need = $6,
          risk_level = $7,
          requirement_text = $8,
          requirement_vector = $9,
          project_type = $10,
          updated_at = NOW()`,
        [
          profile.taskId,
          JSON.stringify(profile.informationReceptionNeed),
          JSON.stringify(profile.creationDriveNeed),
          JSON.stringify(profile.learningApproachNeed),
          JSON.stringify(profile.executionRhythmNeed),
          JSON.stringify(profile.autonomyNeed),
          JSON.stringify(profile.riskLevel),
          profile.requirementText,
          requirementVector ? JSON.stringify(requirementVector) : null,
          profile.projectType
        ]
      );

      logger.info(`Saved requirement profile for task ${profile.taskId}${requirementVector ? ' with vector' : ''}`);
    } catch (error) {
      logger.error('Failed to save requirement profile:', error);
      throw error;
    }
  }
}

export default new ProjectAnalysisService();
