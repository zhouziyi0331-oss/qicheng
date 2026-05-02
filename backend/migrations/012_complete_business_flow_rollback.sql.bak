-- 回滚完整业务流程数据库迁移
-- 创建时间: 2026-04-11

-- 删除新增的表（按依赖关系倒序删除）
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS collaborations;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS requirement_supplements;
DROP TABLE IF EXISTS task_deliverables;
DROP TABLE IF EXISTS task_progress;
DROP TABLE IF EXISTS ai_matches;
DROP TABLE IF EXISTS payments;

-- 删除tasks表新增的字段
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_price_min;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_price_max;
ALTER TABLE tasks DROP COLUMN IF EXISTS company_price;
ALTER TABLE tasks DROP COLUMN IF EXISTS student_price;
ALTER TABLE tasks DROP COLUMN IF EXISTS platform_fee;
ALTER TABLE tasks DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE tasks DROP COLUMN IF EXISTS final_amount;
ALTER TABLE tasks DROP COLUMN IF EXISTS deposit_paid;
ALTER TABLE tasks DROP COLUMN IF EXISTS final_paid;
ALTER TABLE tasks DROP COLUMN IF EXISTS accepted_student_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS verification_deadline;
ALTER TABLE tasks DROP COLUMN IF EXISTS auto_confirmed;

-- 恢复tasks表的status字段为原始枚举
ALTER TABLE tasks MODIFY COLUMN status ENUM(
  'draft',
  'published',
  'in_progress',
  'completed',
  'cancelled'
) DEFAULT 'draft';

-- 删除users表新增的字段
ALTER TABLE users DROP COLUMN IF EXISTS wechat_id;
ALTER TABLE users DROP COLUMN IF EXISTS email;

COMMIT;
