# 数据库迁移指南

## 迁移文件说明

### 011_new_features.sql
为新增的5个API功能创建必要的数据库表和索引。

**包含的表**:
1. `level_challenges` - 跳级挑战记录
2. `student_tags` - 学生能力标签
3. `task_steps` - 任务执行步骤

**新增字段**:
- `student_profiles.six_dim_scores` - 六维能力分数(JSONB)
- `tasks.task_type` - 任务类型

## 执行迁移

### 方法1: 使用 psql 命令
```bash
# 设置数据库连接
export DATABASE_URL="postgresql://username:password@localhost:5432/qicheng"

# 执行迁移
psql $DATABASE_URL -f backend/migrations/011_new_features.sql
```

### 方法2: 使用 npm 脚本
```bash
cd backend

# 执行所有迁移
npm run db:migrate

# 或者单独执行
psql $DATABASE_URL -f migrations/011_new_features.sql
```

### 方法3: 在数据库客户端中执行
1. 打开 pgAdmin、DBeaver 或其他数据库工具
2. 连接到 qicheng 数据库
3. 打开 `011_new_features.sql` 文件
4. 执行整个脚本

## 验证迁移

执行以下SQL验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('level_challenges', 'student_tags', 'task_steps')
  AND table_schema = 'public';

-- 检查索引
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('level_challenges', 'student_tags', 'task_steps');

-- 检查触发器
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('level_challenges', 'student_tags', 'task_steps');
```

预期结果：
- 3个表已创建
- 9个索引已创建
- 3个触发器已创建

## 回滚迁移

如果需要回滚此次迁移：

```bash
psql $DATABASE_URL -f backend/migrations/011_new_features_rollback.sql
```

**警告**: 回滚将删除所有相关表和数据，请谨慎操作！

## 表结构详情

### 1. level_challenges (跳级挑战记录)
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL (外键 -> users.id)
old_level       INT NOT NULL (0-10)
new_level       INT NOT NULL (0-10)
score           INT NOT NULL (0-100)
passed          BOOLEAN NOT NULL
answers         JSONB NOT NULL
feedback        TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 2. student_tags (学生能力标签)
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL (外键 -> users.id)
tag_name        VARCHAR(50) NOT NULL
tag_type        VARCHAR(20) NOT NULL (skill/interest/achievement)
source          VARCHAR(20) NOT NULL (system/ai/manual)
confidence      DECIMAL(3,2) (0-1)
created_at      TIMESTAMP
updated_at      TIMESTAMP
deleted_at      TIMESTAMP
```

### 3. task_steps (任务执行步骤)
```sql
id              UUID PRIMARY KEY
task_id         UUID NOT NULL (外键 -> tasks.id)
student_id      UUID NOT NULL (外键 -> users.id)
step_num        INT NOT NULL
step_title      VARCHAR(200) NOT NULL
step_desc       TEXT
tool_hint       VARCHAR(100)
est_minutes     INT
status          VARCHAR(20) (pending/in_progress/completed)
completed_at    TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## 常见问题

### Q: 迁移失败，提示表已存在
A: 这是正常的，脚本使用了 `IF NOT EXISTS`，不会重复创建表。

### Q: 如何查看迁移历史？
A: 目前使用文件编号管理，建议创建 `schema_migrations` 表记录：
```sql
CREATE TABLE schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('011_new_features');
```

### Q: 生产环境如何执行迁移？
A: 
1. 先在测试环境验证
2. 备份生产数据库
3. 在低峰期执行迁移
4. 验证数据完整性
5. 监控应用日志

## 性能优化建议

1. **索引优化**: 已为常用查询字段创建索引
2. **分区表**: 如果 `level_challenges` 数据量大，考虑按时间分区
3. **归档策略**: 定期归档旧的挑战记录

## 数据初始化

迁移脚本会自动为现有学生添加基础标签（基于OPC标签）。如需添加更多初始数据：

```sql
-- 添加常用技能标签
INSERT INTO student_tags (user_id, tag_name, tag_type, source)
SELECT user_id, 'Prompt工程', 'skill', 'system'
FROM student_profiles
WHERE opc_label LIKE '%AI%'
ON CONFLICT DO NOTHING;
```

## 监控和维护

### 定期检查表大小
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('level_challenges', 'student_tags', 'task_steps')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 清理过期数据
```sql
-- 软删除6个月前的标签
UPDATE student_tags 
SET deleted_at = NOW() 
WHERE created_at < NOW() - INTERVAL '6 months'
  AND deleted_at IS NULL;

-- 归档1年前的挑战记录
-- (建议先导出到归档表)
```

## 相关文档

- [后端API文档](../BACKEND_API_COMPLETED.md)
- [前端功能文档](../MISSING_FEATURES_COMPLETED.md)
- [数据库设计文档](../docs/database-schema.md)
