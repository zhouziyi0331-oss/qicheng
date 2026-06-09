/**
 * 修复OPC测试→能力画像联动
 *
 * 运行方式：
 * npx ts-node fix_opc_linkage.ts
 */

import opcIntegrationService from './src/services/opcIntegrationService';
import logger from './src/utils/logger';

async function main() {
  try {
    logger.info('开始修复OPC联动...');

    // 批量同步所有已完成的OPC测试
    await opcIntegrationService.syncAllCompletedOPC();

    logger.info('修复完成！');
    process.exit(0);
  } catch (error) {
    logger.error('修复失败:', error);
    process.exit(1);
  }
}

main();
