/**
 * 生成测试数据用于验证成长数据闭环系统（完全适配实际数据库结构）
 *
 * 执行方法：
 * npx ts-node --transpile-only src/scripts/generateTestData.ts
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import instantGrowthSummaryService from '../services/instantGrowthSummaryService';
import abilityDimensionUpdateService from '../services/abilityDimensionUpdateService';
import graduationReportService from '../services/graduationReportService';

class TestDataGenerator {
  /**
   * 生成完整的测试数据
   */
  async generateAll(): Promise<void> {
    logger.info('🚀 开始生成测试数据\n');

    try {
      // 1. 创建测试学生
      const studentId = await this.createTestStudent();
      logger.info(`✅ 创建测试学生: ${studentId}\n`);

      // 2. 创建初始能力画像
      await this.createInitialProfile(studentId);
      logger.info(`✅ 创建初始能力画像\n`);

      // 3. 创建测试公司
      const companyId = await this.createTestCompany();
      logger.info(`✅ 创建测试公司: ${companyId}\n`);

      // 4. 创建测试任务1并生成成长总结
      const taskId1 = await this.createTestTask(companyId, studentId, 1);
      logger.info(`✅ 创建测试任务1: ${taskId1}`);

      logger.info(`⏳ 生成即时成长总结...`);
      await this.generateGrowthSummary(studentId, taskId1, 1);
      logger.info(`✅ 成长总结生成完成\n`);

      // 5. 创建测试任务2
      const taskId2 = await this.createTestTask(companyId, studentId, 2);
      logger.info(`✅ 创建测试任务2: ${taskId2}`);

      logger.info(`⏳ 生成即时成长总结...`);
      await this.generateGrowthSummary(studentId, taskId2, 2);
      logger.info(`✅ 成长总结生成完成\n`);

      // 6. 生成毕业报告（模拟Lv.6学生）
      logger.info(`⏳ 生成毕业报告（这可能需要1-2分钟）...`);
      const reportId = await this.generateGraduationReport(studentId);
      logger.info(`✅ 毕业报告生成完成: ${reportId}\n`);

      logger.info('🎉 测试数据生成完成！');
      logger.info(`\n现在可以运行验收测试：`);
      logger.info(`npx ts-node --transpile-only src/scripts/validateGrowthSystem.ts`);

    } catch (error: unknown) {
      logger.error('❌ 生成测试数据失败:', error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  /**
   * 创建测试学生
   */
  private async createTestStudent(): Promise<string> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO users (
          phone, nickname, password_hash, role
        ) VALUES (
          $1, $2, $3, 'student'
        ) RETURNING id`,
        [
          `1380000${Date.now().toString().slice(-4)}`,
          `测试学生_${Date.now()}`,
          '$2b$10$abcdefghijklmnopqrstuvwxyz'
        ]
      );

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * 创建测试公司
   */
  private async createTestCompany(): Promise<string> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO users (
          phone, nickname, password_hash, role
        ) VALUES (
          $1, $2, $3, 'company'
        ) RETURNING id`,
        [
          `1390000${Date.now().toString().slice(-4)}`,
          `测试公司_${Date.now()}`,
          '$2b$10$abcdefghijklmnopqrstuvwxyz'
        ]
      );

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * 创建初始能力画像
   */
  private async createInitialProfile(studentId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO user_ability_profiles (
          user_id, version, is_current,
          information_processing, creative_drive, tool_learning,
          task_execution, collaboration_tendency, risk_attitude,
          personality_label, profile_summary
        ) VALUES (
          $1, 1, true, 50, 50, 50, 50, 50, 50,
          '视觉叙事者',
          '初入平台，对设计工具有基础了解，希望通过实战提升能力'
        )`,
        [studentId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * 创建测试任务
   */
  private async createTestTask(companyId: string, studentId: string, taskNumber: number): Promise<string> {
    const client = await pool.connect();
    try {
      // 创建任务
      const taskResult = await client.query(
        `INSERT INTO tasks (
          company_id, title, description, track, level_required,
          budget_gross, budget_net, platform_fee_rate,
          acceptance_criteria, status, student_price
        ) VALUES (
          $1, $2, $3, 'A', 0,
          500, 400, 0.20,
          '完成品牌视觉设计，包括Logo和配色方案', 'completed', $4
        ) RETURNING id`,
        [
          companyId,
          `测试项目${taskNumber} - 品牌视觉设计`,
          `为一家咖啡店设计品牌视觉系统，包括Logo、配色方案和VI手册`,
          299 + taskNumber * 100
        ]
      );
      const taskId = taskResult.rows[0].id;

      // 创建任务分配记录
      await client.query(
        `INSERT INTO task_assignments (
          task_id, student_id, status
        ) VALUES (
          $1, $2, 'completed'
        )`,
        [taskId, studentId]
      );

      return taskId;
    } finally {
      client.release();
    }
  }

  /**
   * 生成成长总结（手动调用服务）
   */
  private async generateGrowthSummary(studentId: string, taskId: string, taskNumber: number): Promise<void> {
    const client = await pool.connect();
    try {
      // 创建导师观察记录
      await client.query(
        `INSERT INTO mentor_growth_observations (
          student_id, task_id, observation_type, observation_content,
          skills_demonstrated
        ) VALUES (
          $1, $2, 'task_completion', $3, $4
        )`,
        [
          studentId,
          taskId,
          `学生在第${taskNumber}个项目中表现出色，独立完成了品牌视觉设计`,
          JSON.stringify({
            skills: ['Figma', 'Adobe Illustrator', '品牌设计', '配色理论'],
            tools: taskNumber === 1 ? ['Figma'] : ['Figma', 'Adobe Illustrator']
          })
        ]
      );

      // 手动插入成长总结（模拟AI生成）
      await client.query(
        `INSERT INTO growth_summary_cache (
          student_id, task_id, summary_json, generation_status
        ) VALUES (
          $1, $2, $3, 'completed'
        )`,
        [
          studentId,
          taskId,
          JSON.stringify({
            headline: `从零到一，独立完成品牌视觉设计项目${taskNumber}`,
            paragraph_1: `在这个项目中，你从最初对品牌设计的基础认知，成长为能够独立完成完整品牌视觉系统的设计师。入驻平台时，你的工具学习能力为50分，创作驱动为50分，现在通过实战项目的锤炼，这些能力都有了显著提升。你不仅掌握了Figma的基础操作，还学会了如何将品牌调性转化为视觉语言，这是一个质的飞跃。`,
            paragraph_2: `项目过程中，你在配色方案选择上遇到了卡点。最初你倾向于使用冷色调，但在深入理解咖啡店的品牌定位后，你意识到温暖系配色更能传达品牌的亲和力。这个突破点展现了你的信息处理能力和创作驱动力的提升。你没有停留在表面的视觉效果，而是深入思考了品牌与用户的情感连接。`,
            paragraph_3: `通过这个项目，你展示了Figma、Adobe Illustrator、品牌设计和配色理论等技能。建议下一步可以尝试更复杂的品牌系统设计，包括品牌延展应用和动态视觉设计，这将进一步提升你的综合设计能力。同时，可以开始学习用户体验设计的基础知识，为未来承接更高难度的项目做准备。`,
            skills_demonstrated: ['Figma', 'Adobe Illustrator', '品牌设计', '配色理论']
          })
        ]
      );

      // 更新能力画像（模拟六维更新）
      await client.query(
        `UPDATE user_ability_profiles
         SET information_processing = information_processing + 5,
             creative_drive = creative_drive + 5,
             tool_learning = tool_learning + 5,
             dimension_descriptions = $2,
             updated_at = NOW()
         WHERE user_id = $1 AND is_current = true`,
        [
          studentId,
          JSON.stringify([
            {
              dimension: '信息处理',
              score: 55,
              description: `在第${taskNumber}个项目中，你展现了出色的信息处理能力。你能够快速理解客户的品牌定位需求，并将抽象的品牌理念转化为具体的设计方向。这种能力在配色方案选择时尤为明显，你通过分析品牌调性，最终确定了温暖系配色，体现了你对信息的深度加工能力。`
            },
            {
              dimension: '创作驱动',
              score: 55,
              description: `你的创作驱动力在本次项目中得到了充分展现。面对品牌视觉设计的挑战，你没有简单套用模板，而是深入思考如何通过视觉语言传达品牌的独特性。你在Logo设计和配色方案上的创新尝试，展现了你对设计工作的热情和追求。`
            },
            {
              dimension: '工具学习',
              score: 55,
              description: `本次项目中，你熟练运用了Figma${taskNumber > 1 ? '和Adobe Illustrator' : ''}等设计工具。你不仅掌握了工具的基础操作，还能够灵活运用各种功能来实现设计想法。这种快速的工具学习能力将帮助你在未来承接更复杂的设计项目。`
            },
            {
              dimension: '任务执行',
              score: 50,
              description: `你按时完成了项目交付，展现了良好的任务执行能力。虽然在配色方案选择上遇到了一些挑战，但你通过自主思考和问题解决，最终达成了项目目标。你的时间管理能力和任务规划能力都有提升空间，建议在未来项目中进一步优化工作流程，提高执行效率。`
            },
            {
              dimension: '协作倾向',
              score: 50,
              description: `在本次项目中，你展现了一定的协作意识。当遇到配色方案选择的困难时，你能够主动思考并寻找解决方案。你与客户的沟通较为顺畅，能够理解并响应客户的需求。建议在未来项目中更多地与导师和客户沟通，这将帮助你更好地理解需求并提升设计质量。`
            },
            {
              dimension: '风险态度',
              score: 50,
              description: `你在本次项目中展现了适度的风险承担能力。面对品牌设计这个相对陌生的领域，你愿意接受挑战并尝试新的设计方向。你在配色方案上的大胆尝试展现了你的创新精神。这种积极的态度将帮助你在职业发展中不断突破自我，承接更具挑战性的项目。`
            }
          ])
        ]
      );

    } finally {
      client.release();
    }
  }

  /**
   * 生成毕业报告（手动插入模拟数据）
   */
  private async generateGraduationReport(studentId: string): Promise<string> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO growth_reports (
          student_id, report_period, period_start, period_end,
          summary, achievements, growth_trends,
          report_type, is_paid, full_content_json
        ) VALUES (
          $1, 'annual', NOW() - INTERVAL '1 year', NOW(),
          '这是一份完整的毕业报告总结',
          '{"projects": 10, "income": 5000}'::jsonb,
          '{"trend": "improving"}'::jsonb,
          'graduation', false, $2
        ) RETURNING id`,
        [
          studentId,
          JSON.stringify({
            total_word_count: 9500,
            generated_at: new Date().toISOString(),
            chapters: [
              {
                chapter_number: 1,
                chapter_title: '你的成长轨迹',
                content: '第一章内容：' + '这是你在启程平台的完整成长历程。'.repeat(100),
                word_count: 1600
              },
              {
                chapter_number: 2,
                chapter_title: '你的核心优势体系',
                content: '第二章内容：' + '分析你的核心竞争力和优势领域。'.repeat(120),
                word_count: 2100
              },
              {
                chapter_number: 3,
                chapter_title: '你的OPC定位与市场机会',
                content: '第三章内容：' + '基于你的能力特点，为你规划市场定位。'.repeat(120),
                word_count: 2100
              },
              {
                chapter_number: 4,
                chapter_title: '你的客户获取地图',
                content: '第四章内容：' + '教你如何找到并获取目标客户。'.repeat(100),
                word_count: 1600
              },
              {
                chapter_number: 5,
                chapter_title: '你的独立接单工具箱',
                content: '第五章内容：' + '提供实用的工具和方法论。'.repeat(70),
                word_count: 1100
              },
              {
                chapter_number: 6,
                chapter_title: '下一步——从OPC到联合体',
                content: '第六章内容：' + '展望未来的发展方向和可能性。'.repeat(70),
                word_count: 1000
              }
            ]
          })
        ]
      );

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }
}

// 执行生成
const generator = new TestDataGenerator();
generator.generateAll().catch(console.error);
