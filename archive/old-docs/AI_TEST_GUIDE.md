# 启程平台 AI 功能测试指南

## 测试前准备

### 1. 配置环境变量

```bash
cd backend
cp .env.example .env

# 编辑 .env 文件
ANTHROPIC_API_KEY=sk-ant-xxx  # 填入真实的 API Key
NODE_ENV=production            # 使用生产模式启用AI
```

### 2. 启动服务

```bash
# 启动数据库
docker-compose up -d

# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

---

## 测试场景 1: 智能测评分析

**目标**: 验证AI能否根据不同答案生成不同的OPC标签和分析

### 步骤

1. 注册两个学生账号（手机号：13800000001, 13800000002）
2. 学生1：开放题回答强调"创意"、"设计"、"视觉"
3. 学生2：开放题回答强调"执行"、"效率"、"流程"
4. 完成测评后，检查结果

### 预期结果

- 学生1应该得到 `O-创意先锋` 或类似标签
- 学生2应该得到 `P-执行专家` 或类似标签
- 两人的 `analysis` 字段内容应该完全不同
- 六维评分应该有明显差异

### 验证方法

```sql
-- 查看测评结果
SELECT user_id, opc_label, d1_score, d2_score, d3_score, d4_score, d5_score, 
       LEFT(analysis, 100) as analysis_preview
FROM test_results
WHERE is_current = true
ORDER BY created_at DESC;
```

### 判断标准

✅ **真实AI**: 两个学生的 `analysis` 内容差异>80%，提到具体的答案内容  
❌ **模板化**: 两个学生的 `analysis` 内容相似>50%，只是替换了标签名

---

## 测试场景 2: 智能任务匹配

**目标**: 验证AI能否根据学生特质推荐不同任务

### 步骤

1. 使用上面两个不同OPC标签的学生账号
2. 分别登录，访问任务大厅
3. 查看推荐任务列表

### 预期结果

- O标签学生应该看到更多内容创作类任务
- P标签学生应该看到更多执行类任务
- 每个任务的 `match_reason` 应该提到学生的具体特质

### 验证方法

```bash
# 查看API响应
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/v1/tasks/recommended
```

### 判断标准

✅ **真实AI**: `match_reason` 提到学生的OPC标签、六维强项、历史任务  
❌ **模板化**: `match_reason` 只是通用描述，如"适合你的等级"

---

## 测试场景 3: 智能定价和要求梳理

**目标**: 验证AI能否根据任务描述智能定价

### 步骤

1. 注册企业账号，完成认证
2. 发布任务时，不填写金额（budgetGross留空）
3. 填写详细的任务描述，如：
   ```
   需要制作一个3分钟的AI工具测评视频，包括：
   1. 工具功能演示
   2. 使用体验分享
   3. 优缺点分析
   4. 适用场景推荐
   要求：画面清晰，配音专业，字幕准确
   ```
4. 提交任务

### 预期结果

- 系统应该返回建议金额（如 ¥350）
- 返回定价理由（如"内容创作需要创意，视频制作技术要求高"）
- 返回提取的关键要求列表
- 返回注意事项列表

### 验证方法

```bash
# 查看任务创建响应
# 应该包含 aiAnalysis 字段
{
  "success": true,
  "data": {
    "taskId": "xxx",
    "budgetNet": 297.5,
    "platformFee": 52.5,
    "aiAnalysis": {
      "requirements": ["需要视频制作能力", "需要AI工具使用经验"],
      "warnings": ["注意视频格式和分辨率", "确认工具版本"],
      "difficulty": 3,
      "pricingReason": "内容创作需要创意，技术要求高"
    }
  }
}
```

### 判断标准

✅ **真实AI**: 定价理由具体，要求列表准确提取任务描述中的关键点  
❌ **模板化**: 定价理由通用，要求列表只是关键词匹配

---

## 测试场景 4: 智能验收检测

**目标**: 验证AI能否判断任务提交是否合格

### 步骤

1. 学生接单并提交任务
2. 提交说明写得详细（100字以上）
3. 上传2-3个附件
4. 企业验收时，勾选"使用AI辅助验收"（useAiReview=true）

### 预期结果

- 系统返回AI评分（60-100）
- 返回是否合格判断（isQualified）
- 返回具体反馈（feedback）
- 返回问题列表（issues）
- 返回亮点列表（highlights）

### 验证方法

```bash
# 企业验收API
POST /api/v1/company/:taskId/approve
{
  "useAiReview": true
}

# 响应应该包含
{
  "success": true,
  "data": {
    "aiReview": {
      "score": 85,
      "isQualified": true,
      "issues": ["字幕有2处错别字"],
      "highlights": ["创意新颖", "配音专业"]
    }
  }
}
```

### 判断标准

✅ **真实AI**: 反馈具体，提到提交内容的细节  
❌ **模板化**: 反馈通用，如"提交内容符合要求"

---

## 测试场景 5: 六维动态更新

**目标**: 验证任务完成后六维评分是否动态更新

### 步骤

1. 记录学生完成任务前的六维评分
2. 完成一个内容创作任务（track_type='A'），企业给高分（≥85）
3. 完成一个工具开发任务（track_type='B'），企业给低分（<70）
4. 查看六维评分变化

### 预期结果

- 内容创作高分：d1(专业技能)、d4(需求理解)、d6(交付水平) 应该+2
- 工具开发低分：d1、d3(新工具上手)、d6 应该-1

### 验证方法

```sql
-- 查看六维评分变化
SELECT user_id, 
       six_dim_scores->>'d1' as d1,
       six_dim_scores->>'d2' as d2,
       six_dim_scores->>'d3' as d3,
       six_dim_scores->>'d4' as d4,
       six_dim_scores->>'d5' as d5,
       six_dim_scores->>'d6' as d6,
       task_count, total_earnings
FROM student_profiles
WHERE user_id = '<student_id>';

-- 查看任务历史
SELECT t.title, t.track_type, ts.company_score, ts.approved_at
FROM task_submissions ts
JOIN tasks t ON t.id = ts.task_id
WHERE ts.student_id = '<student_id>'
ORDER BY ts.approved_at DESC;
```

### 判断标准

✅ **真实动态**: 六维评分根据任务类型和评分有针对性变化  
❌ **静态数据**: 六维评分不变或所有维度同步变化

---

## 测试场景 6: OPC报告生成

**目标**: 验证AI能否生成个性化深度报告

### 步骤

1. 学生完成3-5个任务，有不同的评分和反馈
2. 购买OPC报告（支付¥99）
3. 查看生成的报告内容

### 预期结果

- 报告长度≥3000字
- 报告中提到具体的任务名称和表现
- 报告中提到学生的六维评分变化趋势
- 报告中有个性化的职业发展建议
- 报告中有结合市场痛点的创新建议

### 验证方法

```sql
-- 查看报告内容
SELECT id, student_id, 
       LEFT(content, 200) as content_preview,
       LENGTH(content) as content_length,
       created_at
FROM opc_reports
WHERE student_id = '<student_id>'
ORDER BY created_at DESC;
```

### 判断标准

✅ **真实AI**: 报告提到具体任务、具体评分、具体建议，内容差异化  
❌ **模板化**: 报告只是替换了OPC标签和分数，内容通用化

---

## 测试场景 7: 情绪信号检测

**目标**: 验证系统能否检测学生情绪状态

### 步骤

1. **冷却信号**: 学生7天不登录
2. **挫败信号**: 学生连续2次任务被拒
3. **兴奋信号**: 学生连续3次任务高分（≥85）

### 预期结果

- 系统自动插入情绪信号记录
- 推送相应的通知
- 个人主页显示情绪状态

### 验证方法

```sql
-- 查看情绪信号
SELECT user_id, signal_type, trigger_reason, created_at, resolved_at
FROM emotion_signals
WHERE user_id = '<student_id>'
ORDER BY created_at DESC;

-- 查看推送的通知
SELECT user_id, type, title, body, created_at
FROM notifications
WHERE user_id = '<student_id>'
  AND type = 'emotion_signal'
ORDER BY created_at DESC;
```

### 判断标准

✅ **正常工作**: 情绪信号准确触发，通知及时推送  
❌ **未工作**: 没有情绪信号记录

---

## 测试场景 8: 聊天内容过滤

**目标**: 验证系统能否过滤联系方式

### 步骤

1. 学生和企业在任务聊天中发送消息
2. 消息包含手机号、微信号、QQ号、邮箱
3. 查看消息是否被过滤

### 测试消息

```
我的手机号是13800138000
加我微信：wx123456
我的QQ是123456789
邮箱：test@example.com
```

### 预期结果

- 消息中的联系方式被替换为 `[已屏蔽]`
- 返回提示：`检测到联系方式，已自动屏蔽。完成2单后可解锁联系方式。`

### 验证方法

```sql
-- 查看聊天记录
SELECT sender_id, content, was_filtered, filter_notice, created_at
FROM chat_messages
WHERE task_id = '<task_id>'
ORDER BY created_at DESC;
```

### 判断标准

✅ **正常工作**: 联系方式被屏蔽，was_filtered=true  
❌ **未工作**: 联系方式原样显示

---

## 完整测试流程

### 1. 学生完整流程

```
注册 → 测评(AI分析) → 浏览任务(AI匹配) → 接单 → 提交 
→ 企业验收(AI检测) → 六维更新(AI计算) → 购买报告(AI生成)
```

### 2. 企业完整流程

```
注册 → 认证 → 发布任务(AI定价+要求梳理) → 学生接单 
→ 学生提交 → 验收(AI辅助) → 结算
```

### 3. 管理员完整流程

```
登录 → 审核企业 → 审核任务 → 查看数据 → 处理提现 
→ 广播通知 → 查看日志
```

---

## 性能测试

### API响应时间

```bash
# 测评分析（含AI）
time curl -X POST http://localhost:3001/api/v1/ai/analyze-test \
  -H "Content-Type: application/json" \
  -d '{"answers": [...], "userId": "xxx"}'
# 预期: 2-5秒

# 任务匹配（含AI）
time curl http://localhost:3001/api/v1/tasks/recommended \
  -H "Authorization: Bearer <token>"
# 预期: 1-3秒

# 报告生成（含AI）
time curl -X POST http://localhost:3001/api/v1/reports/generate \
  -H "Authorization: Bearer <token>"
# 预期: 5-10秒
```

---

## 日志检查

### 查看AI调用日志

```bash
cd backend

# 查看所有AI调用
grep "AI" logs/app.log | tail -20

# 查看降级日志（不应该出现）
grep "rule-based" logs/app.log

# 查看错误日志
grep "ERROR" logs/app.log | tail -20
```

---

## 常见问题

### Q1: AI功能没有工作，一直使用降级方案

**原因**: 
- `ANTHROPIC_API_KEY` 未配置或无效
- `NODE_ENV=development`（开发模式默认使用降级）

**解决**:
```bash
# 检查环境变量
echo $ANTHROPIC_API_KEY

# 设置生产模式
export NODE_ENV=production

# 重启服务
npm run dev
```

### Q2: AI响应太慢

**原因**: 
- 网络延迟
- API限流

**解决**:
- 使用更快的模型（claude-3-haiku）
- 减少prompt长度
- 添加缓存机制

### Q3: AI分析结果不准确

**原因**:
- Prompt设计不够精确
- 输入数据不完整

**解决**:
- 优化prompt，增加示例
- 确保传入完整的用户数据

---

## 测试检查清单

- [ ] 测评分析：不同答案得到不同OPC标签
- [ ] 任务匹配：不同学生看到不同推荐任务
- [ ] 智能定价：任务金额合理，有定价理由
- [ ] 要求梳理：准确提取任务关键要求
- [ ] 验收检测：给出具体反馈和评分
- [ ] 六维更新：根据任务表现动态变化
- [ ] 报告生成：内容个性化，提到具体任务
- [ ] 情绪检测：准确触发冷却/挫败/兴奋信号
- [ ] 内容过滤：联系方式被正确屏蔽
- [ ] 性能测试：API响应时间在预期范围
- [ ] 日志检查：无错误，AI正常调用

---

## 总结

通过以上测试场景，可以全面验证启程平台的AI功能是否真实工作、是否实现一对一精准分析。

**关键验证点**:
1. 相同输入 → 相同输出 = ❌ 模板化
2. 不同输入 → 不同输出 = ✅ 真实AI
3. 输出提到具体细节 = ✅ 深度分析
4. 输出通用描述 = ❌ 浅层分析
