# 启程平台语义匹配引擎 - 字段适配说明

## 问题总结

语义匹配系统的核心服务代码已完整实现，但存在数据库schema适配问题：

### 1. 字段不匹配问题

**users表**:
- ❌ 代码使用: `username`
- ✅ 实际字段: `nickname`
- 📍 影响文件: `vectorGenerationService.ts` (已修复)

**tasks表**:
- ❌ 代码使用: `required_skills` (数组)
- ✅ 实际字段: tasks表中没有专门的技能字段
- 📍 影响文件: `qichengTeacherService.ts`, `semanticMatchingEngine.ts`, `vectorGenerationService.ts`

### 2. 根本原因

语义匹配系统可能是从其他项目（AI项目导师平台）复用的代码，该项目的数据库schema与启程平台不同。

### 3. 解决方案

#### 方案A: 修改服务代码适配现有schema（推荐）
- 从`description`和`acceptance_criteria`字段中提取技能要求
- 使用AI分析文本内容识别所需技能
- 优点: 不改动数据库，利用现有数据
- 缺点: 需要修改多个服务文件

#### 方案B: 扩展tasks表schema
- 添加`required_skills JSONB`字段存储技能列表
- 优点: 结构化存储，查询效率高
- 缺点: 需要数据迁移，影响现有代码

#### 方案C: 创建技能关联表
- 新建`task_skills`关联表
- 优点: 规范化设计，便于技能管理
- 缺点: 增加表结构复杂度

## 已完成的修复

✅ **vectorGenerationService.ts**
- 第210-214行: `username` → `nickname`
- 第348-352行: `username` → `nickname`  
- 第374行: `username` → `nickname`

## 待修复文件

### qichengTeacherService.ts
需要修改的位置（约10处）:
- Line 143, 381, 446, 566, 617: 接口定义中的`required_skills`
- Line 149, 389, 453, 624, 671: SQL查询和prompt中的`required_skills`
- Line 506, 518, 591: INSERT/UPDATE语句中的`required_skills`

**建议修复方式**:
```typescript
// 原代码
required_skills: string[];
要求技能: ${task.required_skills?.join(', ') || '未指定'}

// 修改为
// 从description中提取技能，或者设为空数组
const extractedSkills: string[] = [];
要求技能: 从任务描述中分析
```

### semanticMatchingEngine.ts
需要修改的位置:
- Task接口定义中的`required_skills`
- SQL查询中对`required_skills`的引用

### vectorGenerationService.ts
- Line 169: Task接口中的`required_skills`
- Line 183: prompt中的技能要求

## 快速修复脚本

```bash
# 创建临时字段适配
cd /Users/alwan/code/qicheng/backend

# 1. 添加required_skills字段（可选）
cat > migrations/095_add_required_skills.sql << 'EOF'
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';
COMMENT ON COLUMN tasks.required_skills IS '任务要求的技能列表（临时字段，用于语义匹配）';
EOF

# 2. 运行迁移
node -e "
const { pool } = require('./dist/src/utils/db');
const fs = require('fs');
(async () => {
  const sql = fs.readFileSync('migrations/095_add_required_skills.sql', 'utf-8');
  await pool.query(sql);
  console.log('✅ 添加required_skills字段成功');
  await pool.end();
})();
"
```

## 测试验证

修复完成后运行：
```bash
npx ts-node scripts/testSemanticMatching.ts
```

预期结果：
- ✅ 任务向量生成成功
- ✅ 学生向量生成成功
- ✅ 启程老师翻译成功
- ✅ 6维度匹配计算成功
- ✅ Top 5学生匹配成功

## 生产环境建议

1. **短期方案**: 添加`required_skills`字段作为临时适配
2. **长期方案**: 重构代码使用AI从文本中提取技能，不依赖结构化字段
3. **最佳方案**: 创建独立的技能管理系统，统一管理任务技能和学生技能

## 时间估算

- 方案A (修改代码): 2-3小时
- 方案B (添加字段): 30分钟
- 方案C (关联表): 4-6小时

**建议**: 先用方案B快速验证系统，再逐步迁移到方案C。
