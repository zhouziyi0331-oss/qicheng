/**
 * 学生成长数据闭环系统 - 完整验收测试脚本
 *
 * 执行方法：
 * ts-node src/scripts/validateGrowthSystem.ts
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import instantGrowthSummaryService from '../services/instantGrowthSummaryService';
import abilityDimensionUpdateService from '../services/abilityDimensionUpdateService';
import graduationReportService from '../services/graduationReportService';

interface ValidationResult {
  testName: string;
  passed: boolean;
  actualValue?: any;
  expectedValue?: any;
  message: string;
}

class GrowthSystemValidator {
  private results: ValidationResult[] = [];

  /**
   * 执行所有验收测试
   */
  async runAllTests(): Promise<void> {
    logger.info('🚀 开始执行学生成长数据闭环系统验收测试\n');
    logger.info('=' .repeat(80));

    try {
      // 1. 数据库结构验证
      await this.validateDatabaseStructure();

      // 2. 即时成长总结验证
      await this.validateInstantSummary();

      // 3. 六维能力更新验证
      await this.validateAbilityUpdate();

      // 4. 毕业报告验证
      await this.validateGraduationReport();

      // 5. 生成验收报告
      this.generateReport();

    } catch (error: any) {
      logger.error('❌ 验收测试执行失败:', error);
    } finally {
      await pool.end();
    }
  }

  /**
   * 1. 验证数据库结构
   */
  private async validateDatabaseStructure(): Promise<void> {
    logger.info('\n📊 1. 数据库结构验证');
    logger.info('-'.repeat(80));

    const client = await pool.connect();
    try {
      // 检查新表是否存在
      const tables = ['ability_dimension_history', 'growth_summary_cache', 'graduation_report_payments'];

      for (const table of tables) {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`,
          [table]
        );

        const exists = result.rows[0].exists;
        this.addResult({
          testName: `表 ${table} 存在`,
          passed: exists,
          message: exists ? '✅ 表已创建' : '❌ 表不存在'
        });
      }

      // 检查字段是否添加
      const fieldChecks = [
        { table: 'mentor_growth_observations', field: 'instant_summary' },
        { table: 'mentor_growth_observations', field: 'skills_demonstrated' },
        { table: 'user_ability_profiles', field: 'version' },
        { table: 'user_ability_profiles', field: 'is_current' },
        { table: 'user_ability_profiles', field: 'dimension_descriptions' },
        { table: 'growth_reports', field: 'is_paid' },
        { table: 'growth_reports', field: 'full_content_json' },
      ];

      for (const check of fieldChecks) {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = $1 AND column_name = $2
          )`,
          [check.table, check.field]
        );

        const exists = result.rows[0].exists;
        this.addResult({
          testName: `字段 ${check.table}.${check.field} 存在`,
          passed: exists,
          message: exists ? '✅ 字段已添加' : '❌ 字段不存在'
        });
      }

      // 检查视图是否创建
      const viewResult = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public'
          AND table_name = 'student_growth_overview'
        )`
      );

      const viewExists = viewResult.rows[0].exists;
      this.addResult({
        testName: '视图 student_growth_overview 存在',
        passed: viewExists,
        message: viewExists ? '✅ 视图已创建' : '❌ 视图不存在'
      });

    } finally {
      client.release();
    }
  }

  /**
   * 2. 验证即时成长总结
   */
  private async validateInstantSummary(): Promise<void> {
    logger.info('\n📝 2. 即时成长总结验证');
    logger.info('-'.repeat(80));

    const client = await pool.connect();
    try {
      // 检查是否有成长总结数据
      const result = await client.query(
        `SELECT
          id,
          task_id,
          summary_json,
          LENGTH(summary_json->>'paragraph_1') +
          LENGTH(summary_json->>'paragraph_2') +
          LENGTH(summary_json->>'paragraph_3') as total_words
        FROM growth_summary_cache
        ORDER BY created_at DESC
        LIMIT 10`
      );

      if (result.rows.length === 0) {
        this.addResult({
          testName: '即时成长总结数据存在',
          passed: false,
          message: '⚠️  没有找到成长总结数据，需要完成订单后才能验证'
        });
        return;
      }

      // 验证字数
      let passedCount = 0;
      let failedCount = 0;

      result.rows.forEach((row, index) => {
        const wordCount = parseInt(row.total_words);
        const passed = wordCount >= 300;

        if (passed) passedCount++;
        else failedCount++;

        this.addResult({
          testName: `成长总结 #${index + 1} 字数验证`,
          passed,
          actualValue: `${wordCount}字`,
          expectedValue: '≥300字',
          message: passed ? `✅ 字数达标 (${wordCount}字)` : `❌ 字数不足 (${wordCount}字)`
        });

        // 验证结构完整性
        const summary = row.summary_json;
        const hasAllFields =
          summary.headline &&
          summary.paragraph_1 &&
          summary.paragraph_2 &&
          summary.paragraph_3 &&
          summary.skills_demonstrated;

        this.addResult({
          testName: `成长总结 #${index + 1} 结构完整性`,
          passed: hasAllFields,
          message: hasAllFields ? '✅ 结构完整' : '❌ 缺少必要字段'
        });
      });

      // 总结
      logger.info(`\n   检查了 ${result.rows.length} 条成长总结`);
      logger.info(`   ✅ 通过: ${passedCount} 条`);
      logger.info(`   ❌ 失败: ${failedCount} 条`);

    } finally {
      client.release();
    }
  }

  /**
   * 3. 验证六维能力更新
   */
  private async validateAbilityUpdate(): Promise<void> {
    logger.info('\n📊 3. 六维能力更新验证');
    logger.info('-'.repeat(80));

    const client = await pool.connect();
    try {
      // 检查是否有能力更新数据
      const result = await client.query(
        `SELECT
          id,
          user_id,
          version,
          dimension_descriptions
        FROM user_ability_profiles
        WHERE dimension_descriptions IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5`
      );

      if (result.rows.length === 0) {
        this.addResult({
          testName: '六维能力更新数据存在',
          passed: false,
          message: '⚠️  没有找到能力更新数据，需要完成订单后才能验证'
        });
        return;
      }

      // 验证每个维度的字数
      result.rows.forEach((row, index) => {
        if (!row.dimension_descriptions) return;

        const dimensions = typeof row.dimension_descriptions === 'string'
          ? JSON.parse(row.dimension_descriptions)
          : row.dimension_descriptions;
        let totalWords = 0;
        let passedDimensions = 0;

        dimensions.forEach((dim: any) => {
          const wordCount = dim.description ? dim.description.length : 0;
          totalWords += wordCount;
          const passed = wordCount >= 100;

          if (passed) passedDimensions++;

          this.addResult({
            testName: `能力更新 #${index + 1} - ${dim.dimension} 字数`,
            passed,
            actualValue: `${wordCount}字`,
            expectedValue: '≥100字',
            message: passed ? `✅ ${wordCount}字` : `❌ ${wordCount}字（不足100）`
          });
        });

        // 验证总字数
        const totalPassed = totalWords >= 600;
        this.addResult({
          testName: `能力更新 #${index + 1} 总字数`,
          passed: totalPassed,
          actualValue: `${totalWords}字`,
          expectedValue: '≥600字',
          message: totalPassed ? `✅ ${totalWords}字` : `❌ ${totalWords}字（不足600）`
        });
      });

    } finally {
      client.release();
    }
  }

  /**
   * 4. 验证毕业报告
   */
  private async validateGraduationReport(): Promise<void> {
    logger.info('\n🎓 4. 毕业报告验证');
    logger.info('-'.repeat(80));

    const client = await pool.connect();
    try {
      // 检查是否有毕业报告
      const result = await client.query(
        `SELECT
          id,
          student_id,
          full_content_json,
          is_paid
        FROM growth_reports
        WHERE report_type = 'graduation'
        ORDER BY created_at DESC
        LIMIT 3`
      );

      if (result.rows.length === 0) {
        this.addResult({
          testName: '毕业报告数据存在',
          passed: false,
          message: '⚠️  没有找到毕业报告，需要学生达到Lv.6后才能验证'
        });
        return;
      }

      // 验证每个报告
      result.rows.forEach((row, index) => {
        if (!row.full_content_json) {
          this.addResult({
            testName: `毕业报告 #${index + 1}`,
            passed: false,
            message: '❌ 报告内容为空'
          });
          return;
        }

        const report = row.full_content_json;
        const totalWords = report.total_word_count || 0;

        // 验证总字数
        const totalPassed = totalWords >= 8000;
        this.addResult({
          testName: `毕业报告 #${index + 1} 总字数`,
          passed: totalPassed,
          actualValue: `${totalWords}字`,
          expectedValue: '≥8000字',
          message: totalPassed ? `✅ ${totalWords}字` : `❌ ${totalWords}字（不足8000）`
        });

        // 验证各章节字数
        if (report.chapters) {
          const chapterRequirements = [
            { chapter: 1, minWords: 1500 },
            { chapter: 2, minWords: 2000 },
            { chapter: 3, minWords: 2000 },
            { chapter: 4, minWords: 1500 },
            { chapter: 5, minWords: 1000 },
            { chapter: 6, minWords: 1000 },
          ];

          report.chapters.forEach((chapter: any) => {
            const req = chapterRequirements.find(r => r.chapter === chapter.chapter_number);
            if (!req) return;

            const wordCount = chapter.word_count || 0;
            const passed = wordCount >= req.minWords;

            this.addResult({
              testName: `毕业报告 #${index + 1} 第${chapter.chapter_number}章字数`,
              passed,
              actualValue: `${wordCount}字`,
              expectedValue: `≥${req.minWords}字`,
              message: passed ? `✅ ${wordCount}字` : `❌ ${wordCount}字（不足${req.minWords}）`
            });
          });
        }
      });

    } finally {
      client.release();
    }
  }

  /**
   * 添加验证结果
   */
  private addResult(result: ValidationResult): void {
    this.results.push(result);

    // 实时输出
    const icon = result.passed ? '✅' : '❌';
    logger.info(`   ${icon} ${result.testName}: ${result.message}`);
  }

  /**
   * 生成验收报告
   */
  private generateReport(): void {
    logger.info('\n' + '='.repeat(80));
    logger.info('📋 验收报告');
    logger.info('='.repeat(80));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    logger.info(`\n总测试数: ${totalTests}`);
    logger.info(`✅ 通过: ${passedTests}`);
    logger.info(`❌ 失败: ${failedTests}`);
    logger.info(`通过率: ${passRate}%`);

    // 按类别统计
    const categories = {
      '数据库结构': this.results.filter(r => r.testName.includes('存在')),
      '即时成长总结': this.results.filter(r => r.testName.includes('成长总结')),
      '六维能力更新': this.results.filter(r => r.testName.includes('能力更新')),
      '毕业报告': this.results.filter(r => r.testName.includes('毕业报告')),
    };

    logger.info('\n按类别统计:');
    Object.entries(categories).forEach(([category, tests]) => {
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
      logger.info(`  ${category}: ${passed}/${total} (${rate}%)`);
    });

    // 失败的测试
    const failedResults = this.results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      logger.info('\n❌ 失败的测试:');
      failedResults.forEach(r => {
        logger.info(`  - ${r.testName}`);
        logger.info(`    ${r.message}`);
        if (r.actualValue && r.expectedValue) {
          logger.info(`    实际值: ${r.actualValue}, 期望值: ${r.expectedValue}`);
        }
      });
    }

    // 最终结论
    logger.info('\n' + '='.repeat(80));
    if (failedTests === 0) {
      logger.info('🎉 验收结论: 全部通过！系统符合技术规格，可以上线。');
    } else if (passRate >= 80) {
      logger.info('⚠️  验收结论: 大部分通过，但仍有问题需要修复。');
    } else {
      logger.info('❌ 验收结论: 未通过验收，需要重新实现。');
    }
    logger.info('='.repeat(80) + '\n');
  }
}

// 执行验收测试
const validator = new GrowthSystemValidator();
validator.runAllTests().catch(console.error);
