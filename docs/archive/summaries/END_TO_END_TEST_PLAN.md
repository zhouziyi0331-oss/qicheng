# 启程平台 - 端到端测试方案

**测试目标**: 验证完整的业务流程和数据联动  
**测试日期**: 2026-05-27  
**测试人**: Claude (Kiro AI)

---

## 📋 测试准备

### 1. 创建测试账号

#### 企业账号
- **账号名**: 测试企业A
- **行业**: 互联网
- **需求**: 发布2个测试任务

#### 学生账号1（视觉型）
- **账号名**: 测试学生-视觉型
- **OPC类型**: 视觉驱动、整合型思维
- **预期**: 推荐视觉设计类任务

#### 学生账号2（逻辑型）
- **账号名**: 测试学生-逻辑型
- **OPC类型**: 逻辑驱动、拆解型思维
- **预期**: 推荐功能开发类任务

---

## 🧪 测试场景

### 场景1: OPC测试→能力画像→任务推荐

**步骤**:
1. 学生1完成OPC测试（选择视觉型答案）
2. 检查数据库：
   - `opc_v2_results` 有记录
   - `user_ability_profiles` 生成六维画像
   - `student_capabilities` 同步数据
   - `student_work_condition_profiles` 生成工作画像
   - `combined_vector` 生成1024维向量
3. 企业发布视觉设计任务
4. 触发语义匹配
5. 验证学生1收到推荐（匹配分数高）

**预期结果**:
- ✅ OPC测试完成后，所有画像表都有记录
- ✅ 向量生成成功
- ✅ 学生1的推荐列表中有视觉设计任务
- ✅ 匹配分数 > 0.7

**验证SQL**:
```sql
-- 检查完整联动链
SELECT 
    'OPC结果' as step,
    COUNT(*) as count
FROM opc_v2_results WHERE student_id = '学生1ID'
UNION ALL
SELECT 'user_ability_profiles', COUNT(*)
FROM user_ability_profiles WHERE user_id = '学生1ID'
UNION ALL
SELECT 'student_capabilities', COUNT(*)
FROM student_capabilities WHERE student_id = '学生1ID'
UNION ALL
SELECT 'work_condition_profile', COUNT(*)
FROM student_work_condition_profiles WHERE student_id = '学生1ID'
UNION ALL
SELECT 'task_matches', COUNT(*)
FROM task_student_matches WHERE student_id = '学生1ID';
```

---

### 场景2: 任务接单→导师触发

**步骤**:
1. 学生1接受任务
2. 等待3秒
3. 检查数据库：
   - `mentor_stage_sessions` 有记录
   - `mentor_stage_messages` 有T-01开场白
   - `mentor_stage_triggers` 有触发记录
4. 验证AI调用日志

**预期结果**:
- ✅ 3秒后导师会话创建
- ✅ Claude API被调用
- ✅ 生成需求理解阶段的开场白
- ✅ 触发记录完整

**验证SQL**:
```sql
-- 检查导师触发
SELECT 
    mss.id,
    mss.current_stage,
    mss.created_at,
    COUNT(msm.id) as message_count
FROM mentor_stage_sessions mss
LEFT JOIN mentor_stage_messages msm ON mss.id = msm.session_id
WHERE mss.student_id = '学生1ID'
GROUP BY mss.id, mss.current_stage, mss.created_at;
```

---

### 场景3: 任务完成→能力更新→推荐变化

**步骤**:
1. 学生1完成任务
2. 设置任务状态为completed
3. 确保completed_at字段被设置
4. 触发成长数据更新
5. 检查数据库：
   - `growth_summary_cache` 有即时总结
   - `ability_dimension_history` 有能力变化记录
   - `user_ability_profiles` 版本号+1
   - `student_capabilities` 的tasks_completed+1
   - `combined_vector` 重新生成
6. 重新触发任务匹配
7. 对比推荐列表的变化

**预期结果**:
- ✅ 任务完成后，completed_at被设置
- ✅ 成长总结生成
- ✅ 能力画像更新（版本号+1）
- ✅ 向量重新生成
- ✅ 推荐列表发生变化

**验证SQL**:
```sql
-- 检查成长数据联动
SELECT 
    ta.task_id,
    ta.completed_at,
    gsc.id as has_summary,
    adh.id as has_history,
    uap.version,
    sc.tasks_completed,
    sc.updated_at
FROM task_assignments ta
LEFT JOIN growth_summary_cache gsc ON ta.task_id = gsc.task_id
LEFT JOIN ability_dimension_history adh ON ta.student_id = adh.user_id
LEFT JOIN user_ability_profiles uap ON ta.student_id = uap.user_id AND uap.is_current = true
LEFT JOIN student_capabilities sc ON ta.student_id = sc.student_id
WHERE ta.student_id = '学生1ID' AND ta.status = 'completed';
```

---

### 场景4: 等级提升→权限解锁

**步骤**:
1. 学生1完成多个任务（达到升级条件）
2. 触发等级提升
3. 检查数据库：
   - `student_profiles.level_a` 提升
   - 等级配置变化
4. 验证权限变化：
   - 任务难度范围扩大
   - 社区入口解锁（Lv.3+）
   - 组队功能解锁（Lv.4+）

**预期结果**:
- ✅ 等级提升成功
- ✅ 任务难度范围扩大
- ✅ 新功能解锁

**验证SQL**:
```sql
-- 检查等级和权限
SELECT 
    sp.level_a,
    sp.level_b,
    sp.track,
    sp.task_count,
    CASE 
        WHEN sp.level_a >= 3 THEN '✓ 社区已解锁'
        ELSE '✗ 社区未解锁'
    END as community_access,
    CASE 
        WHEN sp.level_a >= 4 THEN '✓ 组队已解锁'
        ELSE '✗ 组队未解锁'
    END as team_access
FROM student_profiles sp
WHERE sp.user_id = '学生1ID';
```

---

### 场景5: 双人对比测试

**步骤**:
1. 学生1（视觉型）和学生2（逻辑型）都完成OPC测试
2. 企业发布混合型任务（既需要设计又需要开发）
3. 触发语义匹配
4. 对比两个学生的：
   - 能力画像差异
   - 匹配分数差异
   - 推荐任务列表差异
   - 匹配理由差异

**预期结果**:
- ✅ 两个学生的能力画像明显不同
- ✅ 对同一任务的匹配分数不同
- ✅ 推荐任务列表有差异
- ✅ 匹配理由体现个性化

**验证SQL**:
```sql
-- 对比两个学生的匹配情况
SELECT 
    tsm.student_id,
    tsm.task_id,
    tsm.overall_score,
    tsm.skill_match_score,
    tsm.difficulty_match_score,
    tsm.domain_match_score,
    sc.personality_style,
    uap.personality_label
FROM task_student_matches tsm
JOIN student_capabilities sc ON tsm.student_id = sc.student_id
JOIN user_ability_profiles uap ON tsm.student_id = uap.user_id AND uap.is_current = true
WHERE tsm.task_id = '测试任务ID'
ORDER BY tsm.overall_score DESC;
```

---

## 📊 测试检查清单

### OPC测试→能力画像联动
- [ ] OPC测试完成
- [ ] opc_v2_results有记录
- [ ] user_ability_profiles生成
- [ ] student_capabilities同步
- [ ] student_work_condition_profiles生成
- [ ] combined_vector生成
- [ ] 向量维度正确（1024维）

### 导师系统联动
- [ ] 任务接单成功
- [ ] 3秒后导师触发
- [ ] mentor_stage_sessions创建
- [ ] mentor_stage_messages有开场白
- [ ] mentor_stage_triggers有记录
- [ ] Claude API被调用
- [ ] AI调用日志记录

### 成长数据联动
- [ ] 任务完成
- [ ] completed_at字段设置
- [ ] growth_summary_cache生成
- [ ] ability_dimension_history记录
- [ ] user_ability_profiles版本更新
- [ ] student_capabilities更新
- [ ] combined_vector重新生成

### 语义匹配引擎
- [ ] 任务向量生成
- [ ] 学生向量生成
- [ ] 6维度匹配计算
- [ ] task_student_matches记录
- [ ] 匹配分数合理（0-1之间）
- [ ] 匹配理由清晰

### 等级权限系统
- [ ] 等级提升成功
- [ ] 任务难度范围变化
- [ ] 社区入口解锁（Lv.3+）
- [ ] 组队功能解锁（Lv.4+）
- [ ] 平台费率变化

### 双人对比测试
- [ ] 两个学生OPC类型不同
- [ ] 能力画像差异明显
- [ ] 匹配分数有差异
- [ ] 推荐任务列表不同
- [ ] 个性化推荐生效

---

## 🔧 测试工具

### 1. 数据库查询脚本
```bash
# 快速检查所有联动状态
./verify_all_linkages.sh
```

### 2. API测试脚本
```bash
# 测试完整业务流程
./test_end_to_end.sh
```

### 3. 数据对比脚本
```bash
# 对比两个学生的推荐差异
./compare_students.sh 学生1ID 学生2ID
```

---

## 📝 测试报告模板

### 测试结果记录

**测试场景**: [场景名称]  
**测试时间**: [时间]  
**测试结果**: ✅ 通过 / ⚠️ 部分通过 / ❌ 失败

**详细结果**:
1. [步骤1] - ✅/❌
2. [步骤2] - ✅/❌
3. [步骤3] - ✅/❌

**发现的问题**:
- [问题描述]

**数据验证**:
```sql
[验证SQL和结果]
```

**截图/日志**:
- [相关截图或日志]

---

## ✅ 测试完成标准

所有测试场景通过，且满足以下条件：

1. ✅ 数据持久化：所有操作都有数据库记录
2. ✅ AI调用：AI服务被正确调用，有日志记录
3. ✅ 状态流转：状态变化正确，时间戳完整
4. ✅ 权限隔离：不同角色看到的数据正确隔离
5. ✅ 数据联动：源头数据变化后，下游数据正确更新
6. ✅ 个性化推荐：不同学生收到不同的推荐

---

**测试负责人**: Claude (Kiro AI)  
**测试日期**: 2026-05-27  
**测试状态**: 📋 **测试方案已完成，待执行**
