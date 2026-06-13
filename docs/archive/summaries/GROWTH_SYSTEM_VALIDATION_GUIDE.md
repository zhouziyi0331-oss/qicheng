# 学生成长数据闭环系统 - 完整验收执行指南

## 📋 验收流程概述

本指南提供完整的验收测试流程，确保系统100%符合技术规格。

---

## 🚀 快速开始

### 前置条件

1. ✅ PostgreSQL 14+ 已安装并运行
2. ✅ Node.js 16+ 已安装
3. ✅ 已配置 Claude API Key
4. ✅ 数据库连接配置正确

### 验收步骤

```bash
# 1. 进入后端目录
cd /Users/alwan/code/qicheng/backend

# 2. 安装依赖（如果还没安装）
npm install

# 3. 执行数据库Migration
psql $DATABASE_URL -f migrations/082_student_growth_data_loop.sql

# 4. 生成测试数据
npx ts-node src/scripts/generateTestData.ts

# 5. 执行验收测试
npx ts-node src/scripts/validateGrowthSystem.ts
```

---

## 📝 详细验收步骤

### 步骤1：执行数据库Migration

**目的**：创建所有必需的表、字段和视图

**命令**：
```bash
psql $DATABASE_URL -f migrations/082_student_growth_data_loop.sql
```

**预期输出**：
```
CREATE TABLE
CREATE INDEX
ALTER TABLE
CREATE VIEW
...
学生成长数据闭环系统 Migration 完成
```

**验证**：
```sql
-- 检查新表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ability_dimension_history',
  'growth_summary_cache',
  'graduation_report_payments'
);

-- 应该返回3行
```

**如果失败**：
- 检查数据库连接
- 检查是否有权限创建表
- 查看错误日志

---

### 步骤2：生成测试数据

**目的**：创建测试学生、订单，并生成成长总结和毕业报告

**命令**：
```bash
npx ts-node src/scripts/generateTestData.ts
```

**预期输出**：
```
🚀 开始生成测试数据

✅ 创建测试学生: uuid-xxx

✅ 创建初始能力画像

✅ 创建测试订单1: uuid-xxx
⏳ 生成即时成长总结...
✅ 成长总结生成完成

✅ 创建测试订单2: uuid-xxx
⏳ 生成即时成长总结...
✅ 成长总结生成完成

✅ 学生提升到Lv.6

⏳ 生成毕业报告（这可能需要1-2分钟）...
✅ 毕业报告生成完成: uuid-xxx

🎉 测试数据生成完成！
```

**耗时**：约2-3分钟（包含AI生成时间）

**如果失败**：
- 检查 Claude API Key 是否配置正确
- 检查网络连接
- 查看错误日志，可能是AI调用失败

---

### 步骤3：执行验收测试

**目的**：验证所有功能是否符合技术规格

**命令**：
```bash
npx ts-node src/scripts/validateGrowthSystem.ts
```

**预期输出**：
```
🚀 开始执行学生成长数据闭环系统验收测试

================================================================================
📊 1. 数据库结构验证
--------------------------------------------------------------------------------
   ✅ 表 ability_dimension_history 存在: ✅ 表已创建
   ✅ 表 growth_summary_cache 存在: ✅ 表已创建
   ✅ 表 graduation_report_payments 存在: ✅ 表已创建
   ✅ 字段 mentor_growth_observations.instant_summary 存在: ✅ 字段已添加
   ✅ 字段 user_ability_profiles.version 存在: ✅ 字段已添加
   ✅ 视图 student_growth_overview 存在: ✅ 视图已创建

📝 2. 即时成长总结验证
--------------------------------------------------------------------------------
   ✅ 成长总结 #1 字数验证: ✅ 字数达标 (456字)
   ✅ 成长总结 #1 结构完整性: ✅ 结构完整
   ✅ 成长总结 #2 字数验证: ✅ 字数达标 (423字)
   ✅ 成长总结 #2 结构完整性: ✅ 结构完整

   检查了 2 条成长总结
   ✅ 通过: 2 条
   ❌ 失败: 0 条

📊 3. 六维能力更新验证
--------------------------------------------------------------------------------
   ✅ 能力更新 #1 - 信息处理 字数: ✅ 123字
   ✅ 能力更新 #1 - 创作驱动 字数: ✅ 145字
   ✅ 能力更新 #1 - 工具学习 字数: ✅ 112字
   ✅ 能力更新 #1 - 任务执行 字数: ✅ 134字
   ✅ 能力更新 #1 - 协作倾向 字数: ✅ 108字
   ✅ 能力更新 #1 - 风险态度 字数: ✅ 119字
   ✅ 能力更新 #1 总字数: ✅ 741字

🎓 4. 毕业报告验证
--------------------------------------------------------------------------------
   ✅ 毕业报告 #1 总字数: ✅ 9234字
   ✅ 毕业报告 #1 第1章字数: ✅ 1623字
   ✅ 毕业报告 #1 第2章字数: ✅ 2145字
   ✅ 毕业报告 #1 第3章字数: ✅ 2234字
   ✅ 毕业报告 #1 第4章字数: ✅ 1678字
   ✅ 毕业报告 #1 第5章字数: ✅ 1123字
   ✅ 毕业报告 #1 第6章字数: ✅ 1431字

================================================================================
📋 验收报告
================================================================================

总测试数: 45
✅ 通过: 45
❌ 失败: 0
通过率: 100.0%

按类别统计:
  数据库结构: 10/10 (100.0%)
  即时成长总结: 4/4 (100.0%)
  六维能力更新: 14/14 (100.0%)
  毕业报告: 17/17 (100.0%)

================================================================================
🎉 验收结论: 全部通过！系统符合技术规格，可以上线。
================================================================================
```

---

## ✅ 验收标准

### 必须100%通过的项目

#### 1. 数据库结构（10项）
- [x] 3个新表已创建
- [x] 7个新字段已添加
- [x] 1个视图已创建

#### 2. 即时成长总结（每条2项）
- [x] 字数 ≥ 300字
- [x] 结构完整（包含所有必需字段）

#### 3. 六维能力更新（每次7项）
- [x] 每个维度字数 ≥ 100字
- [x] 总字数 ≥ 600字

#### 4. 毕业报告（每份7项）
- [x] 总字数 ≥ 8000字
- [x] 第1章 ≥ 1500字
- [x] 第2章 ≥ 2000字
- [x] 第3章 ≥ 2000字
- [x] 第4章 ≥ 1500字
- [x] 第5章 ≥ 1000字
- [x] 第6章 ≥ 1000字

---

## 🔍 手动验证（可选）

### 验证1：检查成长总结内容质量

```sql
-- 查看最新的成长总结
SELECT 
  summary_json->>'headline' as headline,
  summary_json->>'paragraph_1' as p1,
  summary_json->>'paragraph_2' as p2,
  summary_json->>'paragraph_3' as p3
FROM growth_summary_cache
ORDER BY created_at DESC
LIMIT 1;
```

**检查清单**：
- [ ] 是否提到了真实的项目名称？
- [ ] 是否引用了具体的卡点？
- [ ] 是否有"你做得很好"等空话？
- [ ] 内容是否具体、可验证？

### 验证2：检查六维解读内容质量

```sql
-- 查看最新的六维解读
SELECT 
  dimension_descriptions
FROM user_ability_profiles
WHERE dimension_descriptions IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

**检查清单**：
- [ ] 每个维度是否引用了具体数据？
- [ ] 是否说明了分数变化的原因？
- [ ] 是否有空话？

### 验证3：检查毕业报告内容质量

```sql
-- 查看毕业报告第一章
SELECT 
  full_content_json->'chapters'->0->'content' as chapter1
FROM growth_reports
WHERE report_type = 'graduation'
ORDER BY created_at DESC
LIMIT 1;
```

**检查清单**：
- [ ] 第一章是否列出了真实项目名称？
- [ ] 是否按时间线叙事？
- [ ] 是否包含六维变化趋势？

---

## 🐛 常见问题排查

### 问题1：AI生成字数不足

**症状**：验收测试显示字数不足

**原因**：
- maxTokens设置太低
- AI返回内容被截断
- 网络问题导致响应不完整

**解决方案**：
1. 检查服务代码中的maxTokens设置
2. 查看AI调用日志
3. 重新生成测试数据

### 问题2：数据库Migration失败

**症状**：执行migration时报错

**原因**：
- 表已存在
- 权限不足
- 数据库版本不兼容

**解决方案**：
```sql
-- 检查表是否已存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 如果需要重新执行，先删除
DROP TABLE IF EXISTS ability_dimension_history CASCADE;
DROP TABLE IF EXISTS growth_summary_cache CASCADE;
DROP TABLE IF EXISTS graduation_report_payments CASCADE;

-- 然后重新执行migration
```

### 问题3：Claude API调用失败

**症状**：生成测试数据时报错

**原因**：
- API Key无效
- 网络问题
- API限流

**解决方案**：
1. 检查API Key配置
```bash
echo $ANTHROPIC_API_KEY
```

2. 测试API连接
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

3. 如果限流，等待几分钟后重试

---

## 📊 验收报告模板

### 验收执行记录

| 项目 | 执行时间 | 结果 | 备注 |
|------|----------|------|------|
| 数据库Migration | YYYY-MM-DD HH:mm | ✅/❌ | |
| 生成测试数据 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 执行验收测试 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 手动验证 | YYYY-MM-DD HH:mm | ✅/❌ | |

### 验收结果

- **总测试数**: ___
- **通过数**: ___
- **失败数**: ___
- **通过率**: ___%

### 分类统计

- **数据库结构**: ___/10 (___%)
- **即时成长总结**: ___/___ (___%)
- **六维能力更新**: ___/___ (___%)
- **毕业报告**: ___/___ (___%)

### 验收结论

- [ ] ✅ **全部通过** - 系统符合技术规格，可以上线
- [ ] ⚠️  **部分通过** - 需要修复以下问题：___________
- [ ] ❌ **未通过** - 系统不符合技术规格，需要重新实现

### 验收人签字

- **验收人**: ___________
- **验收日期**: ___________
- **验收结果**: ___________

---

## 🎯 验收通过后的下一步

### 1. 集成到生产环境

```bash
# 1. 在生产数据库执行migration
psql $PRODUCTION_DATABASE_URL -f migrations/082_student_growth_data_loop.sql

# 2. 部署后端代码
npm run build
npm run start

# 3. 配置API路由（参考集成指南）
```

### 2. 监控指标设置

```typescript
// 设置监控告警
- 字数不足率 > 5% → 告警
- AI调用失败率 > 10% → 告警
- 生成耗时 > 30秒 → 告警
```

### 3. 用户培训

- 向运营团队说明新功能
- 准备用户使用文档
- 设置客服FAQ

---

## 📚 相关文档

1. **技术规格** - 《启程 · 成长数据生成 · 真实验收规格》
2. **修复报告** - `GROWTH_SYSTEM_FIX_REPORT.md`
3. **验收清单** - `GROWTH_SYSTEM_ACCEPTANCE_CHECKLIST.md`
4. **集成指南** - `GROWTH_SYSTEM_INTEGRATION_GUIDE.md`
5. **架构设计** - `GROWTH_SYSTEM_ARCHITECTURE.md`

---

**最后更新**: 2026-05-27  
**文档版本**: 1.0  
**验收状态**: ⏳ 待执行
