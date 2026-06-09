# 🚀 迁移后续步骤 - 快速参考

## 当前状态

✅ **代码迁移**: 100%完成  
⏳ **数据库迁移**: 待执行  
⏳ **功能测试**: 待执行  

---

## 📋 执行清单

### 步骤1: 启动数据库服务

```bash
# macOS (Homebrew)
brew services start postgresql@14

# 或手动启动
pg_ctl -D /usr/local/var/postgres start

# 验证数据库运行
psql -U postgres -c "SELECT version();"
```

### 步骤2: 执行数据库迁移

```bash
cd /Users/alwan/code/qicheng/backend

# 方式1: 使用Node.js脚本（推荐）
npx ts-node scripts/runMigrations.ts

# 方式2: 使用psql命令
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qicheng"
psql $DATABASE_URL -f migrations/078_level_track_system.sql
psql $DATABASE_URL -f migrations/079_jump_test_system.sql
psql $DATABASE_URL -f migrations/080_team_community_system.sql
psql $DATABASE_URL -f migrations/081_migrate_student_profiles_to_users.sql
```

**预计时间**: 10分钟

### 步骤3: 验证数据完整性

```bash
# 使用脚本验证
npx ts-node scripts/runMigrations.ts --verify

# 或手动执行SQL
psql $DATABASE_URL << 'EOF'
-- 检查学生是否都有等级和赛道
SELECT COUNT(*) as missing_level_track 
FROM users 
WHERE role = 'student' AND (current_level IS NULL OR track IS NULL);
-- 应该返回 0

-- 检查student_capabilities初始化
SELECT COUNT(*) as missing_capabilities
FROM users u
LEFT JOIN student_capabilities sc ON u.id = sc.student_id
WHERE u.role = 'student' AND sc.student_id IS NULL;
-- 应该返回 0

-- 检查等级配置
SELECT COUNT(*) as level_configs FROM level_configs;
-- 应该返回 12

-- 检查等级分布
SELECT track, current_level, COUNT(*) as count
FROM users
WHERE role = 'student'
GROUP BY track, current_level
ORDER BY track, current_level;
EOF
```

**预计时间**: 5分钟

### 步骤4: 启动后端服务

```bash
cd /Users/alwan/code/qicheng/backend

# 开发模式
npm run dev

# 或生产模式
npm run build
npm start
```

### 步骤5: 功能测试

```bash
# 查看测试指南
npx ts-node scripts/testMigration.ts --guide

# 或运行自动化测试（需要服务运行）
npx ts-node scripts/testMigration.ts
```

**手动测试清单**:
- [ ] 学生注册（检查初始化 track 和 current_level）
- [ ] 学生登录（检查档案数据读取）
- [ ] 任务列表（Lv.0只看难度1）
- [ ] 跳级资格检查
- [ ] 组队创建（Lv.6权限）
- [ ] 组队加入（Lv.5权限）

**预计时间**: 10分钟

---

## 🔍 验证SQL速查

```sql
-- 1. 检查表是否创建
\dt level_configs
\dt jump_test_records
\dt teams
\dt student_capabilities

-- 2. 检查字段是否存在
\d users
-- 应该看到: track, current_level

-- 3. 检查数据
SELECT * FROM level_configs ORDER BY track, level;
-- 应该有12条记录

-- 4. 检查学生数据
SELECT u.id, u.nickname, u.track, u.current_level, sc.tasks_completed
FROM users u
LEFT JOIN student_capabilities sc ON u.id = sc.student_id
WHERE u.role = 'student'
LIMIT 5;

-- 5. 检查索引
\di idx_users_track_level
\di idx_student_capabilities_student
```

---

## ⚠️ 常见问题

### Q1: 数据库连接失败
```bash
# 检查PostgreSQL是否运行
ps aux | grep postgres

# 检查端口
lsof -i :5432

# 重启数据库
brew services restart postgresql@14
```

### Q2: Migration执行失败
```bash
# 查看错误信息
npx ts-node scripts/runMigrations.ts 2>&1 | tee migration.log

# 如果表已存在，可以跳过
# 脚本会自动处理"already exists"错误
```

### Q3: 数据验证失败
```sql
-- 如果有学生缺少track
UPDATE users SET track = 'content' 
WHERE role = 'student' AND track IS NULL;

-- 如果有学生缺少current_level
UPDATE users SET current_level = 0 
WHERE role = 'student' AND current_level IS NULL;

-- 如果有学生缺少student_capabilities
INSERT INTO student_capabilities (student_id, skills, tasks_completed)
SELECT id, '{}'::jsonb, 0
FROM users
WHERE role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM student_capabilities WHERE student_id = users.id
  );
```

### Q4: 编译错误
```bash
# 重新编译
npm run build

# 如果有错误，检查是否是aiTaskQueue.ts
# 这个文件的错误是预先存在的，与迁移无关
```

---

## 🔄 回滚方案

### 代码回滚
```bash
cd /Users/alwan/code/qicheng/backend

# 恢复备份
rm -rf src
mv src_backup_20260527_121715 src

# 重新编译
npm run build
```

### 数据库回滚
```sql
-- 删除新表（谨慎操作！）
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS jump_test_records CASCADE;
DROP TABLE IF EXISTS jump_test_templates CASCADE;
DROP TABLE IF EXISTS level_configs CASCADE;

-- 删除新字段
ALTER TABLE users DROP COLUMN IF EXISTS track;
ALTER TABLE users DROP COLUMN IF EXISTS current_level;

-- 注意：student_capabilities表可能有数据，谨慎删除
```

---

## 📊 预计总时间

| 步骤 | 时间 |
|------|------|
| 启动数据库 | 2分钟 |
| 执行migrations | 10分钟 |
| 验证数据 | 5分钟 |
| 启动服务 | 3分钟 |
| 功能测试 | 10分钟 |
| **总计** | **30分钟** |

---

## 📞 获取帮助

### 文档
- `FINAL_MIGRATION_REPORT.md` - 完整报告
- `MIGRATION_GUIDE.md` - 详细指南
- `LEVEL_SYSTEM_DEPLOYMENT.md` - 部署清单

### 脚本
- `scripts/runMigrations.ts` - 数据库迁移
- `scripts/testMigration.ts` - 功能测试
- `scripts/migrate_schema.py` - 代码迁移（已完成）

### Migration文件
- `migrations/078_level_track_system.sql`
- `migrations/079_jump_test_system.sql`
- `migrations/080_team_community_system.sql`
- `migrations/081_migrate_student_profiles_to_users.sql`

---

## ✅ 完成标志

当以下所有项都完成时，迁移即完成：

- [ ] 数据库migrations执行成功
- [ ] 数据验证SQL返回预期结果
- [ ] 后端服务启动无错误
- [ ] 学生注册流程正常
- [ ] 任务列表等级过滤正常
- [ ] 跳级功能可用
- [ ] 组队功能可用

---

**最后更新**: 2026-05-27  
**状态**: 代码完成，等待数据库迁移
