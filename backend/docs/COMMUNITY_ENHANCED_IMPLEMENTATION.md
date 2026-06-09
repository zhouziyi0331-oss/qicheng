# 社区板块完整功能 - 实现文档

## 功能概述

实现了启程平台的社区板块完整功能，包括组队招募（P1）和技术交流（P2），支持帖子发布、评论、点赞、举报等完整的社区互动功能。

## 核心功能

### 1. 组队招募（P1）
- **发布权限**：Lv.5及以上可发布招募帖
- **招募信息**：项目简述、技能需求、分润方式、预计周期等
- **技能预填**：自动从用户画像提取技能标签
- **申请流程**：Lv.5+可申请，队长审核，满员自动关闭
- **队伍联动**：与teams表自动同步

### 2. 技术交流（P2）
- **技能分享帖**：Lv.2+可发布，分享技术经验、工具教程
- **问题求助帖**：所有等级可发布，技术问题求助
- **评论系统**：Lv.2+可评论，支持二层嵌套
- **点赞功能**：Lv.2+可点赞帖子和评论

### 3. 内容审核机制
- **AI发布前检测**：检测吐槽企业、攻击学生、广告等违规内容
- **举报机制**：用户可举报违规内容，3次举报自动隐藏
- **用户限制**：违规用户可被禁言、禁止发帖

### 4. 社区三原则
1. **不吐槽企业**：禁止针对具体企业、项目的负面评价
2. **不吐槽学生**：禁止针对具体学生的攻击
3. **聚焦技能与协作**：只允许技能相关内容

## 技术实现

### 数据库设计

#### 新增表

**community_comments（评论表）**
```sql
- id: UUID
- post_id: UUID (关联帖子)
- user_id: UUID (评论者)
- parent_id: UUID (父评论，支持二层嵌套)
- content: TEXT (限500字)
- like_count: INTEGER
- ai_review_result: JSONB
- report_count: INTEGER
- is_hidden: BOOLEAN
- created_at, updated_at: TIMESTAMPTZ
```

**community_likes（点赞表）**
```sql
- id: UUID
- user_id: UUID
- target_type: ENUM ('post', 'comment')
- target_id: UUID
- created_at: TIMESTAMPTZ
- UNIQUE(user_id, target_type, target_id)
```

**community_reports（举报表）**
```sql
- id: UUID
- reporter_id: UUID
- target_type: ENUM ('post', 'comment')
- target_id: UUID
- reason: ENUM (spam, harassment, company_complaint, student_attack, false_info, other)
- description: TEXT
- status: ENUM (pending, reviewed, resolved, dismissed)
- reviewed_by, reviewed_at, review_note
- created_at: TIMESTAMPTZ
```

**community_user_restrictions（用户限制表）**
```sql
- id: UUID
- user_id: UUID
- restriction_type: ENUM (comment_ban, post_ban, full_ban)
- reason: TEXT
- expires_at: TIMESTAMPTZ
- created_by: UUID
- created_at: TIMESTAMPTZ
```

#### 扩展 community_posts 表

新增字段：
- `project_source`: 项目来源（platform_order/self_initiated/external）
- `my_skills`: 发布者技能标签（JSONB）
- `required_skills_detail`: 需求技能详情（JSONB）
- `profit_split`: 分润方式（equal/proportional/negotiable）
- `estimated_duration`: 预计周期
- `recruit_count`: 招募人数
- `content_json`: 富文本内容（JSONB）
- `ai_review_result`: AI审核结果（JSONB）
- `report_count`: 被举报次数
- `is_hidden`: 是否被隐藏
- `related_track`: 关联赛道（content/dev/both）
- `related_levels`: 适合等级段（INTEGER[]）
- `like_count`: 点赞数

新增帖子类型：
- `skill_share`: 技能分享
- `help`: 问题求助

#### 触发器

1. **自动隐藏被举报内容**
   - 帖子或评论被举报3次自动隐藏
   - 进入管理端审核队列

2. **自动更新点赞数**
   - 点赞/取消点赞时自动更新计数

### 后端服务

#### contentAuditService.ts（AI内容审核）
- `auditContent()`: 审核帖子或评论内容
- `checkUserRestriction()`: 检查用户是否被限制
- `addUserRestriction()`: 添加用户限制
- 使用Claude API进行语义分析
- 检测违规类型：company_complaint, student_attack, spam, harassment, off_topic

#### communityServiceEnhanced.ts（社区服务增强版）
- `createPost()`: 发布帖子（含AI审核）
- `createComment()`: 发布评论（含AI审核）
- `getComments()`: 获取评论列表
- `toggleLike()`: 点赞/取消点赞
- `reportContent()`: 举报内容
- `deleteComment()`: 删除评论
- `deletePost()`: 删除帖子
- `getPostDetails()`: 获取帖子详情（含评论、队伍成员）

#### skillTagService.ts（技能标签服务）
- `getUserSkills()`: 获取用户技能标签（用于招募帖预填）
- `getSkillLibrary()`: 获取技能标签库（按赛道分类）
- `recommendRequiredSkills()`: 智能推荐需求技能
- `validateSkillTags()`: 验证技能标签有效性

技能标签来源：
1. 人格标签（personality_tag）
2. 优势能力（top_strengths）
3. 高频技能（从mentor_growth_observations提取）
4. 六维画像得分≥70的维度

### API接口

#### 帖子接口
- `POST /api/v1/community/posts` - 发布帖子
- `GET /api/v1/community/posts` - 获取帖子列表（Lv.4+）
- `GET /api/v1/community/posts/:id` - 获取帖子详情（Lv.4+）
- `DELETE /api/v1/community/posts/:id` - 删除帖子

#### 评论接口
- `POST /api/v1/community/posts/:id/comments` - 发布评论（Lv.2+）
- `GET /api/v1/community/posts/:id/comments` - 获取评论列表（Lv.4+）
- `DELETE /api/v1/community/comments/:id` - 删除评论

#### 点赞接口
- `POST /api/v1/community/like` - 点赞/取消点赞（Lv.2+）
  - Body: `{targetType: 'post'|'comment', targetId: string}`

#### 举报接口
- `POST /api/v1/community/report` - 举报内容（Lv.2+）
  - Body: `{targetType, targetId, reason, description?}`

#### 技能标签接口
- `GET /api/v1/community/my-skills` - 获取我的技能标签
- `GET /api/v1/community/skills` - 获取技能标签库
  - Query: `track=content|dev`

#### 招募申请接口
- `POST /api/v1/community/posts/:id/apply` - 申请加入招募（Lv.5+）

### 权限矩阵

| 功能 | Lv.0-1 | Lv.2-3 | Lv.4 | Lv.5 | Lv.6 |
|---|---|---|---|---|---|
| 浏览社区 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 发布技能分享帖 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 发布问题求助帖 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 评论 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 点赞 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 举报 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 发布招募帖 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 申请加入招募 | ❌ | ❌ | ❌ | ✅ | ✅ |

## 文件清单

### 后端文件
```
backend/
├── migrations/
│   └── 074_community_enhanced_system.sql          [新建]
├── src/
│   ├── services/
│   │   ├── contentAuditService.ts                 [新建]
│   │   ├── communityServiceEnhanced.ts            [新建]
│   │   └── skillTagService.ts                     [新建]
│   └── routes/
│       └── communityRoutesEnhanced.ts             [新建]
```

### 需要集成的步骤
1. 在 `app.ts` 中注册新路由：
   ```typescript
   import communityRoutesEnhanced from './routes/communityRoutesEnhanced';
   app.use('/api/v1/community-new', communityRoutesEnhanced);
   ```

2. 或者替换现有的社区路由（推荐）：
   ```typescript
   // 注释掉旧路由
   // app.use('/api/v1/community-new', communityRoutes);
   // 使用新路由
   app.use('/api/v1/community', communityRoutesEnhanced);
   ```

## 内容审核流程

### 发布前AI检测
```
用户提交帖子/评论
  ↓
调用 contentAuditService.auditContent()
  ↓
Claude API 分析内容
  ↓
返回审核结果 {passed, confidence, flags, reason}
  ↓
confidence > 0.8: 拒绝发布
confidence 0.6-0.8: 通过但提示用户
confidence < 0.6: 直接通过
```

### 举报处理流程
```
用户举报内容
  ↓
report_count +1
  ↓
report_count >= 3: 自动隐藏（is_hidden = true）
  ↓
进入管理端审核队列
  ↓
管理员复核：恢复展示 or 确认删除
```

### 用户限制机制
```
连续3次触发AI过滤
  ↓
评论权限暂停24小时
  ↓
累计被举报3次
  ↓
内容自动隐藏
  ↓
管理员可添加更长时间的限制
```

## 测试验证

### 1. 发布帖子测试
```bash
# 发布招募帖（Lv.5+）
curl -X POST http://localhost:3000/api/v1/community/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recruit",
    "title": "品牌视觉项目招募文案搭档",
    "content": "项目描述...",
    "projectSource": "platform_order",
    "mySkills": ["视觉设计", "品牌设计"],
    "requiredSkillsDetail": [
      {"skillName": "文案策划", "requiredLevel": "must"}
    ],
    "profitSplit": "equal",
    "estimatedDuration": "2周",
    "recruitCount": 2,
    "relatedTrack": "content"
  }'

# 发布技能分享帖（Lv.2+）
curl -X POST http://localhost:3000/api/v1/community/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "skill_share",
    "title": "用AI做品牌视觉升级的完整工作流",
    "content": "分享内容...",
    "relatedTrack": "content",
    "relatedLevels": [2, 3, 4]
  }'
```

### 2. 评论测试
```bash
# 发布评论
curl -X POST http://localhost:3000/api/v1/community/posts/<postId>/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "很有帮助的分享！"
  }'

# 回复评论
curl -X POST http://localhost:3000/api/v1/community/posts/<postId>/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "同意楼上",
    "parentId": "<commentId>"
  }'
```

### 3. 点赞测试
```bash
curl -X POST http://localhost:3000/api/v1/community/like \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "post",
    "targetId": "<postId>"
  }'
```

### 4. 举报测试
```bash
curl -X POST http://localhost:3000/api/v1/community/report \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "post",
    "targetId": "<postId>",
    "reason": "company_complaint",
    "description": "内容包含对企业的负面评价"
  }'
```

### 5. AI审核测试
```bash
# 测试违规内容（应该被拒绝）
curl -X POST http://localhost:3000/api/v1/community/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "skill_share",
    "title": "吐槽某企业",
    "content": "XX公司太坑了，需求变来变去"
  }'
# 预期返回：400 Bad Request，提示内容违反社区规范
```

## 数据库验证

```sql
-- 检查新表
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'community_%' 
ORDER BY table_name;

-- 检查新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_posts' 
  AND column_name IN ('ai_review_result', 'report_count', 'is_hidden');

-- 检查触发器
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name LIKE '%community%';

-- 测试举报自动隐藏
UPDATE community_posts SET report_count = 3 WHERE id = '<postId>';
SELECT is_hidden FROM community_posts WHERE id = '<postId>';
-- 预期：is_hidden = true
```

## 成功指标

### 功能指标
- ✅ Lv.5+可发布招募帖，Lv.4不可发布
- ✅ Lv.2+可发布技能分享帖和评论
- ✅ 所有等级可发布问题求助帖
- ✅ AI审核拦截违规内容（置信度>0.8）
- ✅ 举报3次自动隐藏
- ✅ 点赞/取消点赞正常工作
- ✅ 技能标签自动预填
- ✅ 评论支持二层嵌套

### 数据完整性
- ✅ 4个新表创建成功
- ✅ community_posts表扩展字段创建成功
- ✅ 触发器正常工作
- ✅ 唯一约束防止重复点赞/举报

## 后续优化

### Phase 2（1个月后）
1. **管理端审核界面**：管理员可查看举报队列，批量审核
2. **用户信誉系统**：基于举报记录和违规次数计算信誉分
3. **智能推荐**：基于用户画像推荐相关帖子

### Phase 3（3个月后）
1. **话题标签**：支持话题标签，方便内容分类
2. **精华帖**：管理员可标记精华帖，置顶展示
3. **积分奖励**：优质内容获得积分奖励

## 注意事项

1. **AI审核成本**：每次发布都调用Claude API，注意成本控制
2. **性能优化**：评论列表需要分页，避免一次加载过多
3. **缓存策略**：热门帖子可以缓存，减少数据库查询
4. **通知推送**：评论、点赞、举报等操作需要推送通知（待实现）

## 相关文档

- [社区板块功能设计文档](./COMMUNITY_DESIGN.md)
- [AI内容审核规范](./CONTENT_AUDIT_RULES.md)
- [用户等级权限说明](./USER_LEVEL_PERMISSIONS.md)

## 更新日志

- **2026-05-28**：完成社区板块完整功能实现
  - 数据库迁移（4个新表 + community_posts扩展）
  - AI内容审核服务
  - 社区服务增强版（评论、点赞、举报）
  - 技能标签服务
  - API路由完整实现
  - 迁移脚本执行成功
