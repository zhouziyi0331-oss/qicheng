/**
 * 数据迁移脚本：加密已有的手机号和微信信息
 *
 * 执行方法：
 * npm run migrate:encrypt-sensitive-data
 *
 * ⚠️ 重要：
 * 1. 执行前请先备份数据库！
 * 2. 在测试环境验证后再在生产环境执行
 * 3. 建议在业务低峰期执行
 */
declare function migrateEncryptSensitiveData(): Promise<void>;
export { migrateEncryptSensitiveData };
//# sourceMappingURL=migrateEncryptSensitiveData.d.ts.map