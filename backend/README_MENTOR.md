# 🎓 AI导师系统 - 启程平台

**版本：** v1.0 (P0 + P1)  
**状态：** ✅ 生产就绪  
**完成日期：** 2026-05-27

---

## 📖 项目简介

启程平台AI导师系统增强项目，实现了6个核心功能，包括主动预警、长期记忆、风格自适应引导、范例展示、提交前自查和项目复盘。

### 核心功能

#### P0功能（已完成）✅
1. **主动预警系统**（T-06）- 4种预警类型，每15分钟自动扫描
2. **长期记忆系统** - AI生成画像摘要，跨订单记忆学生历史
3. **风格自适应引导** - 6种引导风格，动态Prompt注入

#### P1功能（已完成）✅
4. **范例展示**（T-02增强）- pgvector检索相似项目案例
5. **提交前自查**（T-07）- AI生成3个核心检查点
6. **项目复盘引导**（T-05增强）- 自动触发，精华提取

---

## 🚀 快速开始

### 方式1: 一键部署（推荐）

```bash
cd /Users/alwan/code/qicheng/backend

# 给脚本添加执行权限
chmod +x deploy_mentor_system.sh

# 运行部署脚本
./deploy_mentor_system.sh
```

### 方式2: 手动部署

查看 [快速启动指南](../AI_MENTOR_QUICK_START.md)

---

## ✅ 验证部署

```bash
# 给验证脚本添加执行权限
chmod +x verify_mentor_deployment.sh

# 运行验证脚本
./verify_mentor_deployment.sh
```

---

## 📚 完整文档

### 🎯 快速导航

| 文档 | 用途 | 阅读时间 |
|---|---|---|
| [📚 文档索引](../AI_MENTOR_DOCUMENTATION_INDEX.md) | 查找所有资源 | 2分钟 |
| [🚀 快速启动](../AI_MENTOR_QUICK_START.md) | 30分钟部署 | 5分钟 |
| [📖 完整总结](../AI_MENTOR_COMPLETE_SUMMARY.md) | 项目全貌 | 10分钟 |

### 📖 所有文档（10份）

1. [📚 文档索引](../AI_MENTOR_DOCUMENTATION_INDEX.md) - 快速查找所有资源
2. [🚀 快速启动指南](../AI_MENTOR_QUICK_START.md) - 30分钟快速部署
3. [📖 完整总结](../AI_MENTOR_COMPLETE_SUMMARY.md) - 了解项目全貌
4. [📘 P0部署指南](../AI_MENTOR_P0_DEPLOYMENT_GUIDE.md) - 详细部署步骤
5. [✅ P0测试清单](../AI_MENTOR_P0_TEST_CHECKLIST.md) - 50+测试点
6. [🔗 P0集成指南](../AI_MENTOR_P0_INTEGRATION_GUIDE.md) - 集成和故障排查
7. [📊 P0实现总结](../AI_MENTOR_P0_IMPLEMENTATION_SUMMARY.md) - P0技术架构
8. [📋 P0交付清单](../AI_MENTOR_P0_DELIVERY_CHECKLIST.md) - 验收标准
9. [📝 P1实现计划](../AI_MENTOR_P1_IMPLEMENTATION_PLAN.md) - P1实现方案
10. [📊 P1实现总结](../AI_MENTOR_P1_IMPLEMENTATION_SUMMARY.md) - P1技术架构

---

## 📁 项目结构

```
backend/
├── migrations/
│   ├── 085_mentor_enhancement_p0.sql          # P0数据库迁移
│   └── 086_mentor_enhancement_p1.sql          # P1数据库迁移
├── src/
│   ├── services/
│   │   ├── mentorAlertService.ts              # 主动预警服务
│   │   ├── mentorMemoryService.ts             # 长期记忆服务
│   │   ├── mentorExampleService.ts            # 范例展示服务
│   │   ├── mentorRetrospectiveService.ts      # 项目复盘服务
│   │   └── mentorCoreService.ts               # 核心对话服务（已增强）
│   ├── jobs/
│   │   ├── mentorAlertJob.ts                  # 预警定时任务
│   │   └── mentorRetrospectiveJob.ts          # 复盘定时任务
│   └── routes/
│       ├── mentorRoutes.ts                    # P0 API路由
│       └── mentorP1Routes.ts                  # P1 API路由
├── deploy_mentor_system.sh                    # 一键部署脚本
├── verify_mentor_deployment.sh                # 验证脚本
└── README_MENTOR.md                           # 本文档
```

---

## 🗄️ 数据库表

### 新增表（4张）

| 表名 | 说明 | 记录数 |
|---|---|---|
| `mentor_alert_rules` | 预警规则配置表 | 4条初始规则 |
| `mentor_alerts` | 预警记录表 | 动态增长 |
| `mentor_student_profile_cache` | 学生画像缓存表 | 等于学生数 |
| `mentor_retrospectives` | 项目复盘记录表 | 动态增长 |

### 扩展表（2张）

| 表名 | 新增字段 | 说明 |
|---|---|---|
| `mentor_growth_observations` | 3个字段 | 成长观察分类 |
| `mentor_sessions` | 2个触发类型 | 范例展示、复盘 |

---

## 🔌 API接口

### 学生端接口（11个）

```bash
# 预警相关
GET  /api/v1/mentor/alerts                    # 获取未读预警
POST /api/v1/mentor/alerts/:id/view           # 标记已读
POST /api/v1/mentor/alerts/:id/respond        # 标记已响应

# 画像相关
GET  /api/v1/mentor/profile                   # 获取学生画像
POST /api/v1/mentor/profile/refresh           # 刷新画像

# 对话相关
POST /api/v1/mentor/message                   # 发送消息
POST /api/v1/mentor/pre-submit-check          # 提交前自查
GET  /api/v1/mentor/sessions/:orderId         # 获取对话历史

# 复盘相关
GET  /api/v1/mentor/retrospectives/pending    # 获取待完成复盘
POST /api/v1/mentor/retrospectives/:id/submit # 提交复盘
POST /api/v1/mentor/retrospectives/:id/skip   # 跳过复盘
GET  /api/v1/mentor/retrospectives/history    # 历史复盘
```

### 管理员接口（6个）

```bash
# 预警管理
POST /api/v1/mentor/admin/trigger-alert-scan  # 手动触发扫描
GET  /api/v1/mentor/alerts/stats               # 预警统计

# 画像管理
POST /api/v1/mentor/admin/batch-init-profiles # 批量初始化

# 复盘管理
POST /api/v1/mentor/admin/batch-trigger-retrospectives # 批量触发
GET  /api/v1/mentor/admin/retrospective-stats  # 复盘统计
GET  /api/v1/mentor/admin/example-stats        # 范例统计
```

---

## 📊 监控指标

### 关键SQL查询

```sql
-- 预警统计（最近7天）
SELECT
  rule_type,
  COUNT(*) as total,
  COUNT(CASE WHEN student_viewed THEN 1 END) as viewed,
  ROUND(COUNT(CASE WHEN student_viewed THEN 1 END)::numeric / COUNT(*) * 100, 2) as view_rate
FROM mentor_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY rule_type;

-- 复盘统计（最近7天）
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / COUNT(*) * 100, 2) as completion_rate
FROM mentor_retrospectives
WHERE sent_at > NOW() - INTERVAL '7 days';

-- 学生画像覆盖率
SELECT
  COUNT(DISTINCT u.id) as total_students,
  COUNT(DISTINCT mspc.student_id) as has_profile,
  ROUND(COUNT(DISTINCT mspc.student_id)::numeric / COUNT(DISTINCT u.id) * 100, 2) as coverage_rate
FROM users u
LEFT JOIN mentor_student_profile_cache mspc ON u.id = mspc.student_id
WHERE u.role = 'student';
```

---

## 🐛 故障排查

### 常见问题

1. **定时任务未启动**
   ```bash
   # 检查日志
   tail -f logs/app.log | grep -E "MentorAlert|MentorRetrospective"
   
   # 手动触发
   curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
     -H "Authorization: Bearer <admin_token>"
   ```

2. **数据库表不存在**
   ```bash
   # 重新执行迁移
   psql -U qicheng_user -d qicheng_db -f migrations/085_mentor_enhancement_p0.sql
   psql -U qicheng_user -d qicheng_db -f migrations/086_mentor_enhancement_p1.sql
   ```

3. **API返回500错误**
   ```bash
   # 查看错误日志
   tail -100 logs/error.log
   
   # 检查环境变量
   cat .env | grep ANTHROPIC_API_KEY
   ```

更多问题查看：[P0集成指南 - 常见问题](../AI_MENTOR_P0_INTEGRATION_GUIDE.md#四常见问题处理)

---

## 📈 性能指标

| 指标 | 目标值 | 说明 |
|---|---|---|
| 预警扫描耗时 | <10秒 | 1000个订单 |
| 画像生成耗时 | <5秒 | 单个学生 |
| AI回复首字 | <2秒 | 流式输出 |
| 定时任务频率 | 15分钟/5分钟 | 预警/复盘 |

---

## 🎯 业务指标

| 指标 | 目标值 | 测量方法 |
|---|---|---|
| 预警查看率 | >60% | viewed / total |
| 预警响应率 | >40% | responded / total |
| 复盘完成率 | >60% | completed / sent |
| 画像覆盖率 | 100% | 所有学生 |

---

## 🔧 维护命令

```bash
# 查看实时日志
tail -f logs/app.log | grep Mentor

# 查看错误日志
tail -f logs/error.log

# 重启服务
pm2 restart qicheng-backend

# 查看进程
pm2 list

# 查看数据库状态
psql -U qicheng_user -d qicheng_db -c "\dt mentor_*"

# 手动触发预警扫描
curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"

# 手动触发复盘
curl -X POST http://localhost:3000/api/v1/mentor/admin/batch-trigger-retrospectives \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📞 获取帮助

### 文档资源

- 📚 [文档索引](../AI_MENTOR_DOCUMENTATION_INDEX.md) - 查找所有文档
- 🚀 [快速启动](../AI_MENTOR_QUICK_START.md) - 快速部署指南
- 🐛 [故障排查](../AI_MENTOR_P0_INTEGRATION_GUIDE.md#四常见问题处理) - 常见问题

### 快速链接

- 所有文档：`/Users/alwan/code/qicheng/AI_MENTOR_*.md`
- 所有代码：`/Users/alwan/code/qicheng/backend/src/`
- 数据库迁移：`/Users/alwan/code/qicheng/backend/migrations/`

---

## 📝 更新日志

### v1.0 (2026-05-27)

**P0功能：**
- ✅ 主动预警系统（4种预警类型）
- ✅ 长期记忆系统（AI生成画像）
- ✅ 风格自适应引导（6种风格）

**P1功能：**
- ✅ 范例展示（pgvector检索）
- ✅ 提交前自查（AI生成清单）
- ✅ 项目复盘引导（自动触发）

**交付物：**
- ✅ ~2900行生产级代码
- ✅ 10份完整文档
- ✅ 2个自动化脚本
- ✅ 18个API接口

---

## 👥 贡献者

- AI导师项目组
- 启程平台技术团队

---

## 📄 许可证

内部项目 - 启程平台

---

**最后更新：** 2026-05-27  
**文档版本：** v1.0  
**项目状态：** ✅ 生产就绪

开始使用吧！🚀
