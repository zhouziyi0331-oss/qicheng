/**
 * 订单完成后的成长数据更新触发器
 * 当订单状态变为 completed 时，自动触发：
 * 1. 生成即时成长总结
 * 2. 更新六维能力数据
 */

import instantGrowthSummaryService from '../services/instantGrowthSummaryService';
import abilityDimensionUpdateService from '../services/abilityDimensionUpdateService';
import graduationReportService from '../services/graduationReportService';
import { pool } from '../config/database';

class GrowthDataTrigger {
  /**
   * 订单完成后触发成长数据更新
   */
  async onOrderCompleted(orderId: string): Promise<void> {
    logger.info(`[成长数据触发器] 订单 ${orderId} 完成，开始更新成长数据`);

    try {
      // 获取订单信息
      const orderInfo = await this.getOrderInfo(orderId);
      if (!orderInfo) {
        logger.error(`[成长数据触发器] 订单 ${orderId} 不存在`);
        return;
      }

      const { student_id, current_level } = orderInfo;

      // 1. 生成即时成长总结（异步，不阻塞）
      this.generateSummaryAsync(orderId).catch((error) => {
        logger.error(`[成长数据触发器] 生成即时总结失败:`, error);
      });

      // 2. 更新六维能力数据（异步，不阻塞）
      this.updateAbilityAsync(orderId).catch((error) => {
        logger.error(`[成长数据触发器] 更新六维能力失败:`, error);
      });

      // 3. 检查是否达到Lv.6，如果是则生成毕业报告
      if (current_level >= 6) {
        this.checkAndGenerateGraduationReport(student_id).catch((error) => {
          logger.error(`[成长数据触发器] 生成毕业报告失败:`, error);
        });
      }

      logger.info(`[成长数据触发器] 订单 ${orderId} 的成长数据更新已触发`);
    } catch (error) {
      logger.error(`[成长数据触发器] 处理订单 ${orderId} 失败:`, error);
    }
  }

  /**
   * 获取订单信息
   */
  private async getOrderInfo(orderId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT o.id, o.student_id, u.current_level
         FROM orders o
         JOIN users u ON o.student_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * 异步生成即时成长总结
   */
  private async generateSummaryAsync(orderId: string): Promise<void> {
    logger.info(`[成长数据触发器] 开始生成即时总结: ${orderId}`);
    const startTime = Date.now();

    try {
      await instantGrowthSummaryService.generateInstantSummary(orderId);
      const duration = Date.now() - startTime;
      logger.info(`[成长数据触发器] 即时总结生成完成，耗时: ${duration}ms`);
    } catch (error) {
      logger.error(`[成长数据触发器] 即时总结生成失败:`, error);
      throw error;
    }
  }

  /**
   * 异步更新六维能力
   */
  private async updateAbilityAsync(orderId: string): Promise<void> {
    logger.info(`[成长数据触发器] 开始更新六维能力: ${orderId}`);
    const startTime = Date.now();

    try {
      await abilityDimensionUpdateService.updateAbilityAfterOrder(orderId);
      const duration = Date.now() - startTime;
      logger.info(`[成长数据触发器] 六维能力更新完成，耗时: ${duration}ms`);
    } catch (error) {
      logger.error(`[成长数据触发器] 六维能力更新失败:`, error);
      throw error;
    }
  }

  /**
   * 检查并生成毕业报告
   */
  private async checkAndGenerateGraduationReport(studentId: string): Promise<void> {
    logger.info(`[成长数据触发器] 检查学生 ${studentId} 是否需要生成毕业报告`);

    try {
      // 检查是否已有报告
      const preview = await graduationReportService.getReportPreview(studentId);
      if (preview) {
        logger.info(`[成长数据触发器] 学生已有毕业报告，跳过生成`);
        return;
      }

      // 生成报告
      logger.info(`[成长数据触发器] 开始生成毕业报告`);
      const reportId = await graduationReportService.generateGraduationReport(studentId);
      logger.info(`[成长数据触发器] 毕业报告生成完成，报告ID: ${reportId}`);

      // 发送通知给学生（这里可以集成通知服务）
      await this.notifyStudentAboutGraduationReport(studentId, reportId);
    } catch (error) {
      logger.error(`[成长数据触发器] 毕业报告生成失败:`, error);
      throw error;
    }
  }

  /**
   * 通知学生毕业报告已生成
   */
  private async notifyStudentAboutGraduationReport(
    studentId: string,
    reportId: string
  ): Promise<void> {
    // TODO: 集成通知服务
    // 可以发送小程序通知、邮件、短信等
    logger.info(`[成长数据触发器] 通知学生 ${studentId} 毕业报告已生成: ${reportId}`);

    // 这里可以调用通知服务
    // await notificationService.send({
    //   userId: studentId,
    //   type: 'graduation_report_ready',
    //   title: '🎉 你的毕业报告已生成',
    //   content: '恭喜你达到Lv.6！一份关于你的万字成长报告已经生成。解锁费用¥299，可永久查看和下载。',
    //   data: { reportId }
    // });
  }

  /**
   * 批量处理历史订单（用于初始化或补充数据）
   */
  async processHistoricalOrders(studentId?: string): Promise<void> {
    logger.info(`[成长数据触发器] 开始批量处理历史订单`);

    const client = await pool.connect();
    try {
      // 获取所有已完成但未生成成长总结的订单
      let query = `
        SELECT o.id
        FROM orders o
        LEFT JOIN growth_summary_cache gsc ON o.id = gsc.order_id
        WHERE o.status = 'completed' AND gsc.id IS NULL
      `;
      const params: any[] = [];

      if (studentId) {
        query += ` AND o.student_id = $1`;
        params.push(studentId);
      }

      query += ` ORDER BY o.completed_at ASC`;

      const result = await client.query(query, params);
      const orders = result.rows;

      logger.info(`[成长数据触发器] 找到 ${orders.length} 个待处理订单`);

      // 逐个处理订单
      for (const order of orders) {
        try {
          await this.onOrderCompleted(order.id);
          // 添加延迟，避免API限流
          await this.sleep(2000);
        } catch (error) {
          logger.error(`[成长数据触发器] 处理订单 ${order.id} 失败:`, error);
        }
      }

      logger.info(`[成长数据触发器] 批量处理完成`);
    } finally {
      client.release();
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new GrowthDataTrigger();
