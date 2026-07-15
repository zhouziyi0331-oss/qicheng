import { pool } from '../utils/db';
import logger from '../utils/logger';

/**
 * 需求拆解服务
 * 将复杂任务拆解成3层结构，每个子需求可以独立匹配学生
 */

interface BreakdownNode {
  id?: number;
  level: number; // 1, 2, 3
  parentId?: number;
  requirementName: string;
  requirementDescription: string;
  sequenceOrder: number;
  dependencies?: number[];
  estimatedHours?: number;
  difficultyLevel?: string;
  requiredCapabilities: {
    talents?: string[];
    tools?: string[];
    domainKnowledge?: string[];
    caseExperience?: string[];
  };
  isMandatory: boolean;
  canBeLearned: boolean;
  children?: BreakdownNode[];
}

export class RequirementBreakdownService {
  
  /**
   * 为任务创建需求拆解
   */
  static async createBreakdown(
    taskId: string,
    breakdown: BreakdownNode[]
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      logger.info(`[RequirementBreakdown] 为任务 ${taskId} 创建需求拆解`);
      
      // 递归插入节点
      for (const node of breakdown) {
        await this.insertNodeRecursive(client, taskId, node, null);
      }
      
      await client.query('COMMIT');
      
      logger.info(`[RequirementBreakdown] 拆解创建成功`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[RequirementBreakdown] 创建失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * 递归插入节点
   */
  private static async insertNodeRecursive(
    client: any,
    taskId: string,
    node: BreakdownNode,
    parentId: number | null
  ): Promise<number> {
    // 插入当前节点
    const result = await client.query(
      `INSERT INTO task_requirement_breakdown 
       (task_id, level, parent_id, requirement_name, requirement_description,
        sequence_order, dependencies, estimated_hours, difficulty_level,
        required_capabilities, is_mandatory, can_be_learned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        taskId,
        node.level,
        parentId,
        node.requirementName,
        node.requirementDescription,
        node.sequenceOrder,
        node.dependencies || [],
        node.estimatedHours,
        node.difficultyLevel,
        JSON.stringify(node.requiredCapabilities),
        node.isMandatory,
        node.canBeLearned
      ]
    );
    
    const nodeId = result.rows[0].id;
    
    // 递归插入子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await this.insertNodeRecursive(client, taskId, child, nodeId);
      }
    }
    
    return nodeId;
  }
  
  /**
   * 获取任务的完整拆解树
   */
  static async getBreakdownTree(taskId: string): Promise<BreakdownNode[]> {
    const client = await pool.connect();
    
    try {
      // 获取所有节点
      const result = await client.query(
        `SELECT id, level, parent_id, requirement_name, requirement_description,
                sequence_order, dependencies, estimated_hours, difficulty_level,
                required_capabilities, is_mandatory, can_be_learned
         FROM task_requirement_breakdown
         WHERE task_id = $1
         ORDER BY level, sequence_order`,
        [taskId]
      );
      
      const nodes = result.rows.map(row => ({
        id: row.id,
        level: row.level,
        parentId: row.parent_id,
        requirementName: row.requirement_name,
        requirementDescription: row.requirement_description,
        sequenceOrder: row.sequence_order,
        dependencies: row.dependencies,
        estimatedHours: row.estimated_hours,
        difficultyLevel: row.difficulty_level,
        requiredCapabilities: row.required_capabilities,
        isMandatory: row.is_mandatory,
        canBeLearned: row.can_be_learned,
        children: []
      }));
      
      // 构建树结构
      const nodeMap = new Map<number, BreakdownNode>();
      const rootNodes: BreakdownNode[] = [];
      
      // 第一遍：建立映射
      for (const node of nodes) {
        nodeMap.set(node.id!, node);
      }
      
      // 第二遍：建立父子关系
      for (const node of nodes) {
        if (node.parentId === null) {
          rootNodes.push(node);
        } else {
          const parent = nodeMap.get(node.parentId);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(node);
          }
        }
      }
      
      return rootNodes;
      
    } finally {
      client.release();
    }
  }
  
  /**
   * 为单个子需求匹配学生
   */
  static async matchStudentsForRequirement(
    taskId: string,
    requirementId: number,
    topN: number = 10
  ): Promise<Array<{
    studentId: string;
    matchScore: number;
    matchedCapabilities: any;
    missingCapabilities: any;
    canLearn: boolean;
  }>> {
    const client = await pool.connect();
    
    try {
      // 获取需求详情
      const reqResult = await client.query(
        `SELECT requirement_name, required_capabilities, can_be_learned
         FROM task_requirement_breakdown
         WHERE id = $1`,
        [requirementId]
      );
      
      if (reqResult.rows.length === 0) {
        return [];
      }
      
      const requirement = reqResult.rows[0];
      const requiredCaps = requirement.required_capabilities;
      
      // 获取所有学生
      const studentsResult = await client.query(
        `SELECT DISTINCT u.id as student_id
         FROM users u
         WHERE u.role = 'student'`
      );
      
      const matches = [];
      
      for (const student of studentsResult.rows) {
        const matchResult = await this.calculateRequirementMatch(
          client,
          student.student_id,
          requiredCaps,
          requirement.can_be_learned
        );
        
        matches.push({
          studentId: student.student_id,
          matchScore: matchResult.score,
          matchedCapabilities: matchResult.matched,
          missingCapabilities: matchResult.missing,
          canLearn: matchResult.canLearn
        });
      }
      
      // 排序
      matches.sort((a, b) => b.matchScore - a.matchScore);
      
      return matches.slice(0, topN);
      
    } finally {
      client.release();
    }
  }
  
  /**
   * 计算学生与单个需求的匹配度
   */
  private static async calculateRequirementMatch(
    client: any,
    studentId: string,
    requiredCapabilities: any,
    canBeLearned: boolean
  ): Promise<{
    score: number;
    matched: any;
    missing: any;
    canLearn: boolean;
  }> {
    const matched: any = {
      talents: [],
      tools: [],
      domainKnowledge: [],
      caseExperience: []
    };
    
    const missing: any = {
      talents: [],
      tools: [],
      domainKnowledge: [],
      caseExperience: []
    };
    
    let totalWeight = 0;
    let matchedWeight = 0;
    
    // 1. 检查天赋特质
    if (requiredCapabilities.talents && requiredCapabilities.talents.length > 0) {
      const talentsResult = await client.query(
        `SELECT tt.tag_name, stt.strength, stt.confidence
         FROM student_talent_tags stt
         JOIN talent_tags tt ON stt.tag_id = tt.id
         WHERE stt.student_id = $1 AND tt.tag_name = ANY($2)`,
        [studentId, requiredCapabilities.talents]
      );
      
      const studentTalents = talentsResult.rows.map((r: any) => r.tag_name);
      
      for (const talent of requiredCapabilities.talents) {
        totalWeight += 1.0;
        if (studentTalents.includes(talent)) {
          matched.talents.push(talent);
          matchedWeight += 0.8; // 天赋匹配权重0.8
        } else {
          missing.talents.push(talent);
        }
      }
    }
    
    // 2. 检查工具使用
    if (requiredCapabilities.tools && requiredCapabilities.tools.length > 0) {
      const toolsResult = await client.query(
        `SELECT tool_name, proficiency_level
         FROM student_tool_usage
         WHERE student_id = $1 AND tool_name = ANY($2)`,
        [studentId, requiredCapabilities.tools]
      );
      
      const studentTools = toolsResult.rows.map((r: any) => r.tool_name);
      
      for (const tool of requiredCapabilities.tools) {
        totalWeight += 0.6; // 工具权重较低，因为可以学
        if (studentTools.includes(tool)) {
          matched.tools.push(tool);
          matchedWeight += 0.6;
        } else {
          missing.tools.push(tool);
        }
      }
    }
    
    // 3. 检查领域知识
    if (requiredCapabilities.domainKnowledge && requiredCapabilities.domainKnowledge.length > 0) {
      const domainResult = await client.query(
        `SELECT domain_aspect, understanding_level
         FROM student_domain_understanding
         WHERE student_id = $1 AND domain_aspect = ANY($2)`,
        [studentId, requiredCapabilities.domainKnowledge]
      );
      
      const studentDomains = domainResult.rows.map((r: any) => r.domain_aspect);
      
      for (const domain of requiredCapabilities.domainKnowledge) {
        totalWeight += 0.8;
        if (studentDomains.includes(domain)) {
          matched.domainKnowledge.push(domain);
          matchedWeight += 0.8;
        } else {
          missing.domainKnowledge.push(domain);
        }
      }
    }
    
    // 4. 检查案例经验
    if (requiredCapabilities.caseExperience && requiredCapabilities.caseExperience.length > 0) {
      const caseResult = await client.query(
        `SELECT case_type, experience_count
         FROM student_case_experience
         WHERE student_id = $1 AND case_type = ANY($2)`,
        [studentId, requiredCapabilities.caseExperience]
      );
      
      const studentCases = caseResult.rows.map((r: any) => r.case_type);
      
      for (const caseType of requiredCapabilities.caseExperience) {
        totalWeight += 0.7;
        if (studentCases.includes(caseType)) {
          matched.caseExperience.push(caseType);
          matchedWeight += 0.7;
        } else {
          missing.caseExperience.push(caseType);
        }
      }
    }
    
    // 计算得分
    let score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
    
    // 如果可以边做边学，缺少工具/案例不严重扣分
    const canLearnMissing = canBeLearned && 
      missing.talents.length === 0 && // 天赋不能学，必须有
      (missing.tools.length > 0 || missing.caseExperience.length > 0);
    
    return {
      score,
      matched,
      missing,
      canLearn: canLearnMissing
    };
  }
  
  /**
   * 示例：创建一个电商客服Agent任务的拆解
   */
  static createEcommerceCustomerServiceAgentBreakdown(): BreakdownNode[] {
    return [
      {
        level: 1,
        requirementName: '需求分析模块',
        requirementDescription: '分析客服场景需求，明确业务目标',
        sequenceOrder: 1,
        estimatedHours: 2,
        difficultyLevel: 'medium',
        requiredCapabilities: {
          talents: ['系统思考', '用户共情', '结构化思维'],
          tools: ['ChatGPT'],
          domainKnowledge: ['电商业务流程']
        },
        isMandatory: true,
        canBeLearned: true,
        children: [
          {
            level: 2,
            requirementName: '用户场景梳理',
            requirementDescription: '梳理客服的典型使用场景',
            sequenceOrder: 1,
            estimatedHours: 0.5,
            difficultyLevel: 'easy',
            requiredCapabilities: {
              talents: ['用户共情'],
              tools: ['ChatGPT']
            },
            isMandatory: true,
            canBeLearned: true
          },
          {
            level: 2,
            requirementName: '常见问题收集',
            requirementDescription: '收集和整理常见客服问题',
            sequenceOrder: 2,
            estimatedHours: 1,
            difficultyLevel: 'easy',
            requiredCapabilities: {
              talents: ['结构化思维'],
              tools: ['Excel']
            },
            isMandatory: true,
            canBeLearned: true
          }
        ]
      },
      {
        level: 1,
        requirementName: '知识库模块',
        requirementDescription: '搭建客服知识库',
        sequenceOrder: 2,
        estimatedHours: 4,
        difficultyLevel: 'medium',
        requiredCapabilities: {
          talents: ['结构化思维', '细节敏感'],
          tools: ['ChatGPT', 'Excel'],
          caseExperience: ['Agent_客服']
        },
        isMandatory: true,
        canBeLearned: true,
        children: [
          {
            level: 2,
            requirementName: 'FAQ清单整理',
            requirementDescription: '整理常见问题清单',
            sequenceOrder: 1,
            estimatedHours: 1.5,
            difficultyLevel: 'easy',
            requiredCapabilities: {
              talents: ['结构化思维'],
              tools: ['Excel']
            },
            isMandatory: true,
            canBeLearned: true
          },
          {
            level: 2,
            requirementName: '标准答案编写',
            requirementDescription: '为每个问题编写标准答案',
            sequenceOrder: 2,
            estimatedHours: 2,
            difficultyLevel: 'medium',
            requiredCapabilities: {
              talents: ['清晰表达', '用户共情'],
              tools: ['ChatGPT']
            },
            isMandatory: true,
            canBeLearned: true
          }
        ]
      },
      {
        level: 1,
        requirementName: 'Agent工作流模块',
        requirementDescription: '设计和实现Agent工作流',
        sequenceOrder: 3,
        estimatedHours: 6,
        difficultyLevel: 'hard',
        requiredCapabilities: {
          talents: ['深度思考', '逻辑推理', '迭代思维'],
          tools: ['ChatGPT'],
          domainKnowledge: ['Agent工作流设计'],
          caseExperience: ['Agent_客服']
        },
        isMandatory: true,
        canBeLearned: true,
        children: [
          {
            level: 2,
            requirementName: 'Prompt设计',
            requirementDescription: '设计Agent的核心Prompt',
            sequenceOrder: 1,
            estimatedHours: 3,
            difficultyLevel: 'hard',
            requiredCapabilities: {
              talents: ['深度思考', '批判性思考'],
              tools: ['ChatGPT'],
              caseExperience: ['Agent_Prompt设计']
            },
            isMandatory: true,
            canBeLearned: true,
            children: [
              {
                level: 3,
                requirementName: '角色定义',
                requirementDescription: '定义Agent的角色和职责',
                sequenceOrder: 1,
                estimatedHours: 0.5,
                difficultyLevel: 'medium',
                requiredCapabilities: {
                  talents: ['清晰表达'],
                  tools: ['ChatGPT']
                },
                isMandatory: true,
                canBeLearned: true
              },
              {
                level: 3,
                requirementName: 'Few-shot示例',
                requirementDescription: '准备Few-shot示例',
                sequenceOrder: 2,
                estimatedHours: 1,
                difficultyLevel: 'medium',
                requiredCapabilities: {
                  talents: ['用户共情'],
                  tools: ['ChatGPT']
                },
                isMandatory: true,
                canBeLearned: true
              }
            ]
          }
        ]
      }
    ];
  }
}
