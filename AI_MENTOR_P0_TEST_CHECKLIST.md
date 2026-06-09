# AI导师P0功能测试验证清单

**版本：** v1.0  
**日期：** 2026-05-27  
**测试范围：** 主动预警系统、长期记忆系统、风格自适应引导

---

## 测试环境准备

### 前置条件
- [ ] 数据库迁移已执行（085_mentor_enhancement_p0.sql）
- [ ] 所有依赖已安装（node-cron, uuid, @anthropic-ai/sdk）
- [ ] 环境变量已配置（ANTHROPIC_API_KEY）
- [ ] 服务已重启
- [ ] 定时任务已启动

### 测试数据准备
```sql
-- 创建测试学生
INSERT INTO users (id, username, email, role, current_level) VALUES
('test-student-1', 'test_visual', 'visual@test.com', 'student', 2),
('test-student-2', 'test_logical', 'logical@test.com', 'student', 3);

-- 创建测试项目
INSERT INTO projects (id, title, description, required_level, deliverable_type) VALUES
('test-project-1', '品牌视觉设计', '为新品牌设计视觉识别系统', 2, 'design'),
('test-project-2', 'AI工作流开发', '开发自动化工作流', 5, 'code');

-- 创建测试订单
INSERT INTO orders (id, student_id, project_id, status, accepted_at, deadline_at) VALUES
('test-order-1', 'test-student-1', 'test-project-1', 'in_progress', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 days'),
('test-order-2', 'test-student-2', 'test-project-2', 'in_progress', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '1 day');

-- 创建测试画像（视觉型 vs 逻辑型）
INSERT INTO user_ability_profiles (user_id, six_dimensions, personality_tag, version) VALUES
('test-student-1', '{"creative_drive": 75, "collaboration_tendency": 60, "risk_attitude": 55}', '视觉创作者', 1),
('test-student-2', '{"creative_drive": 35, "collaboration_tendency": 45, "risk_attitude": 40}', '逻辑思考者', 1);
```

---

## 一、主动预警系统测试

### 1.1 等级跨度预警（level_gap）

**测试场景：** 学生接了高于当前等级2级的项目

**测试步骤：**
```sql
-- 1. 创建高难度订单
UPDATE orders SET project_id = 'test-project-2' 
WHERE id = 'test-order-1'; -- Lv.2学生接Lv.5项目

-- 2. 等待30分钟或手动触发扫描
```

```bash
# 手动触发扫描
curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"
```

**预期结果：**
```sql
-- 检查预警记录
SELECT * FROM mentor_alerts 
WHERE student_id = 'test-student-1' 
  AND rule_type = 'level_gap'
ORDER BY created_at DESC LIMIT 1;

-- 预期字段：
-- alert_message: "学生接了比当前等级高3级的项目..."
-- is_sent: true
-- trigger_data: {"level_gap": 3, "task_level": 5, "student_level": 2}
```

**验证点：**
- [ ] 预警记录已创建
- [ ] alert_message包含具体等级信息
- [ ] mentor_sessions中有对应记录（trigger_type='risk_alert'）
- [ ] 24小时内不重复发送

---

### 1.2 连续同类打回预警（repeated_rejection）

**测试场景：** 学生连续2次因同一问题被打回

**测试步骤：**
```sql
-- 1. 创建第一次提交（被打回）
INSERT INTO order_submissions (id, order_id, version, revision_feedback, ai_review_json) VALUES
('sub-1', 'test-order-1', 1, '配色不符合品牌要求', 
 '{"issues": [{"category": "配色问题", "description": "..."}]}');

-- 2. 创建第二次提交（再次被打回，同样问题）
INSERT INTO order_submissions (id, order_id, version, revision_feedback, ai_review_json) VALUES
('sub-2', 'test-order-1', 2, '配色还是不对', 
 '{"issues": [{"category": "配色问题", "description": "..."}]}');

-- 3. 手动触发扫描
```

**预期结果：**
```sql
SELECT * FROM mentor_alerts 
WHERE student_id = 'test-student-1' 
  AND rule_type = 'repeated_rejection'
ORDER BY created_at DESC LIMIT 1;

-- 预期：
-- alert_message: "学生连续2次被打回，都是因为配色问题..."
-- trigger_data: {"rejection_count": 2, "issue_category": "配色问题"}
```

**验证点：**
- [ ] 正确识别连续同类问题
- [ ] 预警消息包含具体问题类型
- [ ] 不同类型问题不触发预警

---

### 1.3 截止时间紧迫预警（deadline_pressure）

**测试场景：** 剩余时间不足30%且未提交

**测试步骤：**
```sql
-- 1. 修改订单截止时间（模拟紧迫情况）
UPDATE orders 
SET accepted_at = NOW() - INTERVAL '2 days',
    deadline_at = NOW() + INTERVAL '6 hours'
WHERE id = 'test-order-1';
-- 总时长：2天6小时，剩余6小时 = 25%

-- 2. 确保订单状态为in_progress（未提交）
UPDATE orders SET status = 'in_progress' WHERE id = 'test-order-1';

-- 3. 手动触发扫描
```

**预期结果：**
```sql
SELECT * FROM mentor_alerts 
WHERE student_id = 'test-student-1' 
  AND rule_type = 'deadline_pressure'
ORDER BY created_at DESC LIMIT 1;

-- 预期：
-- alert_message: "距离交付还有6小时，学生还没提交..."
-- trigger_data: {"hours_remaining": 6, "time_remaining_percent": 25}
```

**验证点：**
- [ ] 正确计算剩余时间百分比
- [ ] 已提交的订单不触发预警
- [ ] 12小时内不重复发送

---

### 1.4 方向偏差预警（direction_mismatch）

**测试场景：** AI-03检测到交付物与需求方向性偏差

**测试步骤：**
```sql
-- 1. 创建提交，AI审核结果显示方向偏差
INSERT INTO order_submissions (id, order_id, version, ai_review_json) VALUES
('sub-3', 'test-order-1', 3, 
 '{"mismatch_score": 0.8, "mismatch_type": "客户要品牌视觉升级，学生提交了社交媒体日常内容"}');

-- 2. 手动触发扫描
```

**预期结果：**
```sql
SELECT * FROM mentor_alerts 
WHERE student_id = 'test-student-1' 
  AND rule_type = 'direction_mismatch'
ORDER BY created_at DESC LIMIT 1;

-- 预期：
-- alert_message: "AI-03审核检测到交付物和需求有结构性偏差..."
-- trigger_data: {"mismatch_type": "...", "mismatch_score": 0.8}
```

**验证点：**
- [ ] 正确读取AI-03审核结果
- [ ] mismatch_score阈值判断正确（≥0.7）
- [ ] 预警消息包含具体偏差类型

---

### 1.5 定时任务测试

**测试步骤：**
```bash
# 1. 检查定时任务是否启动
tail -f logs/app.log | grep MentorAlertJob

# 2. 等待15分钟，观察是否自动扫描
# 预期日志：
# [MentorAlertJob] 开始执行预警扫描
# [MentorAlert] 找到 X 个进行中的订单
# [MentorAlert] 风险扫描完成
# [MentorAlertJob] 预警扫描完成，耗时 XXXms
```

**验证点：**
- [ ] 定时任务每15分钟执行一次
- [ ] 扫描耗时<5秒
- [ ] 无报错日志

---

## 二、长期记忆系统测试

### 2.1 画像生成测试

**测试场景：** 订单完成后自动生成学生画像

**测试步骤：**
```sql
-- 1. 创建成长观察记录（模拟历史数据）
INSERT INTO mentor_growth_observations (id, user_id, order_id, obs_type, obs_content, observation_category, breakthrough, observed_at) VALUES
('obs-1', 'test-student-1', 'test-order-1', 'stuck_point', '学生在配色上卡了3次', '配色', NULL, NOW() - INTERVAL '10 days'),
('obs-2', 'test-student-1', 'test-order-1', 'stuck_point', '学生在配色上卡了2次', '配色', NULL, NOW() - INTERVAL '5 days'),
('obs-3', 'test-student-1', 'test-order-1', 'skill_improvement', '学生独立解决了配色问题', NULL, '第4次配色时独立解决，没有求助', NOW() - INTERVAL '1 day');

-- 2. 完成订单
UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = 'test-order-1';

-- 3. 手动触发画像更新
```

```bash
curl -X POST http://localhost:3000/api/v1/mentor/profile/refresh \
  -H "Authorization: Bearer <student_token>"
```

**预期结果：**
```sql
SELECT * FROM mentor_student_profile_cache WHERE student_id = 'test-student-1';

-- 预期字段：
-- profile_summary: "该学生属于视觉创作者，擅长...历史高频卡点为配色，但最近已独立解决..."（200字内）
-- top_stuck_points: [{"category": "配色", "count": 2, "resolved": true}]
-- recent_breakthroughs: [{"description": "第4次配色时独立解决...", ...}]
-- guidance_style: {"style_type": "visual", "system_prompt_injection": "用视觉类比引导..."}
```

**验证点：**
- [ ] profile_summary长度150-200字
- [ ] top_stuck_points正确统计高频卡点
- [ ] recent_breakthroughs提取最近突破
- [ ] guidance_style根据六维画像生成

---

### 2.2 风格自适应测试

**测试场景：** 不同类型学生收到不同风格的引导

**测试步骤：**
```bash
# 1. 视觉型学生发送消息
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <visual_student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-1",
    "message": "我不知道怎么调配色"
  }'

# 2. 逻辑型学生发送消息
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <logical_student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-2",
    "message": "我不知道怎么调配色"
  }'
```

**预期结果：**

**视觉型学生收到的回复：**
> "试试把配色想象成一张海报的构图——主色调就像海报的背景，辅助色就像上面的文字和图标。你可以先找3个你觉得配色很舒服的设计作品，看看它们的颜色是怎么搭配的..."

**逻辑型学生收到的回复：**
> "配色可以分三步来做：第一步，确定主色调（品牌的核心颜色）；第二步，选择辅助色（通常是主色的邻近色或对比色）；第三步，添加点缀色（用于强调重点）。你现在卡在哪一步？"

**验证点：**
- [ ] 视觉型学生收到画面感类比
- [ ] 逻辑型学生收到结构化步骤
- [ ] 两者语气和引导方式明显不同

---

### 2.3 跨订单记忆测试

**测试场景：** AI回复中引用学生历史信息

**测试步骤：**
```bash
# 1. 确保学生已有画像（包含历史卡点）
# 2. 学生在新订单中遇到类似问题
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "new-order-id",
    "message": "我又在配色上卡住了"
  }'
```

**预期结果：**
> "我注意到你之前在配色上也卡过——上次你是在第4次尝试时独立解决的。这次的配色问题和上次有什么不同吗？"

**验证点：**
- [ ] AI回复引用了学生历史卡点
- [ ] 提到了具体的突破经历
- [ ] 引导学生对比当前和历史情况

---

### 2.4 成长观察记录测试

**测试场景：** 记录学生成长观察

**测试步骤：**
```bash
curl -X POST http://localhost:3000/api/v1/mentor/observations \
  -H "Authorization: Bearer <system_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "test-student-1",
    "orderId": "test-order-1",
    "observationType": "breakthrough",
    "content": "学生首次独立完成品牌配色方案，没有求助",
    "category": "配色",
    "isSignificant": true,
    "tags": ["配色", "独立解决", "品牌设计"]
  }'
```

**预期结果：**
```sql
SELECT * FROM mentor_growth_observations 
WHERE user_id = 'test-student-1' 
ORDER BY observed_at DESC LIMIT 1;

-- 预期：
-- obs_type: 'breakthrough'
-- observation_category: '配色'
-- is_significant: true
-- tags: ['配色', '独立解决', '品牌设计']
```

**验证点：**
- [ ] 记录成功创建
- [ ] 所有字段正确保存
- [ ] 可被画像更新流程读取

---

## 三、API接口测试

### 3.1 获取学生画像

```bash
curl -X GET http://localhost:3000/api/v1/mentor/profile \
  -H "Authorization: Bearer <student_token>"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "student_id": "test-student-1",
    "profile_summary": "该学生属于视觉创作者...",
    "top_stuck_points": [...],
    "recent_breakthroughs": [...],
    "ability_snapshot": {...},
    "work_patterns": {...},
    "guidance_style": {...},
    "last_updated": "2026-05-27T10:00:00Z"
  }
}
```

**验证点：**
- [ ] 返回200状态码
- [ ] 数据结构完整
- [ ] profile_summary不为空

---

### 3.2 获取未读预警

```bash
curl -X GET http://localhost:3000/api/v1/mentor/alerts \
  -H "Authorization: Bearer <student_token>"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-id",
        "rule_type": "level_gap",
        "alert_message": "学生接了比当前等级高3级的项目...",
        "created_at": "2026-05-27T10:00:00Z",
        "student_viewed": false
      }
    ],
    "count": 1
  }
}
```

**验证点：**
- [ ] 返回200状态码
- [ ] 只返回未读预警
- [ ] 按时间倒序排列

---

### 3.3 标记预警已读

```bash
curl -X POST http://localhost:3000/api/v1/mentor/alerts/<alert_id>/view \
  -H "Authorization: Bearer <student_token>"
```

**预期响应：**
```json
{
  "success": true,
  "message": "预警已标记为已读"
}
```

**验证点：**
- [ ] 返回200状态码
- [ ] 数据库中student_viewed=true
- [ ] viewed_at已更新

---

### 3.4 发送消息给导师

```bash
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-1",
    "message": "我卡住了"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "message": "消息已接收，AI导师正在思考...",
  "data": {
    "sessionId": "session-id"
  }
}
```

**验证点：**
- [ ] 返回202状态码（异步处理）
- [ ] 返回sessionId
- [ ] mentor_sessions中有学生消息记录

---

### 3.5 提交前自查

```bash
curl -X POST http://localhost:3000/api/v1/mentor/pre-submit-check \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-1",
    "submissionPreview": "我完成了品牌logo和配色方案"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "checklist": "在提交之前，先自查这三点：\n✅ 需求匹配度：客户的核心需求是品牌视觉识别系统...\n✅ 上次的问题解决了吗：上次被打回是因为配色不符合品牌要求...\n✅ 交付物完整性：客户要求的logo、配色方案、字体规范都包含了吗？"
  }
}
```

**验证点：**
- [ ] 返回200状态码（同步）
- [ ] 响应时间<3秒
- [ ] checklist包含3个检查点

---

## 四、集成测试

### 4.1 完整流程测试：从接单到完成

**测试步骤：**

1. **学生接单**
```sql
INSERT INTO orders (id, student_id, project_id, status, accepted_at, deadline_at) VALUES
('integration-order', 'test-student-1', 'test-project-2', 'accepted', NOW(), NOW() + INTERVAL '3 days');
-- Lv.2学生接Lv.5项目，触发等级跨度预警
```

2. **等待30分钟，检查预警**
```sql
SELECT * FROM mentor_alerts WHERE order_id = 'integration-order' AND rule_type = 'level_gap';
-- 预期：有1条预警记录
```

3. **学生查看预警**
```bash
curl -X GET http://localhost:3000/api/v1/mentor/alerts \
  -H "Authorization: Bearer <student_token>"
# 预期：返回等级跨度预警
```

4. **学生发送求助消息**
```bash
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "integration-order", "message": "这个项目太难了，我不知道从哪里开始"}'
# 预期：AI回复引用学生画像，提供视觉型引导
```

5. **学生提交作品**
```sql
INSERT INTO order_submissions (id, order_id, version, ai_review_json) VALUES
('integration-sub-1', 'integration-order', 1, '{"mismatch_score": 0.75, "mismatch_type": "方向偏差"}');
-- 触发方向偏差预警
```

6. **检查方向偏差预警**
```sql
SELECT * FROM mentor_alerts WHERE order_id = 'integration-order' AND rule_type = 'direction_mismatch';
-- 预期：有1条预警记录
```

7. **学生修改后再次提交**
```sql
INSERT INTO order_submissions (id, order_id, version) VALUES
('integration-sub-2', 'integration-order', 2);
```

8. **学生完成订单**
```sql
UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = 'integration-order';
-- 触发画像更新
```

9. **检查画像更新**
```sql
SELECT last_updated, update_trigger FROM mentor_student_profile_cache WHERE student_id = 'test-student-1';
-- 预期：last_updated为刚才的时间，update_trigger包含订单ID
```

**验证点：**
- [ ] 等级跨度预警正确触发
- [ ] AI回复包含学生画像信息
- [ ] 方向偏差预警正确触发
- [ ] 订单完成后画像自动更新
- [ ] 整个流程无报错

---

### 4.2 并发测试

**测试场景：** 多个学生同时发送消息

**测试步骤：**
```bash
# 使用ab或wrk进行并发测试
ab -n 100 -c 10 -T 'application/json' \
  -H "Authorization: Bearer <student_token>" \
  -p message.json \
  http://localhost:3000/api/v1/mentor/message

# message.json内容：
# {"orderId": "test-order-1", "message": "我卡住了"}
```

**验证点：**
- [ ] 所有请求返回202
- [ ] 无数据库死锁
- [ ] 无重复预警
- [ ] 响应时间<500ms

---

## 五、性能测试

### 5.1 预警扫描性能

**测试场景：** 1000个活跃订单的扫描性能

**测试步骤：**
```sql
-- 1. 创建1000个测试订单
INSERT INTO orders (id, student_id, project_id, status, accepted_at, deadline_at)
SELECT
  'perf-order-' || generate_series,
  'test-student-1',
  'test-project-1',
  'in_progress',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '2 days'
FROM generate_series(1, 1000);

-- 2. 手动触发扫描并计时
```

```bash
time curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"
```

**性能指标：**
- [ ] 扫描1000个订单耗时<10秒
- [ ] 内存占用<500MB
- [ ] CPU占用<50%

---

### 5.2 画像生成性能

**测试场景：** 批量初始化1000个学生画像

**测试步骤：**
```bash
# 1. 创建1000个测试学生
# 2. 批量初始化画像
time curl -X POST http://localhost:3000/api/v1/mentor/admin/batch-init-profiles \
  -H "Authorization: Bearer <admin_token>"
```

**性能指标：**
- [ ] 每个画像生成耗时<5秒
- [ ] 总耗时<1小时（1000个）
- [ ] 无内存泄漏

---

## 六、边界条件测试

### 6.1 空数据测试

**测试场景：** 新学生（无历史数据）

**测试步骤：**
```bash
# 1. 创建新学生（无订单、无画像）
# 2. 发送消息
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <new_student_token>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "new-order", "message": "你好"}'
```

**验证点：**
- [ ] 不报错
- [ ] AI回复使用基础Prompt（无长期记忆）
- [ ] 提示学生完成首单后会有个性化引导

---

### 6.2 异常数据测试

**测试场景：** 数据异常情况

**测试步骤：**
```sql
-- 1. 画像摘要为空
UPDATE mentor_student_profile_cache SET profile_summary = '' WHERE student_id = 'test-student-1';

-- 2. 六维画像缺失
UPDATE user_ability_profiles SET six_dimensions = '{}' WHERE user_id = 'test-student-1';

-- 3. 发送消息，验证降级处理
```

**验证点：**
- [ ] 不报错
- [ ] 使用默认风格（collaborative）
- [ ] 日志记录警告信息

---

## 七、测试总结

### 测试通过标准

**功能完整性：**
- [ ] 所有P0功能正常工作
- [ ] 所有API接口返回正确
- [ ] 所有预警类型正确触发

**性能指标：**
- [ ] 预警扫描<10秒（1000订单）
- [ ] AI回复<3秒（首字）
- [ ] 画像生成<5秒/个

**稳定性：**
- [ ] 无内存泄漏
- [ ] 无数据库死锁
- [ ] 无重复预警

**用户体验：**
- [ ] 预警消息准确、及时
- [ ] AI回复个性化、有针对性
- [ ] 风格自适应明显可感知

### 已知问题

| 问题 | 严重程度 | 状态 | 备注 |
|---|---|---|---|
| - | - | - | - |

### 测试签字

- 测试人员：__________
- 测试日期：__________
- 测试结果：□ 通过  □ 不通过
- 备注：__________
