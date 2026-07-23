# 🚀 启程OPC向量数据库系统 - 快速启动指南

## ✅ 当前状态

**所有代码已完成！OpenAI API Key已配置！**

标签导入正在后台运行中...

---

## 📋 启动步骤

### 1. 等待标签导入完成

**正在运行**：
```bash
# 当前任务：导入2000+标签
# 进程ID：8668
# 预计时间：10-20分钟
```

**检查进度**：
```bash
tail -f /private/tmp/claude-501/-Users-alwan/71aff56a-41e8-468b-8f1d-34bb400c847e/tasks/btq5h19sf.output
```

**完成标志**：
```
✓ 学生端标签导入完成
✓ 企业端标签导入完成
━━━━━━━━━━━━━━━━━━━━━━
  标签导入完成！
━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. 生成静态向量

**标签导入完成后，立即运行**：
```bash
cd /Users/alwan/code/qicheng/miniapp/backend
npm run vectors:generate-static
```

**这会生成**：
- 15个成就向量
- 10个职业向量
- 15个技能向量
- 5个导师建议向量

**预计时间**：2-3分钟

---

### 3. 启动后端服务

```bash
cd /Users/alwan/code/qicheng/miniapp/backend
npm run dev
```

---

### 4. 测试核心API

#### 测试1：任务拆解（最核心！）

```bash
curl -X POST http://localhost:3000/api/task-breakdown/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rawInput": "我要一个海报，宣传新产品",
    "industry": "美妆"
  }'
```

**预期返回**：
- 如果需要追问：`questions[]`
- 如果信息足够：`structuredTask + executionSteps + matchingTags`

---

#### 测试2：任务推荐（向量匹配）

```bash
curl http://localhost:3000/api/real-projects/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期返回**：
- 基于学生向量匹配的推荐项目
- 按匹配分数排序

---

#### 测试3：用户画像（向量驱动）

```bash
curl http://localhost:3000/api/profile/vector-state \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期返回**：
- 当前向量位置
- 成就状态（已解锁 + 进行中）
- 职业路径匹配
- 推荐项目
- 技能建议

---

#### 测试4：项目完成（触发向量更新）

```bash
curl -X POST http://localhost:3000/api/real-projects/:projectId/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "deliverables": ["海报源文件", "JPG导出"]
  }'
```

**预期返回**：
- 项目信息
- 成长报告（向量移动分析）
- 新解锁的成就
- 下一个推荐项目
- 职业路径更新
- 导师建议

---

## 🎯 核心功能

### 1. AI任务拆解 ⭐️

**企业发布任务流程**：
```
1. 企业输入："我要一个海报"
   ↓
2. AI追问：用途？受众？预算？
   ↓
3. AI拆解：清晰任务 + 执行步骤
   ↓
4. 匹配学生（向量距离）
```

**学生执行任务流程**：
```
1. 查看执行步骤（5个步骤）
   ↓
2. 执行某一步，需要帮助
   ↓
3. 调用 /step-guidance
   ↓
4. 获得详细指导（Markdown格式）
```

---

### 2. 向量匹配推荐

**工作原理**：
```
学生向量：[1536维]
项目向量：[1536维]
距离 = 匹配度

距离越小 = 越匹配
```

**自动更新**：
```
项目完成 → 学生向量移动 → 推荐自动更新
```

---

### 3. 成就自动解锁

**工作原理**：
```
成就向量：[1536维]
学生向量：[1536维]

distance < threshold → 解锁
progress = (1 - distance/threshold) * 100%
```

**显示效果**：
```
设计大师：✓ 已解锁（100%）
全栈开发者：75%（即将解锁）
```

---

## 📊 数据库状态检查

### 检查Qdrant

```bash
curl http://localhost:6333/collections
```

**预期返回7个Collections**：
- qicheng_tags
- qicheng_student_profiles
- qicheng_project_profiles
- qicheng_achievement_profiles
- qicheng_career_profiles
- qicheng_skill_profiles
- qicheng_mentor_advice

---

### 检查MongoDB

```bash
mongo qicheng_dev --eval "db.tags.countDocuments()"
```

**预期返回**：约2000个标签

---

## 🔧 常见问题

### Q1: 标签导入失败？

**检查日志**：
```bash
tail -100 /private/tmp/claude-501/-Users-alwan/71aff56a-41e8-468b-8f1d-34bb400c847e/tasks/btq5h19sf.output
```

**可能原因**：
- OpenAI API Key无效
- 网络问题
- MongoDB连接失败

---

### Q2: 向量匹配返回空？

**原因**：
- 学生向量未初始化
- 项目向量未生成

**解决**：
```bash
# 初始化学生向量
POST /api/vector-match/student/profile/initialize

# 或等待标签导入完成
```

---

### Q3: AI任务拆解报错？

**原因**：
- OpenAI API额度不足
- API Key权限不足

**检查**：
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-3873dfb51937f047bd2e2b86c2698f5871b0b829a791891d4d2dc0e192a81702"
```

---

## 📚 文档索引

1. **FINAL_DELIVERY_SUMMARY.md** - 最终交付总结
2. **TASK_BREAKDOWN_COMPLETE.md** - AI任务拆解详解 ⭐️
3. **VECTOR_REAL_APPLICATION_COMPLETE.md** - 向量真实应用
4. **VECTOR_CORE_REDESIGN.md** - 架构设计

---

## 🎉 完成标志

当你看到：
1. ✅ 标签导入完成（2000+个）
2. ✅ 静态向量生成完成（45个）
3. ✅ 后端服务运行
4. ✅ API测试成功

**整个系统就可以使用了！** 🚀

---

## 💰 费用估算

- 标签导入（2000个）：约$0.80
- 静态向量（45个）：约$0.05
- 每次任务拆解：约$0.01-0.02
- 每次步骤指导：约$0.01
- 每次向量更新：约$0.001

**总计初始化**：约$1
**日常使用**：每天约$0.5-1（假设100次调用）

---

**祝运行成功！** 🎊
