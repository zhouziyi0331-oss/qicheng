# 🔗 跨端打通功能实现计划

## 📋 总体目标

将企业端和学生端从"两条平行铁轨"变成"一张互相触发的功能网络"，实现：
- 企业端的动作自动触发学生端反应
- 学生端的成长自动变成企业端决策信号
- 数据和功能的双向实时流转

---

## 🎯 实现清单

### Phase 1: 闭环一 - 需求-匹配-交付的全自动流转 (C-01 ~ C-04)

#### C-01: 需求变更的实时匹配更新
**数据库设计**:
```sql
-- 需求变更记录表
CREATE TABLE task_requirement_changes (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  changed_by UUID REFERENCES users(id),
  old_requirements JSONB,
  new_requirements JSONB,
  affected_students JSONB, -- [{ student_id, old_score, new_score }]
  created_at TIMESTAMP DEFAULT NOW()
);

-- 学生匹配变化通知表
CREATE TABLE matching_update_notifications (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  change_type VARCHAR(50), -- 'requirement_updated', 'score_improved', 'score_decreased'
  old_match_score DECIMAL,
  new_match_score DECIMAL,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**后端API**:
- POST `/api/v1/cross-platform/tasks/:taskId/requirement-change`
- GET `/api/v1/cross-platform/students/:studentId/matching-updates`

**前端实现**:
- 企业端: 修改需求时触发重新匹配
- 学生端: 实时推送匹配度变化通知

#### C-02: 学生等级变化的主动推荐
**数据库设计**:
```sql
-- 学生等级变化记录
CREATE TABLE student_level_changes (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  old_level INTEGER,
  new_level INTEGER,
  triggered_rematch BOOLEAN DEFAULT FALSE,
  new_matched_tasks JSONB, -- 新匹配的任务ID列表
  notified_companies JSONB, -- 通知的企业ID列表
  created_at TIMESTAMP DEFAULT NOW()
);

-- 企业等待学生成长记录 (C-03)
CREATE TABLE company_student_watching (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  watch_condition JSONB, -- { type: 'level_reach', target_level: 3 }
  condition_met BOOLEAN DEFAULT FALSE,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**触发器**:
```sql
-- 学生等级变化自动触发重新匹配
CREATE OR REPLACE FUNCTION trigger_rematch_on_level_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 记录等级变化
  INSERT INTO student_level_changes (student_id, old_level, new_level)
  VALUES (NEW.id, OLD.student_level, NEW.student_level);
  
  -- 触发后台重新匹配任务
  PERFORM pg_notify('student_level_changed', 
    json_build_object(
      'student_id', NEW.id,
      'old_level', OLD.student_level,
      'new_level', NEW.student_level
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_student_level_change
AFTER UPDATE OF student_level ON users
FOR EACH ROW
WHEN (OLD.student_level IS DISTINCT FROM NEW.student_level)
EXECUTE FUNCTION trigger_rematch_on_level_change();
```

#### C-04: 任务紧急程度的双边感知
**数据库设计**:
```sql
-- 任务紧急状态表
CREATE TABLE task_urgency_status (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  hours_until_deadline INTEGER,
  urgency_level VARCHAR(20), -- 'normal', 'urgent', 'critical'
  students_viewing_count INTEGER DEFAULT 0,
  students_viewing_list JSONB,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 2: 闭环二 - 成长-发现-投资的双向触达 (C-05 ~ C-12)

#### C-05: 任务进行中的透明度
**数据库设计**:
```sql
-- 任务实时进度表
CREATE TABLE task_realtime_progress (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  student_id UUID REFERENCES users(id),
  progress_visibility BOOLEAN DEFAULT TRUE, -- 学生可选公开/不公开
  current_stage VARCHAR(50), -- 'ideation', 'drafting', 'revising', 'finalizing'
  stage_started_at TIMESTAMP,
  estimated_completion TIMESTAMP,
  progress_logs JSONB[], -- 脱敏后的进度日志
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 企业端进度查看记录
CREATE TABLE company_progress_views (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  viewed_at TIMESTAMP DEFAULT NOW()
);
```

#### C-06: 卡点时刻的信任加固
**数据库设计**:
```sql
-- 卡点处理记录（脱敏后企业可见）
CREATE TABLE task_blockage_summaries (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  student_id UUID REFERENCES users(id),
  blockage_type VARCHAR(50), -- 'creative_direction', 'technical_issue', 'unclear_requirement'
  mentor_session_id UUID REFERENCES mentor_sessions(id),
  desensitized_summary TEXT, -- AI生成的脱敏摘要
  resolution_status VARCHAR(20), -- 'in_progress', 'resolved', 'escalated'
  impact_on_deadline BOOLEAN DEFAULT FALSE,
  visible_to_company BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### C-09: "被关注"的即时反馈
**数据库设计**:
```sql
-- 企业-学生关注关系表（增强）
CREATE TABLE company_student_follows (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  follow_reason TEXT, -- 企业关注的理由
  student_notified BOOLEAN DEFAULT FALSE,
  follow_strength INTEGER DEFAULT 1, -- 关注强度，随互动增加
  last_interaction_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_follows_student ON company_student_follows(student_id);
CREATE INDEX idx_follows_company ON company_student_follows(company_id);
```

#### C-10: 关注关系的双向成长
**触发器设计**:
```sql
-- 学生完成任务后自动通知关注企业
CREATE OR REPLACE FUNCTION notify_following_companies_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- 当任务状态变为completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 通知所有关注该学生的企业
    INSERT INTO notifications (user_id, type, content, related_task_id, created_at)
    SELECT 
      csf.company_id,
      'student_task_completed',
      json_build_object(
        'student_id', NEW.student_id,
        'task_id', NEW.id,
        'task_title', NEW.title,
        'rating', NEW.rating
      ),
      NEW.id,
      NOW()
    FROM company_student_follows csf
    WHERE csf.student_id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_task_completion_notify_followers
AFTER UPDATE OF status ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_following_companies_on_task_complete();
```

---

### Phase 3: 闭环三 - 信任-见证-品牌的共享声誉系统 (C-07 ~ C-08)

#### 共享声誉标签系统
**数据库设计**:
```sql
-- 共享声誉标签表
CREATE TABLE relationship_badges (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  badge_type VARCHAR(50), -- 'first_success', 'regular_partner', 'mentor_mentee'
  badge_name VARCHAR(100),
  badge_description TEXT,
  earned_at TIMESTAMP DEFAULT NOW(),
  collaboration_count INTEGER,
  visible_on_company_profile BOOLEAN DEFAULT TRUE,
  visible_on_student_profile BOOLEAN DEFAULT TRUE
);

-- 双向评价表
CREATE TABLE mutual_ratings (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  company_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  
  -- 企业评价学生
  company_to_student_rating DECIMAL(2,1),
  company_to_student_comment TEXT,
  
  -- 学生评价企业
  student_to_company_rating DECIMAL(2,1),
  student_to_company_comment TEXT,
  student_to_company_dimensions JSONB, -- { clear_requirements, smooth_communication, professional_respect }
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_mutual_ratings_company ON mutual_ratings(company_id);
CREATE INDEX idx_mutual_ratings_student ON mutual_ratings(student_id);
```

**自动生成标签的触发器**:
```sql
CREATE OR REPLACE FUNCTION auto_generate_relationship_badges()
RETURNS TRIGGER AS $$
DECLARE
  collab_count INTEGER;
BEGIN
  -- 计算该企业和学生的合作次数
  SELECT COUNT(*) INTO collab_count
  FROM tasks
  WHERE company_id = NEW.company_id 
    AND student_id = NEW.student_id 
    AND status = 'completed';
  
  -- 首次合作且评分>=4
  IF collab_count = 1 AND NEW.company_to_student_rating >= 4.0 AND NEW.student_to_company_rating >= 4.0 THEN
    INSERT INTO relationship_badges (company_id, student_id, badge_type, badge_name, collaboration_count)
    VALUES (NEW.company_id, NEW.student_id, 'first_success', '首次合作愉快', 1);
  END IF;
  
  -- 合作3次及以上
  IF collab_count >= 3 THEN
    INSERT INTO relationship_badges (company_id, student_id, badge_type, badge_name, collaboration_count)
    VALUES (NEW.company_id, NEW.student_id, 'regular_partner', '老搭档', collab_count)
    ON CONFLICT (company_id, student_id, badge_type) 
    DO UPDATE SET collaboration_count = collab_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_badges_on_rating
AFTER INSERT ON mutual_ratings
FOR EACH ROW
EXECUTE FUNCTION auto_generate_relationship_badges();
```

---

### Phase 4: 闭环四 - AI导师的跨端调度 (C-13 ~ C-16)

#### C-13: 企业端的AI需求顾问
**后端服务**:
```typescript
// services/aiAdvisorService.ts
class AIAdvisorService {
  // 企业发布需求时的实时分析
  async analyzeRequirement(requirement: string, category: string) {
    // 1. 调用Claude API分析需求
    const analysis = await this.claudeAnalyze(requirement);
    
    // 2. 实时匹配预览
    const matchingStudents = await this.previewMatching(analysis);
    
    // 3. 返回建议
    return {
      suggested_level: analysis.difficulty_level,
      suggested_skills: analysis.required_skills,
      matching_preview: {
        online_count: matchingStudents.filter(s => s.online).length,
        total_qualified: matchingStudents.length,
        top_matches: matchingStudents.slice(0, 3)
      },
      advice: analysis.advice
    };
  }
  
  // 企业收到交付物时的AI解读
  async interpretDeliverable(taskId: string, deliverableUrl: string) {
    // 1. 分析交付物
    const interpretation = await this.claudeInterpret(deliverableUrl);
    
    // 2. 对比需求
    const task = await this.getTask(taskId);
    const alignment = await this.checkAlignment(task.requirements, interpretation);
    
    return {
      style_analysis: interpretation.style,
      target_audience: interpretation.audience,
      alignment_score: alignment.score,
      highlights: interpretation.highlights,
      student_notes: await this.getStudentCreationNotes(taskId)
    };
  }
}
```

#### C-14: AI交付物解读
**数据库设计**:
```sql
-- AI交付物解读表
CREATE TABLE deliverable_ai_interpretations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  deliverable_url TEXT,
  style_analysis JSONB,
  target_audience TEXT,
  alignment_score DECIMAL(3,2),
  highlights TEXT[],
  generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 实现优先级

### P0 - 立即实现（本次完成）
- ✅ C-01: 需求变更的实时匹配更新
- ✅ C-02: 学生等级变化的主动推荐
- ✅ C-05: 任务进行中的透明度
- ✅ C-09: "被关注"的即时反馈
- ✅ C-10: 关注关系的双向成长

### P1 - 第二阶段（1-2周内）
- C-03: 企业端"等一个人"功能
- C-04: 任务紧急程度的双边感知
- C-06: 卡点时刻的信任加固
- C-13: 企业端的AI需求顾问

### P2 - 第三阶段（1个月内）
- C-07: 交付物背后的创作故事
- C-08: 评价的双向价值
- C-11: 从关注到合作的转化路径
- C-12: 长期合作关系的数字档案
- C-14: AI交付物解读
- C-15: AI评价辅助
- C-16: 导师-顾问数据互通

---

## 📊 技术实现策略

### 实时通知系统
使用PostgreSQL的LISTEN/NOTIFY + WebSocket推送：
```typescript
// 监听数据库事件
pool.on('notification', (msg) => {
  const payload = JSON.parse(msg.payload);
  
  switch(msg.channel) {
    case 'student_level_changed':
      // 触发重新匹配和推送
      matchingService.rematchAfterLevelChange(payload);
      break;
    case 'task_completed':
      // 通知关注企业
      notificationService.notifyFollowingCompanies(payload);
      break;
  }
});
```

### 数据同步机制
- 企业端操作 → 触发器 → PostgreSQL NOTIFY → 后端监听 → WebSocket推送学生端
- 学生端操作 → API调用 → 触发器 → 实时更新企业端

### 前端实时更新
- 使用Taro的WebSocket API建立长连接
- 收到推送后更新本地状态和UI
- 支持离线消息队列

---

## 🎯 预期效果

实现后，系统将实现：
1. **企业发布需求** → 学生端3秒内收到个性化推送
2. **学生升级** → 关注企业5秒内收到通知
3. **任务进度更新** → 企业端实时看到进度条变化
4. **学生完成任务** → 关注企业自动收到作品集更新
5. **企业关注学生** → 学生立即感知并收到鼓励

**从"两个独立App"变成"一个双向联动的生态系统"！** 🎊
