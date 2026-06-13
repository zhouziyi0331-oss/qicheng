/**
 * 定时任务：邀请系统维护
 * 1. 每小时检测过期邀请
 * 2. 每天凌晨检测不活跃学生
 * 3. 每周一重置周统计
 * 4. 每月1号重置月统计
 */

import cron from 'node-cron';
import { invitationTaskService } from '../services/invitation/invitationService';
import { activityService } from '../services/invitation/activityService';
import logger from '../utils/logger';

/**
 * 每小时检测过期邀请
 */
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('开始检测过期邀请...');
    const count = await invitationTaskService.expireInvitations();
    logger.info(`过期邀请检测完成，已过期${count}个邀请`);
  } catch (error: unknown) {
    logger.error('过期邀请检测失败:', error);
  }
});

/**
 * 每天凌晨2点检测不活跃学生（7天未登录）
 */
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('开始检测不活跃学生...');
    const count = await activityService.detectInactiveStudents();
    logger.info(`不活跃学生检测完成，已标记${count}个学生为不活跃`);
  } catch (error: unknown) {
    logger.error('不活跃学生检测失败:', error);
  }
});

/**
 * 每周一凌晨3点重置周统计
 */
cron.schedule('0 3 * * 1', async () => {
  try {
    logger.info('开始重置周统计...');
    await activityService.resetWeeklyStats();
    logger.info('周统计重置完成');
  } catch (error: unknown) {
    logger.error('周统计重置失败:', error);
  }
});

/**
 * 每月1号凌晨4点重置月统计
 */
cron.schedule('0 4 1 * *', async () => {
  try {
    logger.info('开始重置月统计...');
    await activityService.resetMonthlyStats();
    logger.info('月统计重置完成');
  } catch (error: unknown) {
    logger.error('月统计重置失败:', error);
  }
});

logger.info('邀请系统定时任务已启动');

export {};
