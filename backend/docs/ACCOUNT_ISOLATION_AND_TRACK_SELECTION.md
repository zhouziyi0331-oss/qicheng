# 账号隔离与赛道选择功能 - 实现文档

## 功能概述

实现了启程平台的账号隔离和赛道选择系统，确保学生和企业账号完全隔离，并为学生提供基于AI分析的赛道选择功能。

## 核心功能

### 1. 账号隔离
- **互斥注册**：同一手机号不能同时注册学生和企业账号
- **独立登录**：学生和企业使用不同的登录端点
- **接口隔离**：通过中间件确保学生端和企业端接口访问隔离

### 2. 赛道选择
- **AI推荐**：基于38题OPC测评结果，AI分析推荐最适合的赛道
- **两条赛道**：
  - 🎨 **AI内容创作**：适合视觉叙事能力强的学生
  - ⚙️ **AI工具开发**：适合系统构建与逻辑拆解能力强的学生
- **7级成长路径**：每条赛道都有完整的Lv.0-Lv.6成长体系
- **一次选择**：赛道选择后锁定，如需更改需联系管理员

### 3. 赛道过滤匹配
- **任务过滤**：学生只能看到自己选择赛道的任务
- **精准推荐**：匹配引擎只推荐符合学生赛道的任务

## 技术实现

### 数据库设计

#### 新增枚举类型
```sql
CREATE TYPE account_type AS ENUM ('student', 'enterprise');
CREATE TYPE track_type_new AS ENUM ('content', 'dev');
```

#### users表扩展
```sql
ALTER TABLE users
ADD COLUMN account_type account_type NOT NULL DEFAULT 'student',
ADD COLUMN selected_track track_type_new,
ADD COLUMN track_selected_at TIMESTAMPTZ;
```

#### user_ability_profiles表扩展
```sql
ALTER TABLE user_ability_profiles
ADD COLUMN track_analysis JSONB;
```

#### 约束
- 企业账号不能选择赛道
- 选择赛道时必须有选择时间
- 手机号与账号类型绑定

### 后端API

#### 注册接口
- `POST /api/v1/auth/register/student` - 学生注册
- `POST /api/v1/auth/register/enterprise` - 企业注册

#### 登录接口
- `POST /api/v1/auth/login/student` - 学生登录
- `POST /api/v1/auth/login/enterprise` - 企业登录

#### 赛道选择接口
- `GET /api/v1/students/track-recommendation` - 获取赛道推荐
- `POST /api/v1/students/select-track` - 选择赛道
- `GET /api/v1/students/track-paths` - 获取赛道路径对比
- `GET /api/v1/students/my-track` - 获取我的赛道信息

### 前端实现

#### 赛道选择页面
- 文件：`miniapp/src/pages/track-selection/index.tsx`
- 功能：
  - 显示AI推荐的赛道（带匹配分数和分析）
  - 显示备选赛道
  - 完整成长路径对比（7个等级详情）
  - 确认选择

#### 路由配置
- 已添加到 `miniapp/src/app.config.ts`
- 路径：`pages/track-selection/index`

### 中间件

#### accountTypeMiddleware.ts
- `requireStudentAccount()` - 校验学生账号
- `requireEnterpriseAccount()` - 校验企业账号
- `requireTrackSelected()` - 校验赛道选择状态

### 匹配引擎更新

#### trackAwareMatchingEngine.ts
- `getRecommendedTasksForStudent()` - 只返回学生选择赛道的任务
- `triggerTaskMatching()` - 只匹配选择了该赛道的学生

## 数据流程

### 学生注册流程
1. 学生在小程序注册（手机号+验证码）
2. 系统检查手机号是否已注册为企业账号
3. 如果未注册或已注册为学生账号，允许注册/登录
4. 创建账号时设置 `account_type = 'student'`

### 赛道选择流程
1. 学生完成38题OPC测评
2. AI-01分析测评结果，生成两条赛道的适配度分析
3. 存储到 `user_ability_profiles.track_analysis`
4. 学生进入赛道选择页面
5. 查看推荐赛道和备选赛道的分析
6. 可选：查看完整成长路径对比
7. 确认选择赛道
8. 更新 `users.selected_track` 和 `track_selected_at`
9. 跳转到任务大厅（只显示该赛道的任务）

### 任务匹配流程
1. 企业发布任务，指定赛道（content或dev）
2. 匹配引擎触发
3. 查询选择了该赛道的学生
4. 计算匹配分数
5. 只推送给最匹配的学生

## 文件清单

### 后端文件
```
backend/
├── migrations/
│   └── 073_account_isolation_and_track_selection.sql  [新建]
├── src/
│   ├── controllers/
│   │   ├── authIsolationController.ts                 [新建]
│   │   └── trackSelectionController.ts                [新建]
│   ├── middleware/
│   │   └── accountTypeMiddleware.ts                   [新建]
│   ├── routes/
│   │   └── authIsolationRoutes.ts                     [新建]
│   ├── services/
│   │   └── trackAwareMatchingEngine.ts                [新建]
│   ├── middleware/
│   │   └── auth.ts                                    [修改 - 添加accountType到JWT]
│   └── app.ts                                         [修改 - 注册新路由]
```

### 前端文件
```
miniapp/
└── src/
    ├── pages/
    │   └── track-selection/
    │       ├── index.tsx                              [新建]
    │       └── index.scss                             [新建]
    └── app.config.ts                                  [修改 - 添加页面路由]
```

## 测试验证

### 数据库验证
```bash
# 检查枚举类型
SELECT typname FROM pg_type WHERE typname IN ('account_type', 'track_type_new');

# 检查users表字段
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('account_type', 'selected_track', 'track_selected_at');

# 检查约束
SELECT conname FROM pg_constraint WHERE conname LIKE '%track%';
```

### API测试

#### 1. 测试账号隔离
```bash
# 学生注册
curl -X POST http://localhost:3000/api/v1/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456",
    "sms_code": "123456",
    "nickname": "测试学生"
  }'

# 尝试用同一手机号注册企业账号（应该失败）
curl -X POST http://localhost:3000/api/v1/auth/register/enterprise \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456",
    "sms_code": "123456",
    "company_name": "测试企业",
    "contact_name": "张三"
  }'
```

#### 2. 测试赛道选择
```bash
# 获取赛道推荐
curl -X GET http://localhost:3000/api/v1/students/track-recommendation \
  -H "Authorization: Bearer <student_token>"

# 选择赛道
curl -X POST http://localhost:3000/api/v1/students/select-track \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"track": "content"}'

# 获取赛道路径对比
curl -X GET http://localhost:3000/api/v1/students/track-paths \
  -H "Authorization: Bearer <student_token>"
```

#### 3. 测试接口隔离
```bash
# 企业账号尝试访问学生端接口（应该失败）
curl -X GET http://localhost:3000/api/v1/students/track-recommendation \
  -H "Authorization: Bearer <enterprise_token>"
```

## 成功指标

### 功能指标
- ✅ 同一手机号不能注册两种账号类型
- ✅ 学生和企业登录端点完全隔离
- ✅ 学生端接口企业账号无法访问
- ✅ 赛道选择后锁定，不可随意更改
- ✅ 任务匹配只推荐学生选择赛道的任务

### 数据完整性
- ✅ 所有枚举类型创建成功
- ✅ 所有字段和索引创建成功
- ✅ 所有约束生效
- ✅ 数据迁移脚本执行成功

## 后续优化

### Phase 2（1个月后）
1. **赛道切换申请**：允许学生申请切换赛道，需管理员审批
2. **赛道数据分析**：统计两条赛道的学生分布、完成率等
3. **赛道推荐优化**：基于更多维度优化AI推荐算法

### Phase 3（3个月后）
1. **多赛道支持**：扩展到更多赛道类型
2. **赛道组合**：允许学生选择主赛道+副赛道
3. **跨赛道任务**：支持需要多赛道技能的复合任务

## 注意事项

1. **数据迁移**：现有用户默认为学生账号，企业用户根据role字段自动识别
2. **JWT更新**：新增 `accountType` 和 `selectedTrack` 字段到JWT payload
3. **向后兼容**：旧的登录接口仍然可用，但建议迁移到新的隔离接口
4. **赛道锁定**：赛道选择后不可自行修改，需要管理员介入

## 相关文档

- [OPC测评系统文档](./OPC_ASSESSMENT.md)
- [任务匹配引擎文档](./MATCHING_ENGINE.md)
- [7级成长体系文档](./LEVEL_SYSTEM.md)

## 更新日志

- **2026-05-28**：完成账号隔离和赛道选择功能实现
  - 数据库迁移脚本
  - 后端API实现
  - 前端页面实现
  - 匹配引擎更新
  - 集成测试通过
