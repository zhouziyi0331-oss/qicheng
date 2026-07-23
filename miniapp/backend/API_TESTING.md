# 启程OPC后端 - API测试指南

## 🚀 快速开始

### 1. 启动服务
```bash
cd backend
npm install
npm run dev
```

### 2. 生成测试数据
```bash
# 基础数据（用户、实践项目等）
npm run seed

# 个性化系统数据（测评、雷达图、真实项目等）
npm run seed:personalized

# 生成所有测试数据
npm run seed:all
```

---

## 📝 API测试流程

### 第一步：获取Token

```bash
# 微信登录（开发模式自动生成用户）
curl -X POST http://localhost:3000/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test-code-123"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "xxx",
      "nickname": "测试用户"
    }
  }
}
```

**保存token到环境变量：**
```bash
export TOKEN="your-token-here"
```

---

## 🎯 个性化成长系统测试

### 1. OC测评

**提交测评**
```bash
curl -X POST http://localhost:3000/api/growth/assessment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "Q1", "answer": "A"},
      {"questionId": "Q2", "answer": "B"},
      {"questionId": "Q3", "answer": ["选项1", "选项2"]}
    ]
  }'
```

**获取最新测评**
```bash
curl http://localhost:3000/api/growth/assessment/latest \
  -H "Authorization: Bearer $TOKEN"
```

**获取测评历史**
```bash
curl http://localhost:3000/api/growth/assessments \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. 能力雷达图

**获取最新雷达图**
```bash
curl http://localhost:3000/api/growth/ability-radar/latest \
  -H "Authorization: Bearer $TOKEN"

# 响应示例
{
  "success": true,
  "data": {
    "snapshotNumber": 3,
    "triggerType": "project_completed",
    "dimensions": [
      {
        "name": "沟通表达力",
        "score": 75,
        "level": "中级",
        "growth": 5,
        "tags": ["清晰表达"]
      }
    ],
    "overallScore": 72,
    "rank": "进阶"
  }
}
```

**获取雷达图历史**
```bash
curl http://localhost:3000/api/growth/ability-radar \
  -H "Authorization: Bearer $TOKEN"
```

**对比两个雷达图**
```bash
curl "http://localhost:3000/api/growth/ability-radar/compare?snapshot1=1&snapshot2=3" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. 深度对比报告

**获取最新对比报告**
```bash
curl http://localhost:3000/api/growth/comparison-reports/latest \
  -H "Authorization: Bearer $TOKEN"

# 响应示例
{
  "success": true,
  "data": {
    "comparisonNumber": 2,
    "beforeSnapshot": {
      "type": "project",
      "overallScore": 65
    },
    "afterSnapshot": {
      "type": "project",
      "overallScore": 72
    },
    "analysis": {
      "dimensionChanges": [
        {
          "dimension": "沟通表达力",
          "beforeScore": 70,
          "afterScore": 78,
          "change": 8,
          "changePercent": "+11.4%",
          "evaluation": "沟通能力显著提升"
        }
      ],
      "newAbilities": ["项目管理"],
      "improvedAbilities": ["沟通表达", "执行力"],
      "overallGrowth": 7,
      "summary": "这段时间能力有显著提升",
      "recommendations": ["继续保持", "多做项目"]
    }
  }
}
```

**获取对比报告历史**
```bash
curl http://localhost:3000/api/growth/comparison-reports \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. 动态成长路径

**生成/更新成长路径**
```bash
curl -X POST http://localhost:3000/api/growth/growth-path/generate \
  -H "Authorization: Bearer $TOKEN"
```

**获取最新成长路径**
```bash
curl http://localhost:3000/api/growth/growth-path/latest \
  -H "Authorization: Bearer $TOKEN"

# 响应示例
{
  "success": true,
  "data": {
    "versionNumber": 3,
    "currentState": {
      "overallLevel": "进阶",
      "strongestAbilities": ["执行力", "逻辑思维"],
      "weakestAbilities": ["创新力"],
      "completedProjects": 5,
      "totalEarnings": 12500
    },
    "phases": [
      {
        "phaseNumber": 1,
        "phaseName": "能力巩固期",
        "goal": "提升执行力到80分",
        "duration": "1-2个月",
        "actions": [
          {
            "actionType": "do_project",
            "title": "接中等难度项目",
            "priority": "high"
          }
        ]
      }
    ],
    "predictions": {
      "expectedLevel": "熟练",
      "expectedTimeframe": "3-4个月",
      "expectedEarnings": 30000
    }
  }
}
```

**更新里程碑状态**
```bash
curl -X POST http://localhost:3000/api/growth/growth-path/milestone \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneTitle": "完成第一个真实项目",
    "completed": true
  }'
```

---

### 5. 毕业报告

**生成毕业报告**
```bash
curl -X POST http://localhost:3000/api/growth/graduation-report/generate \
  -H "Authorization: Bearer $TOKEN"
```

**获取毕业报告（预览）**
```bash
curl http://localhost:3000/api/growth/graduation-report \
  -H "Authorization: Bearer $TOKEN"

# 未解锁时返回预览
{
  "success": true,
  "data": {
    "isUnlocked": false,
    "preview": {
      "journeySummary": {
        "totalDays": 120,
        "assessmentCount": 3
      },
      "projectAchievements": {
        "totalProjects": 12,
        "clientSatisfaction": 4.7
      }
    },
    "message": "完整报告需要解锁"
  }
}
```

**解锁毕业报告**
```bash
curl -X POST http://localhost:3000/api/growth/graduation-report/unlock \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 真实项目系统测试

### 1. 浏览可接单项目

```bash
# 获取所有可用项目
curl http://localhost:3000/api/real-projects/available \
  -H "Authorization: Bearer $TOKEN"

# 按类别筛选
curl "http://localhost:3000/api/real-projects/available?category=UI设计" \
  -H "Authorization: Bearer $TOKEN"

# 按难度筛选
curl "http://localhost:3000/api/real-projects/available?difficulty=medium" \
  -H "Authorization: Bearer $TOKEN"

# 按预算筛选
curl "http://localhost:3000/api/real-projects/available?minBudget=2000&maxBudget=5000" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. 项目申请流程

**第1步：申请项目**
```bash
curl -X POST http://localhost:3000/api/real-projects/{projectId}/apply \
  -H "Authorization: Bearer $TOKEN"
```

**第2步：接受项目（开始工作）**
```bash
curl -X POST http://localhost:3000/api/real-projects/{projectId}/accept \
  -H "Authorization: Bearer $TOKEN"
```

**第3步：完成项目**
```bash
curl -X POST http://localhost:3000/api/real-projects/{projectId}/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliverables": [
      {
        "type": "design",
        "url": "https://example.com/design.pdf",
        "description": "UI设计稿"
      },
      {
        "type": "code",
        "url": "https://github.com/xxx",
        "description": "源代码"
      }
    ]
  }'

# 完成后自动触发：
# 1. 创建收入记录
# 2. 生成新的能力雷达图
# 3. 生成对比报告
# 4. 更新成长路径
```

### 3. 我的项目

**获取我的所有项目**
```bash
curl http://localhost:3000/api/real-projects/my/projects \
  -H "Authorization: Bearer $TOKEN"
```

**按状态筛选**
```bash
# 进行中的项目
curl "http://localhost:3000/api/real-projects/my/projects?status=in_progress" \
  -H "Authorization: Bearer $TOKEN"

# 已完成的项目
curl "http://localhost:3000/api/real-projects/my/projects?status=completed" \
  -H "Authorization: Bearer $TOKEN"
```

**获取项目统计**
```bash
curl http://localhost:3000/api/real-projects/my/stats \
  -H "Authorization: Bearer $TOKEN"

# 响应示例
{
  "success": true,
  "data": {
    "totalApplied": 10,
    "inProgress": 2,
    "completed": 8,
    "totalEarnings": 25600,
    "avgRating": 4.7
  }
}
```

**获取项目详情**
```bash
curl http://localhost:3000/api/real-projects/{projectId} \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💰 财务管理测试

### 1. 余额查询

```bash
curl http://localhost:3000/api/financial/balance \
  -H "Authorization: Bearer $TOKEN"

# 响应示例
{
  "success": true,
  "data": {
    "totalIncome": 25600,
    "totalWithdrawal": 10000,
    "availableBalance": 15600
  }
}
```

### 2. 收入记录

**获取收入记录**
```bash
# 所有收入
curl http://localhost:3000/api/financial/income \
  -H "Authorization: Bearer $TOKEN"

# 按来源筛选
curl "http://localhost:3000/api/financial/income?source=real_project" \
  -H "Authorization: Bearer $TOKEN"

# 分页
curl "http://localhost:3000/api/financial/income?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**获取收入统计**
```bash
curl http://localhost:3000/api/financial/income/stats \
  -H "Authorization: Bearer $TOKEN"

# 响应示例
{
  "success": true,
  "data": {
    "totalIncome": 25600,
    "totalCount": 8,
    "bySource": {
      "real_project": {
        "count": 8,
        "total": 25600
      }
    }
  }
}
```

### 3. 提现管理

**申请提现**
```bash
curl -X POST http://localhost:3000/api/financial/withdrawal/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000,
    "withdrawalMethod": "wechat",
    "withdrawalAccount": "wx123456789"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "amount": 2000,
    "fee": 20,
    "actualAmount": 1980,
    "status": "pending"
  },
  "message": "提现申请已提交，预计1-3个工作日到账"
}
```

**获取提现记录**
```bash
# 所有提现
curl http://localhost:3000/api/financial/withdrawal \
  -H "Authorization: Bearer $TOKEN"

# 按状态筛选
curl "http://localhost:3000/api/financial/withdrawal?status=completed" \
  -H "Authorization: Bearer $TOKEN"
```

**取消提现（仅pending状态）**
```bash
curl -X POST http://localhost:3000/api/financial/withdrawal/{withdrawalId}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 完整流程测试

### 场景1：新用户完整成长历程

```bash
# 1. 登录获取token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test-new-user"}' | jq -r '.data.token')

# 2. 完成第一次OC测评
curl -X POST http://localhost:3000/api/growth/assessment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "Q1", "answer": "A"}
    ]
  }'

# 3. 查看初始能力雷达图
curl http://localhost:3000/api/growth/ability-radar/latest \
  -H "Authorization: Bearer $TOKEN"

# 4. 浏览可接单项目
curl http://localhost:3000/api/real-projects/available \
  -H "Authorization: Bearer $TOKEN"

# 5. 申请一个简单项目
curl -X POST http://localhost:3000/api/real-projects/{projectId}/apply \
  -H "Authorization: Bearer $TOKEN"

# 6. 接受项目
curl -X POST http://localhost:3000/api/real-projects/{projectId}/accept \
  -H "Authorization: Bearer $TOKEN"

# 7. 完成项目（自动触发能力更新）
curl -X POST http://localhost:3000/api/real-projects/{projectId}/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliverables": [
      {"type": "design", "url": "https://example.com/file.pdf", "description": "设计稿"}
    ]
  }'

# 8. 查看新的能力雷达图
curl http://localhost:3000/api/growth/ability-radar/latest \
  -H "Authorization: Bearer $TOKEN"

# 9. 查看对比报告（测评 vs 项目1）
curl http://localhost:3000/api/growth/comparison-reports/latest \
  -H "Authorization: Bearer $TOKEN"

# 10. 查看更新后的成长路径
curl http://localhost:3000/api/growth/growth-path/latest \
  -H "Authorization: Bearer $TOKEN"

# 11. 查看余额
curl http://localhost:3000/api/financial/balance \
  -H "Authorization: Bearer $TOKEN"

# 12. 申请提现
curl -X POST http://localhost:3000/api/financial/withdrawal/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "withdrawalMethod": "wechat",
    "withdrawalAccount": "wx123456"
  }'
```

---

## 📊 系统监控测试

```bash
# 健康检查
curl http://localhost:3000/health

# 系统统计
curl http://localhost:3000/api/admin/stats

# 详细健康检查
curl http://localhost:3000/api/admin/health-check
```

---

## 🎯 验证个性化特性

### 验证点1：每个人的测评结果不同
```bash
# 创建多个用户，提交相同答案
# 验证：AI生成的身份标签应该有差异
```

### 验证点2：能力标签随项目动态更新
```bash
# 查看项目完成前的雷达图
curl http://localhost:3000/api/growth/ability-radar/latest -H "Authorization: Bearer $TOKEN"

# 完成项目
curl -X POST http://localhost:3000/api/real-projects/{id}/complete ...

# 查看项目完成后的雷达图（应该有新快照）
curl http://localhost:3000/api/growth/ability-radar/latest -H "Authorization: Bearer $TOKEN"
```

### 验证点3：对比报告规则
```bash
# 第1次对比报告：测评 vs 第1次项目
# 第2次对比报告：第2次项目 vs 第1次项目
curl http://localhost:3000/api/growth/comparison-reports -H "Authorization: Bearer $TOKEN"
```

### 验证点4：每个人的收入不同
```bash
# 查看用户A的余额
curl http://localhost:3000/api/financial/balance -H "Authorization: Bearer $TOKEN_A"

# 查看用户B的余额（应该不同）
curl http://localhost:3000/api/financial/balance -H "Authorization: Bearer $TOKEN_B"
```

---

## 💡 提示

1. **使用测试数据**：运行 `npm run seed:all` 生成完整测试数据
2. **保存Token**：将token保存为环境变量方便测试
3. **使用jq**：`brew install jq` 格式化JSON输出
4. **查看日志**：实时查看 `logs/combined.log`
5. **监控性能**：访问 `/api/admin/stats` 查看系统统计

---

**🎉 开始测试个性化动态系统！**
