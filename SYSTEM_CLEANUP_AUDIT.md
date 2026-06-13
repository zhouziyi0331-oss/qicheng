# 启程平台系统清理审查报告

**生成时间**: 2026-06-13  
**审查范围**: 逻辑闭环 + 前端缺失 + 冗余清理

---

## 一、逻辑闭环问题检查清单

### 1.1 学生升级后的联动逻辑

| 检查项 | 当前状态 | 问题 | 修复方案 |
|---|---|---|---|
| **数据库触发器** | ✅ 已实现 | migration 118有`on_student_level_change`触发器 | - |
| **触发器功能** | ✅ 完整 | 升级时记录到`student_level_changes`表 + 发送pg_notify | - |
| **后端监听** | ⚠️ 待验证 | 需确认是否有worker监听`student_level_changed`事件 | 检查`matchingWorker.ts`是否监听此通知 |
| **重新匹配** | ⚠️ 待验证 | 触发器发送通知后，是否真实触发匹配重算 | 验证`matchingQueue`是否收到`recalculate-matches`任务 |
| **企业端推送** | ⚠️ 待验证 | 关注该学生的企业是否收到等级变更通知 | 检查`company_student_follows`表联动逻辑 |
| **学生端UI更新** | ⚠️ 待验证 | 学生主页等级是否实时更新 | 前端需监听WebSocket或轮询刷新 |

**关键代码位置**:
- 触发器: `backend/migrations/118_cross_platform_integration.sql:488-503`
- 匹配服务: `backend/src/services/crossPlatformService.ts`
- Worker: `backend/src/workers/matchingWorker.ts`

---

### 1.2 任务状态变更的通知闭环

| 状态变更 | 应触发的动作 | 当前状态 | 缺失项 |
|---|---|---|---|
| **pending → accepted** | 企业收到"学生已接单"通知 | ⚠️ 待验证 | 检查`notificationQueue`是否推送 |
| **accepted → in_progress** | 双方看到"进行中"状态 | ⚠️ 待验证 | - |
| **in_progress → submitted** | 企业收到"学生已提交"通知 + AI审核结果 | ⚠️ 待验证 | AI审核结果是否真实调用 |
| **submitted → completed** | 学生收到"企业已确认"通知 + 收入到账 | ⚠️ 待验证 | 收入结算逻辑是否联动 |
| **submitted → revision_requested** | 学生收到"需修改"通知 + AI修改建议 | ⚠️ 待验证 | AI修改建议是否生成 |
| **超时未处理** | 自动取消或自动确认 | ❌ 未实现 | 需要定时任务检查超时订单 |

**缺失功能**:
1. 企业48小时未确认交付 → 自动确认
2. 任务超过截止时间 → 自动标记过期
3. 申请接单后24小时企业未确认 → 自动取消申请

---

### 1.3 画像更新后的数据同步

| 检查项 | 当前状态 | 问题 | 修复方案 |
|---|---|---|---|
| **旧画像标记** | ⚠️ 待验证 | 新画像生成后，旧画像的`is_current`是否设为false | 检查`user_ability_profiles`表更新逻辑 |
| **匹配基于最新画像** | ⚠️ 待验证 | AI-02匹配时是否读取`is_current=true`的画像 | 检查`semanticMatchingEngine.ts`查询条件 |
| **学生主页更新** | ⚠️ 待验证 | 主页显示的能力标签是否来自最新画像 | 前端API是否过滤`is_current=true` |
| **企业端刷新** | ❌ 未实现 | 关注该学生的企业是否收到"画像已更新"推送 | 需添加推送逻辑 |

---

### 1.4 双向互动的闭环缺失

| 场景 | 缺失的逻辑 | 优先级 |
|---|---|---|
| **企业定向指定学生，学生拒绝** | 学生无拒绝入口；拒绝后企业不知道 | P0 |
| **学生申请接单后企业一直不确认** | 无超时自动取消机制 | P0 |
| **企业发布任务后无人接单** | 无自动提醒或调整机制 | P1 |
| **学生连续被打回** | 无风控介入机制 | P1 |
| **解锁联系方式后在哪里查看** | 前端无展示位置 | P0 |

---

### 1.5 数据一致性问题

需要执行的验证SQL：

```sql
-- 验证1: 学生累计收入一致性
SELECT u.id, u.username, u.total_income,
       COALESCE(SUM(o.student_income), 0) AS calculated_income
FROM users u
LEFT JOIN orders o ON o.student_id = u.id AND o.status = 'completed'
GROUP BY u.id, u.username, u.total_income
HAVING u.total_income != COALESCE(SUM(o.student_income), 0)
LIMIT 10;

-- 验证2: 学生完成订单数一致性
SELECT u.id, u.username, u.completed_orders,
       COUNT(o.id) AS actual_completed
FROM users u
LEFT JOIN orders o ON o.student_id = u.id AND o.status = 'completed'
GROUP BY u.id, u.username, u.completed_orders
HAVING u.completed_orders != COUNT(o.id)
LIMIT 10;

-- 验证3: 任务已接单人数一致性
SELECT t.id, t.title, t.slots_taken,
       COUNT(o.id) AS actual_taken
FROM tasks t
LEFT JOIN orders o ON o.task_id = t.id 
  AND o.status IN ('accepted', 'in_progress', 'submitted')
GROUP BY t.id, t.title, t.slots_taken
HAVING t.slots_taken != COUNT(o.id)
LIMIT 10;

-- 验证4: 画像is_current唯一性
SELECT student_id, COUNT(*) as current_count
FROM user_ability_profiles
WHERE is_current = true
GROUP BY student_id
HAVING COUNT(*) > 1;
```

---

## 二、前端页面缺失检查清单

### 2.1 学生端页面完整性

**当前统计**: 学生端有90个`.tsx`文件

| 页面类型 | 应有页面 | 文件存在 | 真实可用 | 缺失项 |
|---|---|---|---|---|
| **核心流程** | | | | |
| 注册/登录 | ✅ | ✅ | ⚠️ | 待测试 |
| 能力问卷(25题) | ✅ | ⚠️ | ⚠️ | 确认是否25题完整版 |
| 画像报告页 | ✅ | ✅ | ⚠️ | 确认7大模块是否完整 |
| 推荐任务列表 | ✅ | ✅ (`tasks/recommended.tsx`) | ⚠️ | 匹配分数和理由展示 |
| 任务详情 | ✅ | ✅ (`tasks/detail.tsx`) | ⚠️ | 启程老师翻译模块 |
| 任务大厅 | ✅ | ✅ (`tasks/hall.tsx`) | ⚠️ | - |
| 接单确认 | ⚠️ | ⚠️ | ❌ | 可能缺失独立确认页 |
| **进行中** | | | | |
| 我的任务 | ✅ | ✅ (`my-tasks/index.tsx`) | ⚠️ | 状态筛选 |
| 任务工作区 | ✅ | ✅ (`tasks/working.tsx`) | ⚠️ | 进度展示 |
| 提交交付物 | ✅ | ✅ (`tasks/submit.tsx`) | ⚠️ | AI预审核展示 |
| AI导师对话 | ✅ | ✅ (`chat-detail/index.tsx`) | ⚠️ | 流式输出 |
| **成长** | | | | |
| 成长报告列表 | ✅ | ✅ (`reports/index.tsx`) | ⚠️ | - |
| 成长报告详情 | ✅ | ✅ (`reports/detail.tsx`) | ⚠️ | AI生成内容 |
| 跳级挑战 | ✅ | ✅ (`jump-level/index.tsx`) | ⚠️ | - |
| 成长挑战 | ✅ | ✅ (`growth-challenges/index.tsx`) | ⚠️ | - |
| **其他** | | | | |
| 我的主页 | ✅ | ⚠️ | ⚠️ | 确认是否有对外展示版 |
| 我的钱包 | ✅ | ✅ (`my-wallet/index.tsx`) | ⚠️ | 提现功能 |
| 我的评分 | ✅ | ✅ (`my-ratings/index.tsx`) | ⚠️ | - |
| 邀请记录 | ✅ | ✅ (`invitations/index.tsx`) | ⚠️ | - |

**需要重点检查的页面**:
1. `pages/tasks/recommended.tsx` - 推荐任务是否显示匹配分数
2. `pages/tasks/detail.tsx` - 是否有"启程老师帮你理解"模块
3. `pages/tasks/submit.tsx` - 是否有AI预审核结果展示
4. `pages/chat-detail/index.tsx` - AI导师回复是否真实调用API

---

### 2.2 企业端页面完整性

**当前统计**: 企业端有48个`.tsx`文件

| 页面类型 | 应有页面 | 文件存在 | 真实可用 | 缺失项 |
|---|---|---|---|---|
| **核心流程** | | | | |
| 注册/登录 | ✅ | ✅ | ⚠️ | - |
| 需求发布(引导式) | ✅ | ⚠️ | ⚠️ | AI拆解是否真实调用 |
| 需求拆解结果页 | ⚠️ | ❌ | ❌ | 可能缺失 |
| 人才推荐列表 | ✅ | ⚠️ | ⚠️ | 成长故事展示 |
| 人才详情 | ✅ | ✅ | ⚠️ | 作品集关联 |
| 定向指定学生 | ⚠️ | ⚠️ | ⚠️ | 功能入口 |
| **已实现(体验优化)** | | | | |
| 学生搜索 | ✅ | ✅ | ✅ | - |
| 学生对比 | ✅ | ✅ | ✅ | - |
| 试稿管理 | ✅ | ✅ | ✅ | - |
| 任务进度仪表盘 | ✅ | ✅ | ✅ | - |
| **验收** | | | | |
| 任务列表 | ✅ | ⚠️ | ⚠️ | 状态筛选 |
| 交付物验收 | ✅ | ⚠️ | ⚠️ | AI审核结果展示 |
| 确认/打回 | ✅ | ⚠️ | ⚠️ | AI修改指引 |
| **数据** | | | | |
| 企业仪表盘 | ✅ | ⚠️ | ⚠️ | ROI看板 |
| 关注列表 | ✅ | ⚠️ | ⚠️ | 学生动态推送 |
| 合作档案 | ✅ | ⚠️ | ⚠️ | 交付物检索 |
| **其他** | | | | |
| 企业主页 | ✅ | ⚠️ | ⚠️ | 伯乐标签 |
| 项目制发布 | ⚠️ | ❌ | ❌ | 完全缺失 |
| 人才锁定 | ⚠️ | ❌ | ❌ | 完全缺失 |

**已确认存在的页面**:
- ✅ `student-search/index.tsx` - 学生搜索
- ✅ `student-comparison/index.tsx` - 学生对比
- ✅ `trial-management/index.tsx` - 试稿管理
- ✅ `task-progress/index.tsx` - 任务进度仪表盘

**完全缺失的页面**:
- ❌ 需求拆解结果确认页
- ❌ 项目制发布页
- ❌ 人才锁定页
- ❌ 人才网络地图页

---

### 2.3 后端API真实性检查

需要逐一验证的API：

| API端点 | 用途 | 当前状态 | 检查方法 |
|---|---|---|---|
| `POST /api/v1/profile/questionnaire` | 提交问卷触发AI分析 | ⚠️ | curl测试 + 检查Claude API调用 |
| `GET /api/v1/profile/current` | 获取最新画像 | ⚠️ | 检查`is_current=true`过滤 |
| `GET /api/v1/tasks/recommended` | 推荐任务 | ⚠️ | 检查匹配分数计算 |
| `POST /api/v1/tasks/:id/apply` | 申请接单 | ⚠️ | 检查状态变更 |
| `POST /api/v1/orders/:id/submit` | 提交交付物 | ⚠️ | 检查AI审核调用 |
| `POST /api/v1/mentor/message` | AI导师对话 | ⚠️ | 检查流式输出 |
| `GET /api/v1/reports` | 成长报告列表 | ⚠️ | - |
| `GET /api/v1/reports/:id` | 成长报告详情 | ⚠️ | 检查AI生成内容 |
| `POST /api/v1/enterprise/project` | 企业发布需求 | ⚠️ | 检查AI拆解 |
| `GET /api/v1/enterprise/talent` | 人才推荐 | ⚠️ | 检查匹配算法 |

---

## 三、冗余清理清单

### 3.1 文档冗余分析

**当前状态**: 项目根目录有214个`.md`文件

#### 高度冗余的文档类型

| 文档模式 | 数量估算 | 建议处理 |
|---|---|---|
| `*_SUMMARY*.md` | 20+ | 只保留最新的总结，旧版归档 |
| `*_REPORT*.md` | 15+ | 只保留最新的报告，旧版归档 |
| `*_GUIDE*.md` | 10+ | 合并重复的指南，统一入口 |
| `AI_MENTOR_*.md` | 15+ | 合并为1-2份主文档 |
| `*_COMPLETE*.md` | 8+ | 只保留最终版本 |
| `*_FINAL*.md` | 6+ | 只保留最终版本 |

#### 建议保留的核心文档

| 文档名 | 用途 | 原因 |
|---|---|---|
| `README.md` | 项目总览 | 入口文档 |
| `PLATFORM_ARCHITECTURE.md` | 架构设计 | 技术参考 |
| `API_DOCUMENTATION.md` | API文档 | 开发必需 |
| `DEPLOYMENT_GUIDE.md` | 部署指南 | 运维必需 |
| `TESTING_GUIDE.md` | 测试指南 | QA必需 |

#### 建议归档的文档

创建 `/docs/archive/` 目录，移入以下文档：

```bash
# 归档旧版本报告
mv *_SUMMARY_202*.md docs/archive/
mv *_REPORT_202*.md docs/archive/
mv *_COMPLETE_*.md docs/archive/

# 归档重复的AI导师文档
mkdir -p docs/archive/ai-mentor
mv AI_MENTOR_P0_*.md docs/archive/ai-mentor/
mv AI_MENTOR_P1_*.md docs/archive/ai-mentor/
```

#### 建议删除的文档

**删除前需确认的标准**:
1. 内容已被更新版本完全覆盖
2. 至少30天未被修改
3. 不包含任何独特信息

```bash
# 示例：删除明确过时的文档
rm DIRECTION_CORRECTION.md  # 如果内容已整合到主文档
rm E01_COMPLETION_REPORT.md  # 如果E01已完成且有最新总结
```

---

### 3.2 代码冗余分析

#### 后端代码检查

**当前统计**: 后端有390个`.ts`文件

需要检查的冗余类型：

| 类型 | 检查方法 | 处理方式 |
|---|---|---|
| **未注册的路由** | 查找定义了Router但未在`app.ts`中注册的 | 删除或注册 |
| **未使用的Service** | 查找未被任何Controller引用的Service | 删除 |
| **重复的函数** | 查找同名或功能相同的函数 | 合并 |
| **废弃的API** | 查找标注`@deprecated`的API | 删除 |
| **Console.log** | 查找所有`console.log` | 替换为日志库 |

执行检查命令：

```bash
# 查找未使用的import
cd backend && npx ts-prune

# 查找console.log
grep -r "console.log" src --include="*.ts" | wc -l

# 查找@deprecated
grep -r "@deprecated" src --include="*.ts"
```

#### 前端代码检查

**学生端**: 90个`.tsx`文件  
**企业端**: 48个`.tsx`文件

需要检查的冗余类型：

| 类型 | 检查方法 | 处理方式 |
|---|---|---|
| **未使用的页面** | 检查`app.config.ts`中未注册的页面 | 删除或注册 |
| **未使用的组件** | 检查components目录下未被引用的组件 | 删除 |
| **重复的API调用** | 查找多处定义相同URL的API | 统一到api层 |
| **未使用的依赖** | `npx depcheck` | 删除 |

执行检查命令：

```bash
# 学生端
cd miniapp && npx depcheck
cd miniapp && grep -r "import.*from.*pages" src | grep -v "index.tsx"

# 企业端
cd company-miniapp && npx depcheck
```

---

### 3.3 数据库冗余分析

#### 表结构检查

需要检查的问题：

| 问题 | 检查方法 | 处理方式 |
|---|---|---|
| **未使用的表** | 查询表访问日志，找出30天无读写的表 | 评估后删除或归档 |
| **重复的字段** | 检查同一信息存储在多个表中 | 规范化，保留一份 |
| **新旧表并存** | 检查功能重叠的表 | 迁移数据后删除旧表 |

执行检查SQL：

```sql
-- 查找可能未使用的表
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 检查表行数
SELECT schemaname, tablename, 
       n_tup_ins AS inserts,
       n_tup_upd AS updates,
       n_tup_del AS deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;
```

#### 可能的冗余表

基于migration文件分析，以下表可能存在冗余：

| 表名对 | 关系 | 检查项 |
|---|---|---|
| `user_profiles` vs `user_ability_profiles` | 可能重复 | 确认是否一个已废弃 |
| `orders` vs `task_orders` | 可能重复 | 确认是否指向同一实体 |
| `growth_reports` vs `opc_reports` | 不同用途 | 保留（一个学生端，一个政府端） |

---

## 四、执行清理的优先级

### Phase 1: 逻辑闭环修复 (P0) - 估计2周

**必须修复的逻辑断点**:

1. ✅ 学生升级触发重新匹配 - 触发器已有，需验证worker监听
2. ❌ 任务超时自动处理 - 需新增定时任务
3. ❌ 企业48小时未确认自动通过 - 需新增定时任务
4. ⚠️ 数据一致性修复 - 执行验证SQL后批量修复

**验证方法**:
- 运行数据一致性SQL
- 手动测试升级流程
- 检查通知队列日志

---

### Phase 2: 前端缺失页面补全 (P0) - 估计1周

**必须补全的页面**:

学生端：
1. 接单确认页（如果确认缺失）
2. 学生主页对外展示版

企业端：
1. 需求拆解结果确认页
2. AI审核结果展示（验收页中）

**验证方法**:
- 走完整用户流程
- 检查每个页面是否真实调用API

---

### Phase 3: 文档清理 (P1) - 估计2天

**清理步骤**:

```bash
# 1. 创建归档目录
mkdir -p docs/archive/{summaries,reports,guides,ai-mentor}

# 2. 归档旧版本
mv *_SUMMARY_2026*.md docs/archive/summaries/
mv *_REPORT_2026*.md docs/archive/reports/
mv AI_MENTOR_P*.md docs/archive/ai-mentor/

# 3. 删除确认无用的文档（需人工确认）
# 暂不执行，等待确认

# 4. 创建文档索引
cat > DOCUMENTATION_INDEX.md << 'EOF'
# 启程平台文档索引

## 核心文档
- [项目架构](PLATFORM_ARCHITECTURE.md)
- [API文档](API_DOCUMENTATION.md)
- [部署指南](DEPLOYMENT_GUIDE.md)

## 历史归档
- [历史报告](docs/archive/reports/)
- [历史总结](docs/archive/summaries/)
EOF
```

---

### Phase 4: 代码清理 (P1) - 估计3天

**清理步骤**:

```bash
# 后端
cd backend
npx ts-prune > unused-exports.txt
npx depcheck > unused-deps.txt
# 人工review后删除

# 前端学生端
cd miniapp
npx depcheck > unused-deps.txt
# 人工review后删除

# 前端企业端
cd company-miniapp
npx depcheck > unused-deps.txt
# 人工review后删除
```

---

## 五、清理后的验证

### 5.1 功能验证

**学生端完整流程测试**:
```
注册 → 问卷 → 画像 → 查看推荐 → 接单 → 做任务 → 提交 → 完成 → 成长报告
```

**企业端完整流程测试**:
```
注册 → 发布需求 → AI拆解 → 查看推荐学生 → 确认接单 → 等待交付 → 验收 → 完成
```

### 5.2 数据验证

重新运行数据一致性SQL，确保：
- 累计收入一致
- 完成订单数一致
- 接单人数一致
- 画像`is_current`唯一

### 5.3 性能验证

- API响应时间 < 500ms
- 页面加载时间 < 2s
- AI调用响应 < 5s

---

## 六、风险提示

### 删除前必须确认的项目

| 项目 | 确认方法 | 风险 |
|---|---|---|
| **任何数据库表** | 检查代码引用 + 30天访问日志 | 误删导致功能失效 |
| **任何Service文件** | 全局搜索引用 | 误删导致API报错 |
| **任何前端页面** | 检查路由配置 | 误删导致404 |
| **任何文档** | 确认无独特信息 | 丢失重要设计决策 |

### 安全删除原则

1. **先归档，后删除** - 移到archive目录30天后再永久删除
2. **先注释，后删除** - 代码先注释掉，测试通过后再删除
3. **先备份，后操作** - 数据库操作前必须备份

---

## 七、下一步行动

### 立即执行 (今天)

1. **运行数据一致性检查SQL** - 评估数据质量
2. **测试学生升级流程** - 验证触发器是否工作
3. **检查关键页面** - 确认哪些页面真的缺失

### 本周执行

1. **修复数据一致性问题**
2. **补全缺失的超时处理逻辑**
3. **开始文档归档**

### 下周执行

1. **补全缺失的前端页面**
2. **执行代码清理**
3. **全流程验证**

---

**审查报告完成。等待确认后开始执行清理。**
