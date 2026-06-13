# 启程平台三端架构与数据互联设计

## 🏗️ 三端架构定位

### 1️⃣ 学生端小程序（微信小程序）
**定位**: PBL增强版 - 情感陪伴 + 项目实战

**核心功能**:
- ✅ **情感陪伴**（原有）
  - 启程小猫对话
  - 生命问题探索
  - 穿越感时刻
  - 成长里程碑
  
- ✅ **PBL项目式学习**（新增）
  - 项目初始化
  - 苏格拉底式引导
  - 任务拆解
  - 代码执行
  - 文件上传
  - 反思日志
  - 项目成果展示

- ✅ **任务系统**（原有）
  - 浏览任务大厅
  - 接单执行
  - 提交成果
  - 获得报酬

**技术栈**: Taro 3.6 + React 18 + TypeScript  
**设计风格**: 粉色温暖治愈系

---

### 2️⃣ 企业端小程序（微信小程序）
**定位**: 任务发布与人才管理（原有版本，不需要PBL）

**核心功能**:
- ✅ 任务管理
  - 发布任务
  - 任务草稿箱
  - 任务追加需求
  - AI智能定价
  
- ✅ 学生管理
  - 查看学生资料
  - 查看学生项目成果（数据互联）
  - 评价学生
  
- ✅ 财务管理
  - 托管账户
  - 提现申请
  - 交易记录

- ✅ 沟通协作
  - 任务沟通中转
  - 消息通知

**技术栈**: Taro 3.6 + React 18 + TypeScript  
**设计风格**: 紫色深色专业系（AETHER Dashboard风格）

---

### 3️⃣ 平台管理后台（网页）
**定位**: 平台运营与管理（原有版本，不需要PBL）

**核心功能**:
- ✅ 数据看板
  - 用户指标
  - 任务指标
  - 财务指标
  - 风险指标
  
- ✅ 用户管理
  - 学生管理
  - 企业管理
  - 认证审核
  
- ✅ 任务管理
  - 任务审核
  - 任务推荐
  
- ✅ 项目管理（新增，查看学生PBL项目）
  - 查看优秀项目
  - 项目推荐
  - 项目转化为任务
  
- ✅ 财务管理
  - 提现审核
  - 交易监控
  
- ✅ 内容管理
  - 评价管理
  - 举报处理

**技术栈**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4  
**设计风格**: GitHub深色主题

---

## 🔗 数据互联设计

### 核心原则
> **学生端独享PBL功能，企业端和平台端通过数据互联查看和利用PBL成果**

### 1. 学生PBL项目 → 平台任务

#### 场景
学生完成一个PBL项目后，可以将其转化为可展示的作品，平台可以推荐给企业。

#### 数据流
```
学生完成PBL项目
    ↓
保存到 pbl_projects (status = 'completed')
    ↓
生成项目成果 pbl_project_deliverables
    ↓
学生选择"公开展示" (is_public = true)
    ↓
平台审核通过
    ↓
展示在"优秀项目"列表
    ↓
企业可以查看
    ↓
企业可以基于项目发布类似任务
```

#### 数据库关联
```sql
-- 项目成果表（学生端）
CREATE TABLE pbl_project_deliverables (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES pbl_projects(id),
  user_id UUID REFERENCES users(id),
  
  -- 成果信息
  title TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT,  -- code, document, demo, presentation
  
  -- 展示信息
  is_public BOOLEAN DEFAULT FALSE,  -- 是否公开
  showcase_url TEXT,
  
  -- 评估
  quality_score INTEGER,  -- 1-10分
  
  -- 平台推荐
  is_featured BOOLEAN DEFAULT FALSE,  -- 是否精选
  featured_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目-任务关联表（新增）
CREATE TABLE project_task_links (
  id UUID PRIMARY KEY,
  pbl_project_id UUID REFERENCES pbl_projects(id),
  task_id UUID REFERENCES tasks(id),
  
  -- 关联类型
  link_type TEXT NOT NULL,  -- inspired_by, similar_to, template_from
  
  -- 说明
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 企业查看学生项目成果

#### 场景
企业在查看学生资料时，可以看到学生完成的PBL项目成果。

#### 数据流
```
企业查看学生资料
    ↓
查询学生的公开项目成果
    ↓
SELECT * FROM pbl_project_deliverables
WHERE user_id = $1 AND is_public = true
    ↓
展示项目列表
    ↓
企业可以查看项目详情
    ↓
企业可以基于项目邀请学生
```

#### API端点（企业端）
```typescript
// 查看学生的项目成果
GET /api/v1/company/students/:studentId/projects

// 查看项目详情
GET /api/v1/company/projects/:projectId

// 基于项目邀请学生
POST /api/v1/company/tasks/create-from-project
{
  projectId: 'xxx',
  studentId: 'xxx',
  taskTitle: '基于你的XX项目，我们想...'
}
```

### 3. 平台推荐优秀项目

#### 场景
平台管理员审核学生项目，将优秀项目推荐给企业。

#### 数据流
```
平台管理员查看待审核项目
    ↓
SELECT * FROM pbl_project_deliverables
WHERE is_public = true AND is_featured = false
    ↓
审核项目质量
    ↓
标记为精选项目
    ↓
UPDATE pbl_project_deliverables
SET is_featured = true, featured_at = NOW()
    ↓
展示在"精选项目"列表
    ↓
企业可以在首页看到
```

#### API端点（平台端）
```typescript
// 查看待审核项目
GET /api/v1/admin/projects/pending-review

// 审核项目
POST /api/v1/admin/projects/:projectId/review
{
  approved: true,
  isFeatured: true,
  qualityScore: 9
}

// 查看精选项目
GET /api/v1/admin/projects/featured
```

### 4. 学生项目成果展示

#### 场景
学生可以在个人中心看到自己的项目成果，并选择是否公开。

#### 数据流
```
学生查看"我的项目"
    ↓
SELECT * FROM pbl_projects
WHERE user_id = $1
    ↓
展示项目列表（进行中 + 已完成）
    ↓
学生点击"公开展示"
    ↓
UPDATE pbl_project_deliverables
SET is_public = true
    ↓
项目进入平台审核队列
```

#### API端点（学生端）
```typescript
// 查看我的项目
GET /api/v1/student/my-projects

// 公开项目
POST /api/v1/student/projects/:projectId/publish
{
  isPublic: true,
  showcaseUrl: 'https://...'
}

// 查看项目被查看次数
GET /api/v1/student/projects/:projectId/stats
```

---

## 📊 数据库扩展

### 新增表（数据互联）

```sql
-- 1. 项目-任务关联表
CREATE TABLE project_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pbl_project_id UUID REFERENCES pbl_projects(id),
  task_id UUID REFERENCES tasks(id),
  
  link_type TEXT NOT NULL,  -- inspired_by, similar_to, template_from
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 项目查看记录（企业查看学生项目）
CREATE TABLE project_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES pbl_projects(id),
  viewer_id UUID REFERENCES users(id),
  viewer_type TEXT NOT NULL,  -- company, platform_admin
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 项目推荐记录
CREATE TABLE project_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES pbl_projects(id),
  recommended_to_company_id UUID REFERENCES companies(id),
  recommended_by_admin_id UUID REFERENCES users(id),
  
  reason TEXT,
  status TEXT DEFAULT 'pending',  -- pending, viewed, contacted
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_project_task_links_project ON project_task_links(pbl_project_id);
CREATE INDEX idx_project_task_links_task ON project_task_links(task_id);
CREATE INDEX idx_project_view_logs_project ON project_view_logs(project_id);
CREATE INDEX idx_project_view_logs_viewer ON project_view_logs(viewer_id);
CREATE INDEX idx_project_recommendations_project ON project_recommendations(project_id);
CREATE INDEX idx_project_recommendations_company ON project_recommendations(recommended_to_company_id);
```

### 扩展现有表

```sql
-- 扩展 pbl_project_deliverables 表
ALTER TABLE pbl_project_deliverables
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN like_count INTEGER DEFAULT 0,
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_at TIMESTAMPTZ,
ADD COLUMN admin_review_status TEXT DEFAULT 'pending',  -- pending, approved, rejected
ADD COLUMN admin_review_notes TEXT,
ADD COLUMN reviewed_by UUID REFERENCES users(id),
ADD COLUMN reviewed_at TIMESTAMPTZ;

-- 扩展 student_profiles 表
ALTER TABLE student_profiles
ADD COLUMN public_project_count INTEGER DEFAULT 0,
ADD COLUMN featured_project_count INTEGER DEFAULT 0;

-- 触发器：更新学生的项目统计
CREATE OR REPLACE FUNCTION update_student_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND OLD.is_public = false THEN
    UPDATE student_profiles
    SET public_project_count = public_project_count + 1
    WHERE user_id = (SELECT user_id FROM pbl_projects WHERE id = NEW.project_id);
  END IF;
  
  IF NEW.is_featured = true AND OLD.is_featured = false THEN
    UPDATE student_profiles
    SET featured_project_count = featured_project_count + 1
    WHERE user_id = (SELECT user_id FROM pbl_projects WHERE id = NEW.project_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_project_stats
AFTER UPDATE ON pbl_project_deliverables
FOR EACH ROW
EXECUTE FUNCTION update_student_project_stats();
```

---

## 🔌 API设计

### 学生端API（新增）

```typescript
// 公开项目
POST /api/v1/student/projects/:projectId/publish
{
  isPublic: true,
  showcaseUrl?: string
}

// 查看项目统计
GET /api/v1/student/projects/:projectId/stats
// 返回：查看次数、点赞数、推荐次数

// 查看谁查看了我的项目
GET /api/v1/student/projects/:projectId/viewers
```

### 企业端API（新增）

```typescript
// 查看学生的项目成果
GET /api/v1/company/students/:studentId/projects
// 返回：学生的公开项目列表

// 查看项目详情
GET /api/v1/company/projects/:projectId
// 返回：项目详情、成果、代码、文档

// 查看精选项目
GET /api/v1/company/projects/featured
// 返回：平台推荐的优秀项目

// 基于项目邀请学生
POST /api/v1/company/tasks/create-from-project
{
  projectId: 'xxx',
  studentId: 'xxx',
  taskTitle: string,
  taskDescription: string
}
```

### 平台端API（新增）

```typescript
// 查看待审核项目
GET /api/v1/admin/projects/pending-review

// 审核项目
POST /api/v1/admin/projects/:projectId/review
{
  approved: boolean,
  isFeatured: boolean,
  qualityScore: number,
  reviewNotes?: string
}

// 推荐项目给企业
POST /api/v1/admin/projects/:projectId/recommend
{
  companyIds: string[],
  reason: string
}

// 查看项目统计
GET /api/v1/admin/projects/stats
// 返回：总项目数、公开项目数、精选项目数、平均质量分
```

---

## 🎨 前端页面设计

### 学生端小程序（新增页面）

#### 1. 我的项目页面
```
pages/my-projects/index.tsx

展示：
- 进行中的项目
- 已完成的项目
- 公开的项目
- 精选的项目

操作：
- 查看项目详情
- 公开/取消公开
- 查看统计数据
```

#### 2. 项目详情页面
```
pages/project-detail/index.tsx

展示：
- 项目信息
- 任务拆解
- 代码执行历史
- 文件列表
- 反思日志
- 项目成果

操作：
- 继续项目
- 公开展示
- 分享项目
```

#### 3. 项目成果展示页面
```
pages/project-showcase/index.tsx

展示：
- 项目标题和描述
- 项目成果（代码、文档、演示）
- 技术栈
- 学习收获
- 查看统计

操作：
- 分享到社交平台
- 下载项目报告
```

### 企业端小程序（新增页面）

#### 1. 学生项目成果页面
```
pages/student-projects/index.tsx

展示：
- 学生的公开项目列表
- 项目标题、描述、技术栈
- 项目质量评分

操作：
- 查看项目详情
- 基于项目邀请学生
```

#### 2. 精选项目页面
```
pages/featured-projects/index.tsx

展示：
- 平台推荐的优秀项目
- 项目分类（AI、Web开发、数据分析等）
- 项目作者信息

操作：
- 查看项目详情
- 联系学生
- 发布类似任务
```

### 平台管理后台（新增页面）

#### 1. 项目审核页面
```
/admin/projects/review

展示：
- 待审核项目列表
- 项目详情预览
- 学生信息

操作：
- 审核通过/拒绝
- 标记为精选
- 评分
- 添加审核备注
```

#### 2. 项目推荐页面
```
/admin/projects/recommend

展示：
- 优秀项目列表
- 企业列表

操作：
- 选择项目
- 选择企业
- 推荐项目给企业
- 查看推荐记录
```

#### 3. 项目统计页面
```
/admin/projects/stats

展示：
- 项目总数
- 公开项目数
- 精选项目数
- 平均质量分
- 项目分类分布
- 热门技术栈
```

---

## 🔄 典型业务流程

### 流程1：学生项目 → 企业任务

```
1. 学生完成PBL项目
   ↓
2. 学生选择"公开展示"
   ↓
3. 平台管理员审核
   ↓
4. 审核通过，标记为精选
   ↓
5. 展示在"精选项目"列表
   ↓
6. 企业查看精选项目
   ↓
7. 企业对项目感兴趣
   ↓
8. 企业基于项目发布任务
   ↓
9. 学生接单，继续深化项目
```

### 流程2：企业查看学生能力

```
1. 企业浏览任务大厅
   ↓
2. 学生接单
   ↓
3. 企业查看学生资料
   ↓
4. 查看学生的公开项目成果
   ↓
5. 评估学生实际能力
   ↓
6. 决定是否合作
```

### 流程3：平台推荐优秀项目

```
1. 平台管理员定期审核项目
   ↓
2. 发现优秀项目
   ↓
3. 标记为精选
   ↓
4. 推荐给相关企业
   ↓
5. 企业收到推荐通知
   ↓
6. 企业查看项目
   ↓
7. 企业联系学生或发布任务
```

---

## 📊 数据统计与分析

### 学生维度
- 完成项目数
- 公开项目数
- 精选项目数
- 项目被查看次数
- 项目被点赞次数
- 基于项目获得的任务数

### 企业维度
- 查看项目次数
- 基于项目发布的任务数
- 联系学生次数

### 平台维度
- 总项目数
- 公开项目数
- 精选项目数
- 平均项目质量分
- 项目分类分布
- 热门技术栈
- 项目转化为任务的比例

---

## 🎉 总结

### 架构清晰
- ✅ 学生端：PBL增强版（情感 + 项目）
- ✅ 企业端：原有版本（任务发布与管理）
- ✅ 平台端：原有版本（运营与管理）

### 数据互联
- ✅ 学生PBL项目可以公开展示
- ✅ 企业可以查看学生项目成果
- ✅ 平台可以审核和推荐优秀项目
- ✅ 项目可以转化为任务

### 价值闭环
```
学生做项目 → 积累作品 → 展示能力 → 吸引企业 → 获得任务 → 继续成长
```

**这样的设计既保持了各端的独立性，又实现了数据的有效互联！** 🎯✨
