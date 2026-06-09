# 数据库字段迁移指南

## 问题说明

启程平台存在新旧两套等级系统，需要统一迁移到新系统：
- **旧系统**：`student_profiles.level_a` / `level_b`
- **新系统**：`users.current_level` / `track`

**影响范围：** 31个文件，149处引用

---

## 迁移方案对比

### ❌ 方案A：数据库视图（不推荐）

**优点：** 零代码修改  
**缺点：** 
- 性能损失5-10%
- 触发器维护成本高
- 长期技术债务
- 数据同步可能出错

### ✅ 方案B：批量代码迁移（推荐）

**优点：**
- 无性能损失
- 代码清晰，易维护
- 彻底解决技术债务
- 一次性完成

**缺点：**
- 需要修改31个文件
- 需要充分测试

**结论：选择方案B，一次性彻底解决。**

---

## 迁移步骤

### 第1步：准备工作

```bash
cd /Users/alwan/code/qicheng/backend

# 1. 确保代码已提交
git status
git add .
git commit -m "feat: 准备迁移到新等级系统"

# 2. 创建迁移分支
git checkout -b feature/migrate-level-system

# 3. 运行数据库migrations
psql $DATABASE_URL -f migrations/078_level_track_system.sql
psql $DATABASE_URL -f migrations/079_jump_test_system.sql
psql $DATABASE_URL -f migrations/080_team_community_system.sql
psql $DATABASE_URL -f migrations/081_migrate_student_profiles_to_users.sql
```

### 第2步：执行自动迁移脚本

```bash
# 给脚本执行权限
chmod +x scripts/migrate_schema.py

# 执行迁移（会自动创建备份）
python3 scripts/migrate_schema.py
```

**脚本会自动：**
- 创建源代码备份
- 替换所有 `student_profiles` → `users`
- 替换所有 `level_a` → `current_level`
- 替换所有 `sp.` → `u.`
- 显示修改统计

### 第3步：手动检查特殊情况

有些复杂的SQL查询需要手动检查：

```bash
# 查找可能遗漏的引用
grep -r "level_a\|level_b\|student_profiles" src/ --include="*.ts" | grep -v "node_modules"
```

**需要特别注意的文件：**
1. `src/routes/student/controller.ts` - 25处引用
2. `src/services/invitation/activityService.ts` - 14处引用
3. `src/routes/ability/controller.ts` - 14处引用

### 第4步：修复OPC相关字段

OPC数据现在在 `student_capabilities` 表中：

```typescript
// 旧代码
const profile = await queryOne(`
  SELECT opc_openness, opc_persistence, opc_creativity
  FROM student_profiles WHERE user_id = $1
`, [userId]);

// 新代码
const profile = await queryOne(`
  SELECT sc.opc_openness, sc.opc_persistence, sc.opc_creativity
  FROM users u
  LEFT JOIN student_capabilities sc ON u.id = sc.student_id
  WHERE u.id = $1
`, [userId]);
```

### 第5步：编译和测试

```bash
# 1. TypeScript编译
npm run build

# 如果有编译错误，检查类型定义
# 2. 运行测试
npm test

# 3. 启动开发服务器
npm run dev

# 4. 手动测试关键功能
# - 学生注册
# - 任务列表（等级过滤）
# - 跳级申请
# - 组队创建
```

### 第6步：验证数据一致性

```sql
-- 检查所有学生都有等级和赛道
SELECT COUNT(*) FROM users WHERE role = 'student' AND (current_level IS NULL OR track IS NULL);
-- 应该返回 0

-- 检查student_capabilities初始化
SELECT COUNT(*) FROM users u
LEFT JOIN student_capabilities sc ON u.id = sc.student_id
WHERE u.role = 'student' AND sc.student_id IS NULL;
-- 应该返回 0

-- 检查等级分布
SELECT track, current_level, COUNT(*) 
FROM users 
WHERE role = 'student' 
GROUP BY track, current_level 
ORDER BY track, current_level;
```

### 第7步：提交代码

```bash
# 查看修改
git diff

# 提交
git add .
git commit -m "feat: 迁移到新等级系统

- 替换 student_profiles → users + student_capabilities
- 替换 level_a → current_level
- 更新31个文件，149处引用
- 所有测试通过
"

# 推送到远程
git push origin feature/migrate-level-system
```

---

## 常见问题处理

### Q1: 编译错误 - 类型不匹配

```typescript
// 错误：Property 'level_a' does not exist
interface StudentProfile {
  level_a: number;  // ❌
}

// 修复
interface StudentProfile {
  current_level: number;  // ✅
}
```

### Q2: SQL查询错误 - 表不存在

```sql
-- 错误：relation "student_profiles" does not exist
SELECT * FROM student_profiles WHERE user_id = $1

-- 修复：需要JOIN
SELECT u.*, sc.* 
FROM users u
LEFT JOIN student_capabilities sc ON u.id = sc.student_id
WHERE u.id = $1 AND u.role = 'student'
```

### Q3: 数据为NULL

```sql
-- 如果current_level为NULL，运行数据迁移
UPDATE users SET current_level = 0 WHERE role = 'student' AND current_level IS NULL;
UPDATE users SET track = 'content' WHERE role = 'student' AND track IS NULL;
```

### Q4: OPC数据找不到

```sql
-- 确保student_capabilities记录存在
INSERT INTO student_capabilities (student_id, skills, tasks_completed)
SELECT id, '{}'::jsonb, 0
FROM users
WHERE role = 'student'
  AND NOT EXISTS (SELECT 1 FROM student_capabilities WHERE student_id = users.id);
```

---

## 回滚方案

如果迁移出现严重问题：

```bash
# 1. 恢复代码
rm -rf src
mv src_backup_YYYYMMDD_HHMMSS src

# 2. 重新编译
npm run build

# 3. 重启服务
npm run dev

# 4. 回滚git
git reset --hard HEAD~1
```

---

## 验证清单

迁移完成后，逐项验证：

### ✅ 编译验证
- [ ] `npm run build` 无错误
- [ ] `npm run lint` 无错误
- [ ] TypeScript类型检查通过

### ✅ 功能验证
- [ ] 学生注册流程正常
- [ ] 学生登录后能看到任务列表
- [ ] 任务列表根据等级过滤（Lv.0只看到难度1）
- [ ] 跳级资格检查正常
- [ ] 跳级申请流程正常
- [ ] 组队创建需要Lv.6
- [ ] 组队加入需要Lv.5
- [ ] 社区帖子发布正常
- [ ] 管理后台学生列表正常

### ✅ 数据验证
- [ ] 所有学生都有`current_level`
- [ ] 所有学生都有`track`
- [ ] 所有学生都有`student_capabilities`记录
- [ ] 等级分布合理

### ✅ 性能验证
- [ ] 任务列表查询<100ms
- [ ] 学生详情查询<50ms
- [ ] 无慢查询告警

---

## 预计时间

| 步骤 | 预计时间 |
|------|---------|
| 准备工作 | 10分钟 |
| 执行脚本 | 5分钟 |
| 手动检查 | 30分钟 |
| 编译测试 | 20分钟 |
| 功能验证 | 30分钟 |
| 提交代码 | 5分钟 |
| **总计** | **1.5-2小时** |

---

## 总结

**推荐方案：批量代码迁移**

✅ 彻底解决技术债务  
✅ 无性能损失  
✅ 代码清晰易维护  
✅ 一次性完成  

**工作量：** 2小时  
**风险等级：** 中（有自动备份和回滚方案）  
**推荐指数：** ⭐⭐⭐⭐⭐
