# 学生成长数据闭环系统 - 技术规格验收清单

## 📋 验收说明

本文档用于验证系统是否按照《启程 · 成长数据生成 · 真实验收规格》实现。

每一项都必须通过验收，任何一项不通过视为"未完成"。

---

## 一、即时成长总结验收

### 1.1 字数验收

**测试方法**：
```sql
-- 查询最近10个成长总结
SELECT 
  id,
  order_id,
  summary_json->>'paragraph_1' as p1,
  summary_json->>'paragraph_2' as p2,
  summary_json->>'paragraph_3' as p3,
  LENGTH(summary_json->>'paragraph_1') + 
  LENGTH(summary_json->>'paragraph_2') + 
  LENGTH(summary_json->>'paragraph_3') as total_words
FROM growth_summary_cache
ORDER BY created_at DESC
LIMIT 10;
```

**验收标准**：
- ✅ 每条记录的 `total_words` 必须 ≥ 300
- ❌ 如果有任何一条 < 300，验收不通过

### 1.2 真实数据引用验收

**测试方法**：
随机选择3个学生的成长总结，检查以下内容：

```sql
-- 获取学生A的成长总结
SELECT 
  gsc.summary_json,
  o.title as project_name,
  o.client_rating,
  mgo.stuck_points
FROM growth_summary_cache gsc
JOIN orders o ON gsc.order_id = o.id
LEFT JOIN mentor_growth_observations mgo ON o.id = mgo.order_id
WHERE gsc.user_id = 'STUDENT_A_ID'
ORDER BY gsc.created_at DESC
LIMIT 1;
```

**验收标准**：
- ✅ `paragraph_1` 中必须包含 `project_name` 的内容
- ✅ `paragraph_2` 中必须引用 `stuck_points` 的内容
- ✅ 三个学生的总结内容必须明显不同（不能只是换了项目名）
- ❌ 如果出现"你做得很好""继续加油"等空话，验收不通过

### 1.3 结构完整性验收

**测试方法**：
```sql
SELECT 
  id,
  summary_json ? 'headline' as has_headline,
  summary_json ? 'paragraph_1' as has_p1,
  summary_json ? 'paragraph_2' as has_p2,
  summary_json ? 'paragraph_3' as has_p3,
  summary_json ? 'skills_demonstrated' as has_skills
FROM growth_summary_cache
ORDER BY created_at DESC
LIMIT 10;
```

**验收标准**：
- ✅ 所有字段都必须为 `true`
- ✅ `skills_demonstrated` 数组必须包含至少3个技能
- ❌ 任何字段缺失，验收不通过

---

## 二、六维能力更新验收

### 2.1 字数验收

**测试方法**：
```sql
-- 查询最近10个能力更新
SELECT 
  id,
  user_id,
  version,
  dimension_descriptions
FROM user_ability_profiles
WHERE dimension_descriptions IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

然后在代码中计算每个维度的字数：
```javascript
const profile = result.rows[0];
const dimensions = JSON.parse(profile.dimension_descriptions);
dimensions.forEach(dim => {
  const wordCount = dim.description.length;
  console.log(`${dim.dimension}: ${wordCount}字`);
});
```

**验收标准**：
- ✅ 每个维度的 `description` 字数必须 ≥ 100
- ✅ 六个维度总字数必须 ≥ 600
- ❌ 任何维度 < 100字，验收不通过

### 2.2 分数更新验收

**测试方法**：
```sql
-- 查看学生的能力版本历史
SELECT 
  version,
  information_processing,
  creative_drive,
  tool_learning,
  task_execution,
  collaboration_tendency,
  risk_attitude,
  updated_reason
FROM user_ability_profiles
WHERE user_id = 'STUDENT_ID'
ORDER BY version ASC;
```

**验收标准**：
- ✅ 每次更新后，至少有一个维度的分数发生变化
- ✅ 分数变化符合加权平均公式：新分数 = 旧分数×0.7 + 表现分×0.3
- ✅ 所有分数都在 0-100 范围内
- ❌ 如果连续两次更新分数完全相同，验收不通过

### 2.3 真实数据引用验收

**测试方法**：
查看某个维度的解读，检查是否引用了真实数据：

```sql
SELECT 
  uap.dimension_descriptions,
  o.title as project_name,
  o.client_rating,
  mgo.skills_observed
FROM user_ability_profiles uap
JOIN ability_dimension_history adh ON uap.user_id = adh.user_id AND uap.version = adh.profile_version
JOIN orders o ON adh.related_order_id = o.id
LEFT JOIN mentor_growth_observations mgo ON o.id = mgo.order_id
WHERE uap.user_id = 'STUDENT_ID' AND uap.is_current = true;
```

**验收标准**：
- ✅ "信息处理"的解读必须引用任务拆解相关的数据
- ✅ "工具学习"的解读必须引用具体的工具名称
- ✅ "任务执行"的解读必须引用按时交付或打回的数据
- ❌ 如果解读是泛泛而谈，没有具体数据，验收不通过

---

## 三、Lv.6毕业报告验收

### 3.1 总字数验收

**测试方法**：
```sql
-- 查询毕业报告
SELECT 
  id,
  user_id,
  full_content_json
FROM growth_reports
WHERE report_type = 'graduation'
ORDER BY created_at DESC
LIMIT 1;
```

然后在代码中计算总字数：
```javascript
const report = JSON.parse(result.rows[0].full_content_json);
let totalWords = 0;
report.chapters.forEach(chapter => {
  totalWords += chapter.word_count;
  console.log(`第${chapter.chapter_number}章: ${chapter.word_count}字`);
});
console.log(`总字数: ${totalWords}字`);
```

**验收标准**：
- ✅ 总字数必须 ≥ 8000字
- ✅ 第一章 ≥ 1500字
- ✅ 第二章 ≥ 2000字
- ✅ 第三章 ≥ 2000字
- ✅ 第四章 ≥ 1500字
- ✅ 第五章 ≥ 1000字
- ✅ 第六章 ≥ 1000字
- ❌ 任何一章不达标，验收不通过

### 3.2 第一章验收（成长轨迹）

**测试方法**：
查看第一章内容，检查是否包含：

```sql
-- 获取学生的所有订单
SELECT title, completed_at, student_price, client_rating
FROM orders
WHERE student_id = 'STUDENT_ID' AND status = 'completed'
ORDER BY completed_at ASC;
```

**验收标准**：
- ✅ 第一章必须按时间线列出至少3个真实项目名称
- ✅ 必须包含六维数据的变化趋势
- ✅ 必须提到总订单数、总收入、平均评分
- ❌ 如果只是泛泛描述"你完成了很多项目"，验收不通过

### 3.3 第二章验收（核心优势体系）

**测试方法**：
查看第二章内容，检查是否包含：

```sql
-- 获取学生的技能标签统计
SELECT 
  jsonb_array_elements_text(skills_observed->'skills') as skill,
  COUNT(*) as frequency
FROM mentor_growth_observations
WHERE student_id = 'STUDENT_ID'
GROUP BY skill
ORDER BY frequency DESC
LIMIT 10;
```

**验收标准**：
- ✅ 第二章必须列出Top 3核心技能
- ✅ 这些技能必须来自导师观察的真实记录
- ✅ 必须包含六维的深度解读（每个维度至少100字）
- ❌ 如果技能是编造的或泛泛的，验收不通过

### 3.4 第三章验收（OPC定位与市场机会）

**验收标准**：
- ✅ 必须推荐3个具体的OPC定位方向
- ✅ 每个方向必须有明确的市场描述和目标客户
- ✅ 定位方向必须基于学生的真实技能
- ❌ 如果定位是"内容创作者""设计师"这种泛泛的，验收不通过
- ✅ 正确示例："AI驱动的小红书品牌视觉顾问"

### 3.5 第四章验收（客户获取地图）

**验收标准**：
- ✅ 必须给出具体的线上渠道（如"小红书搜索'品牌设计'"）
- ✅ 必须给出具体的线下渠道（如"参加XX行业展会"）
- ✅ 必须给出具体的话术示例
- ❌ 如果只说"去小红书发内容"这种笼统建议，验收不通过

### 3.6 第五章验收（独立接单工具箱）

**测试方法**：
查看学生使用过的工具：

```sql
SELECT DISTINCT
  jsonb_array_elements_text(skills_observed->'tools') as tool
FROM mentor_growth_observations
WHERE student_id = 'STUDENT_ID';
```

**验收标准**：
- ✅ 必须列出至少5个具体的工具名称
- ✅ 这些工具必须来自学生的真实使用记录
- ✅ 必须包含工作流程SOP（至少4个步骤）
- ❌ 如果工具是编造的，验收不通过

### 3.7 第六章验收（从OPC到联合体）

**测试方法**：
查看学生的组队记录：

```sql
SELECT t.name, tm.role
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
WHERE tm.user_id = 'STUDENT_ID';
```

**验收标准**：
- ✅ 如果学生有组队记录，必须引用真实的队伍名称
- ✅ 如果没有组队记录，必须推荐具体的互补技能类型
- ✅ 必须给出共创项目的发起指南
- ❌ 如果只是泛泛而谈"找人合作"，验收不通过

---

## 四、AI调用参数验收

### 4.1 maxTokens验收

**测试方法**：
在代码中添加日志，记录每次AI调用的参数：

```typescript
console.log('[AI调用]', {
  type: '即时成长总结',
  maxTokens: 600,
  temperature: 0.7
});
```

**验收标准**：
- ✅ 即时成长总结：maxTokens = 600
- ✅ 六维解读：maxTokens = 1500（6个维度×200 + 其他）
- ✅ 毕业报告第一章：maxTokens = 2700（1800×1.5）
- ✅ 毕业报告第二章：maxTokens = 3300（2200×1.5）
- ✅ 毕业报告第三章：maxTokens = 3750（2500×1.5）
- ✅ 毕业报告第四章：maxTokens = 3000（2000×1.5）
- ✅ 毕业报告第五章：maxTokens = 2250（1500×1.5）
- ✅ 毕业报告第六章：maxTokens = 1800（1200×1.5）
- ❌ 任何一个不符合，验收不通过

### 4.2 temperature验收

**验收标准**：
- ✅ 即时成长总结：temperature = 0.7
- ✅ 六维解读：temperature = 0.5
- ✅ 毕业报告：根据章节不同，0.5-0.7
- ❌ 如果使用了错误的temperature，验收不通过

---

## 五、字数校验机制验收

### 5.1 自动重试验收

**测试方法**：
在代码中添加日志，记录重试情况：

```typescript
if (actualWordCount < 300 && retryCount === 0) {
  console.warn(`[字数不足] ${actualWordCount}字，重试生成...`);
  return this.callAI(data, 1);
}
```

**验收标准**：
- ✅ 当字数不足时，系统必须自动重试一次
- ✅ 重试时必须调整maxTokens（增加50%）
- ✅ 重试后仍不足，必须记录错误日志
- ❌ 如果没有重试机制，验收不通过

### 5.2 错误日志验收

**测试方法**：
查看系统日志，检查是否有字数不足的记录：

```bash
grep "字数不足" logs/app.log
```

**验收标准**：
- ✅ 必须有详细的错误日志
- ✅ 日志必须包含：实际字数、要求字数、订单ID
- ✅ 必须通知管理员（邮件/钉钉/Slack）
- ❌ 如果没有错误日志，验收不通过

---

## 六、端到端验收

### 6.1 完整流程验收

**测试步骤**：
1. 创建一个测试学生账号
2. 完成第1个订单
3. 检查是否生成了即时成长总结
4. 检查是否更新了六维能力
5. 完成第2-5个订单
6. 将学生等级提升到Lv.6
7. 检查是否生成了毕业报告

**验收标准**：
- ✅ 每个订单完成后，2分钟内生成成长总结
- ✅ 每个订单完成后，六维分数发生变化
- ✅ 达到Lv.6后，1小时内生成毕业报告
- ✅ 所有生成的内容都符合字数要求
- ✅ 所有生成的内容都引用了真实数据
- ❌ 任何一步失败，验收不通过

### 6.2 对比验收

**测试方法**：
找3个不同的学生，对比他们的成长总结和毕业报告。

**验收标准**：
- ✅ 三个学生的成长总结必须明显不同
- ✅ 三个学生的毕业报告必须明显不同
- ✅ 不能只是换了项目名称，其他内容一样
- ❌ 如果内容高度相似，验收不通过

---

## 七、性能验收

### 7.1 生成速度验收

**测试方法**：
记录每次生成的耗时：

```typescript
const startTime = Date.now();
await generateSummary(orderId);
const duration = Date.now() - startTime;
console.log(`生成耗时: ${duration}ms`);
```

**验收标准**：
- ✅ 即时成长总结：< 10秒
- ✅ 六维能力更新：< 15秒
- ✅ 毕业报告：< 120秒（2分钟）
- ❌ 超过时间限制，验收不通过

### 7.2 并发验收

**测试方法**：
同时完成10个订单，检查系统是否正常处理。

**验收标准**：
- ✅ 所有订单都能正常生成成长总结
- ✅ 没有出现数据库死锁
- ✅ 没有出现AI API限流错误
- ❌ 任何错误，验收不通过

---

## 八、验收报告模板

### 验收结果记录

| 验收项 | 状态 | 实际值 | 备注 |
|--------|------|--------|------|
| 即时总结字数 | ✅/❌ | XXX字 | |
| 即时总结数据引用 | ✅/❌ | | |
| 六维解读字数 | ✅/❌ | XXX字 | |
| 六维解读数据引用 | ✅/❌ | | |
| 毕业报告总字数 | ✅/❌ | XXX字 | |
| 毕业报告第一章 | ✅/❌ | XXX字 | |
| 毕业报告第二章 | ✅/❌ | XXX字 | |
| 毕业报告第三章 | ✅/❌ | XXX字 | |
| 毕业报告第四章 | ✅/❌ | XXX字 | |
| 毕业报告第五章 | ✅/❌ | XXX字 | |
| 毕业报告第六章 | ✅/❌ | XXX字 | |
| AI调用参数 | ✅/❌ | | |
| 字数校验机制 | ✅/❌ | | |
| 端到端流程 | ✅/❌ | | |
| 性能指标 | ✅/❌ | | |

### 验收结论

- [ ] **全部通过** - 系统符合技术规格，可以上线
- [ ] **部分通过** - 需要修复以下问题：___________
- [ ] **未通过** - 系统不符合技术规格，需要重新实现

### 验收人签字

- 验收人：___________
- 验收日期：___________
- 验收结果：___________

---

**重要提示**：
1. 所有验收项必须100%通过才能视为"完成"
2. 任何一项不通过，必须修复后重新验收
3. 验收过程中发现的问题必须记录在案
4. 验收通过后，才能进入生产环境

---

**最后更新**: 2026-05-27  
**文档版本**: 1.0  
**适用系统**: 学生成长数据闭环系统
