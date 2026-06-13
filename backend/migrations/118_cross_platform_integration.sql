-- ============================================================================
-- 迁移文件: 118_cross_platform_integration.sql
-- 功能: 跨端打通功能 - 企业端和学生端双向联动
-- 作者: AI Assistant
-- 日期: 2024-01-01
-- ============================================================================

-- ============================================================================
-- Phase 1: 需求-匹配-交付的全自动流转
-- ============================================================================

-- C-01: 需求变更记录表
CREATE TABLE IF NOT EXISTS task_requirement_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  old_requirements JSONB,
  new_requirements JSONB,
  affected_students JSONB, -- [{ student_id, old_score, new_score }]
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_requirement_changes_task ON task_requirement_changes(task_id);
CREATE INDEX idx_requirement_changes_time ON task_requirement_changes(created_at DESC);

-- 学生匹配变化通知表
CREATE TABLE IF NOT EXISTS matching_update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL, -- 'requirement_updated', 'score_improved', 'score_decreased'
  old_match_score DECIMAL(5,2),
  new_match_score DECIMAL(5,2),
  change_reason TEXT,
  notification_sent BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_matching_updates_student ON matching_update_notifications(student_id, notification_sent);
CREATE INDEX idx_matching_updates_task ON matching_update_notifications(task_id);

-- C-02: 学生等级变化记录
CREATE TABLE IF NOT EXISTS student_level_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  triggered_rematch BOOLEAN DEFAULT FALSE,
  new_matched_tasks JSONB, -- [task_ids]
  notified_companies JSONB, -- [company_ids]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_level_changes_student ON student_level_changes(student_id);
CREATE INDEX idx_level_changes_time ON student_level_changes(created_at DESC);

-- C-03: 企业等待学生成长记录
CREATE TABLE IF NOT EXISTS company_student_watching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watch_condition JSONB NOT NULL, -- { type: 'level_reach', target_level: 3 }
  watch_note TEXT,
  condition_met BOOLEAN DEFAULT FALSE,
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_watching_company ON company_student_watching(company_id);
CREATE INDEX idx_watching_student ON company_student_watching(student_id, condition_met);
CREATE UNIQUE INDEX idx_watching_unique ON company_student_watching(company_id, student_id, watch_condition);

-- C-04: 任务紧急状态表
CREATE TABLE IF NOT EXISTS task_urgency_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  hours_until_deadline INTEGER,
  urgency_level VARCHAR(20) CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  students_viewing_count INTEGER DEFAULT 0,
  students_viewing_list JSONB, -- [{ student_id, viewed_at }]
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_urgency_task ON task_urgency_status(task_id);

-- ============================================================================
-- Phase 2: 成长-发现-投资的双向触达
-- ============================================================================

-- C-05: 任务实时进度表
CREATE TABLE IF NOT EXISTS task_realtime_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_visibility BOOLEAN DEFAULT TRUE, -- 学生可选公开/不公开
  current_stage VARCHAR(50), -- 'ideation', 'drafting', 'revising', 'finalizing'
  stage_display_name VARCHAR(100), -- '创意构思中', '初稿制作中'
  stage_started_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100),
  progress_logs JSONB[], -- 脱敏后的进度日志
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_progress_task ON task_realtime_progress(task_id);
CREATE INDEX idx_progress_student ON task_realtime_progress(student_id);

-- 企业端进度查看记录
CREATE TABLE IF NOT EXISTS company_progress_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  progress_snapshot JSONB, -- 查看时的进度快照
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_views_company ON company_progress_views(company_id);
CREATE INDEX idx_progress_views_task ON company_progress_views(task_id);

-- C-06: 卡点处理记录（脱敏后企业可见）
CREATE TABLE IF NOT EXISTS task_blockage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blockage_type VARCHAR(50), -- 'creative_direction', 'technical_issue', 'unclear_requirement'
  blockage_description TEXT, -- 内部记录，不公开
  desensitized_summary TEXT, -- AI生成的脱敏摘要，企业可见
  resolution_status VARCHAR(20) CHECK (resolution_status IN ('in_progress', 'resolved', 'escalated')),
  impact_on_deadline BOOLEAN DEFAULT FALSE,
  visible_to_company BOOLEAN DEFAULT TRUE,
  mentor_session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_blockage_task ON task_blockage_summaries(task_id);
CREATE INDEX idx_blockage_student ON task_blockage_summaries(student_id);

-- C-09 & C-10: 企业-学生关注关系表（增强版）
CREATE TABLE IF NOT EXISTS company_student_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follow_reason TEXT,
  follow_source VARCHAR(50), -- 'profile_view', 'task_collaboration', 'recommendation'
  student_notified BOOLEAN DEFAULT FALSE,
  follow_strength INTEGER DEFAULT 1, -- 关注强度，随互动增加
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_follows_unique ON company_student_follows(company_id, student_id);
CREATE INDEX idx_follows_student ON company_student_follows(student_id);
CREATE INDEX idx_follows_company ON company_student_follows(company_id);

-- 学生被关注统计（实时更新）
CREATE TABLE IF NOT EXISTS student_follow_stats (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_followers INTEGER DEFAULT 0,
  active_followers INTEGER DEFAULT 0, -- 最近30天有互动的
  new_followers_this_week INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Phase 3: 信任-见证-品牌的共享声誉系统
-- ============================================================================

-- C-07 & C-08: 共享声誉标签表
CREATE TABLE IF NOT EXISTS relationship_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL, -- 'first_success', 'regular_partner', 'mentor_mentee', 'growth_witness'
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  badge_icon VARCHAR(50), -- emoji或图标标识
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collaboration_count INTEGER DEFAULT 0,
  visible_on_company_profile BOOLEAN DEFAULT TRUE,
  visible_on_student_profile BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_badges_company ON relationship_badges(company_id);
CREATE INDEX idx_badges_student ON relationship_badges(student_id);
CREATE UNIQUE INDEX idx_badges_unique ON relationship_badges(company_id, student_id, badge_type);

-- 双向评价表
CREATE TABLE IF NOT EXISTS mutual_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 企业评价学生
  company_to_student_rating DECIMAL(2,1) CHECK (company_to_student_rating BETWEEN 1.0 AND 5.0),
  company_to_student_comment TEXT,
  company_to_student_dimensions JSONB, -- { quality, completeness, timeliness, communication }
  
  -- 学生评价企业
  student_to_company_rating DECIMAL(2,1) CHECK (student_to_company_rating BETWEEN 1.0 AND 5.0),
  student_to_company_comment TEXT,
  student_to_company_dimensions JSONB, -- { clear_requirements, smooth_communication, professional_respect, timely_payment }
  
  mutual_satisfaction BOOLEAN, -- 双方都满意（评分都>=4.0）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_mutual_ratings_task ON mutual_ratings(task_id);
CREATE INDEX idx_mutual_ratings_company ON mutual_ratings(company_id);
CREATE INDEX idx_mutual_ratings_student ON mutual_ratings(student_id);

-- 学生创作说明表（C-07）
CREATE TABLE IF NOT EXISTS deliverable_creation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  style_explanation TEXT, -- 为什么用这种风格
  creative_challenge TEXT, -- 创作中最大的挑战
  satisfaction_highlight TEXT, -- 最满意的地方
  time_spent_hours DECIMAL(5,1),
  tools_used VARCHAR(200)[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_creation_notes_task ON deliverable_creation_notes(task_id);

-- ============================================================================
-- Phase 4: AI导师的跨端调度
-- ============================================================================

-- C-14: AI交付物解读表
CREATE TABLE IF NOT EXISTS deliverable_ai_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  deliverable_url TEXT,
  style_analysis JSONB, -- { style, mood, color_palette }
  target_audience TEXT,
  alignment_score DECIMAL(3,2) CHECK (alignment_score BETWEEN 0 AND 1),
  alignment_details JSONB,
  highlights TEXT[],
  improvement_suggestions TEXT[],
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_interpretation_task ON deliverable_ai_interpretations(task_id);

-- 企业AI顾问记录表（C-13）
CREATE TABLE IF NOT EXISTS company_ai_advisor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(50), -- 'requirement_analysis', 'deliverable_review', 'rating_advice'
  input_data JSONB,
  ai_response JSONB,
  advice_followed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_advisor_sessions_company ON company_ai_advisor_sessions(company_id);

-- ============================================================================
-- 触发器: 自动化双向通知和数据同步
-- ============================================================================

-- 触发器1: 学生等级变化自动触发重新匹配
CREATE OR REPLACE FUNCTION trigger_rematch_on_level_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.student_level IS DISTINCT FROM NEW.student_level THEN
    -- 记录等级变化
    INSERT INTO student_level_changes (student_id, old_level, new_level)
    VALUES (NEW.id, OLD.student_level, NEW.student_level);
    
    -- 发送PostgreSQL通知（后端监听）
    PERFORM pg_notify('student_level_changed', 
      json_build_object(
        'student_id', NEW.id,
        'old_level', OLD.student_level,
        'new_level', NEW.student_level
      )::text
    );
    
    -- 检查是否有企业在等待这个学生成长
    UPDATE company_student_watching
    SET condition_met = TRUE,
        notified = FALSE
    WHERE student_id = NEW.id
      AND (watch_condition->>'type' = 'level_reach' 
           AND (watch_condition->>'target_level')::INTEGER <= NEW.student_level)
      AND condition_met = FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_student_level_change
AFTER UPDATE OF student_level ON users
FOR EACH ROW
WHEN (OLD.student_level IS DISTINCT FROM NEW.student_level)
EXECUTE FUNCTION trigger_rematch_on_level_change();

-- 触发器2: 学生完成任务后自动通知关注企业
CREATE OR REPLACE FUNCTION notify_following_companies_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 发送通知给所有关注该学生的企业
    PERFORM pg_notify('task_completed_by_followed_student',
      json_build_object(
        'student_id', NEW.student_id,
        'task_id', NEW.id,
        'task_title', NEW.title,
        'rating', NEW.rating
      )::text
    );
    
    -- 更新关注强度
    UPDATE company_student_follows
    SET last_interaction_at = NOW(),
        interaction_count = interaction_count + 1
    WHERE student_id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_task_completion_notify_followers
AFTER UPDATE OF status ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_following_companies_on_task_complete();

-- 触发器3: 企业关注学生时自动通知学生
CREATE OR REPLACE FUNCTION notify_student_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新学生被关注统计
  INSERT INTO student_follow_stats (student_id, total_followers, new_followers_this_week)
  VALUES (NEW.student_id, 1, 1)
  ON CONFLICT (student_id) 
  DO UPDATE SET 
    total_followers = student_follow_stats.total_followers + 1,
    new_followers_this_week = student_follow_stats.new_followers_this_week + 1,
    updated_at = NOW();
  
  -- 发送通知
  PERFORM pg_notify('student_followed',
    json_build_object(
      'student_id', NEW.student_id,
      'company_id', NEW.company_id,
      'follow_reason', NEW.follow_reason
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_company_follow_student
AFTER INSERT ON company_student_follows
FOR EACH ROW
EXECUTE FUNCTION notify_student_on_follow();

-- 触发器4: 自动生成关系标签
CREATE OR REPLACE FUNCTION auto_generate_relationship_badges()
RETURNS TRIGGER AS $$
DECLARE
  collab_count INTEGER;
  first_collab_date TIMESTAMP;
  student_start_level INTEGER;
  student_current_level INTEGER;
BEGIN
  -- 计算该企业和学生的合作次数
  SELECT COUNT(*) INTO collab_count
  FROM tasks
  WHERE company_id = NEW.company_id 
    AND student_id = NEW.student_id 
    AND status = 'completed';
  
  -- 首次合作且双方都满意
  IF collab_count = 1 AND NEW.mutual_satisfaction = TRUE THEN
    INSERT INTO relationship_badges (company_id, student_id, badge_type, badge_name, badge_icon, collaboration_count)
    VALUES (NEW.company_id, NEW.student_id, 'first_success', '首次合作愉快', '🎉', 1)
    ON CONFLICT (company_id, student_id, badge_type) DO NOTHING;
  END IF;
  
  -- 合作3次及以上 = 老搭档
  IF collab_count >= 3 THEN
    INSERT INTO relationship_badges (company_id, student_id, badge_type, badge_name, badge_icon, collaboration_count, badge_description)
    VALUES (NEW.company_id, NEW.student_id, 'regular_partner', '老搭档', '🤝', collab_count, '已合作' || collab_count || '次')
    ON CONFLICT (company_id, student_id, badge_type) 
    DO UPDATE SET 
      collaboration_count = collab_count,
      badge_description = '已合作' || collab_count || '次';
  END IF;
  
  -- 检查是否见证了学生从Lv.1到Lv.3的成长
  SELECT MIN(created_at), MIN(student_level) INTO first_collab_date, student_start_level
  FROM tasks t
  JOIN users u ON u.id = t.student_id
  WHERE t.company_id = NEW.company_id 
    AND t.student_id = NEW.student_id 
    AND t.status = 'completed';
  
  SELECT student_level INTO student_current_level
  FROM users
  WHERE id = NEW.student_id;
  
  IF student_start_level <= 1 AND student_current_level >= 3 THEN
    INSERT INTO relationship_badges (company_id, student_id, badge_type, badge_name, badge_icon, badge_description)
    VALUES (NEW.company_id, NEW.student_id, 'growth_witness', '伯乐与千里马', '🌟', '见证学生从Lv.' || student_start_level || '成长到Lv.' || student_current_level)
    ON CONFLICT (company_id, student_id, badge_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_badges_on_rating
AFTER INSERT ON mutual_ratings
FOR EACH ROW
EXECUTE FUNCTION auto_generate_relationship_badges();

-- ============================================================================
-- 视图: 方便查询的视图
-- ============================================================================

-- 企业视角: 关注的学生最新动态
CREATE OR REPLACE VIEW company_followed_students_updates AS
SELECT 
  csf.company_id,
  csf.student_id,
  u.username AS student_name,
  u.student_level,
  csf.follow_strength,
  csf.last_interaction_at,
  sfs.total_followers,
  (
    SELECT COUNT(*) 
    FROM tasks 
    WHERE student_id = csf.student_id 
      AND status = 'completed' 
      AND created_at > csf.last_interaction_at
  ) AS new_tasks_completed,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'task_id', t.id,
      'title', t.title,
      'rating', t.rating,
      'completed_at', t.updated_at
    ))
    FROM tasks t
    WHERE t.student_id = csf.student_id 
      AND t.status = 'completed'
      AND t.created_at > csf.last_interaction_at
    LIMIT 5
  ) AS recent_works
FROM company_student_follows csf
JOIN users u ON u.id = csf.student_id
LEFT JOIN student_follow_stats sfs ON sfs.student_id = csf.student_id;

-- 学生视角: 被哪些企业关注
CREATE OR REPLACE VIEW student_company_followers AS
SELECT
  csf.student_id,
  csf.company_id,
  u.username AS company_name,
  csf.follow_reason,
  csf.created_at AS followed_at,
  csf.follow_strength,
  (
    SELECT COUNT(*)
    FROM tasks
    WHERE company_id = csf.company_id 
      AND student_id = csf.student_id
      AND status = 'completed'
  ) AS collaboration_count,
  (
    SELECT jsonb_agg(badge_name)
    FROM relationship_badges
    WHERE company_id = csf.company_id 
      AND student_id = csf.student_id
  ) AS earned_badges
FROM company_student_follows csf
JOIN users u ON u.id = csf.company_id;

-- ============================================================================
-- 初始化数据
-- ============================================================================

-- 为已有的合作关系生成标签
INSERT INTO relationship_badges (company_id, student_id, badge_type, badge_name, badge_icon, collaboration_count)
SELECT 
  company_id,
  student_id,
  'regular_partner' AS badge_type,
  '老搭档' AS badge_name,
  '🤝' AS badge_icon,
  COUNT(*) AS collaboration_count
FROM tasks
WHERE status = 'completed'
  AND company_id IS NOT NULL
  AND student_id IS NOT NULL
GROUP BY company_id, student_id
HAVING COUNT(*) >= 3
ON CONFLICT (company_id, student_id, badge_type) DO NOTHING;

-- ============================================================================
-- 完成标记
-- ============================================================================

COMMENT ON TABLE task_requirement_changes IS '需求变更记录表 - C-01';
COMMENT ON TABLE matching_update_notifications IS '学生匹配变化通知表 - C-01';
COMMENT ON TABLE student_level_changes IS '学生等级变化记录 - C-02';
COMMENT ON TABLE company_student_watching IS '企业等待学生成长记录 - C-03';
COMMENT ON TABLE task_urgency_status IS '任务紧急状态表 - C-04';
COMMENT ON TABLE task_realtime_progress IS '任务实时进度表 - C-05';
COMMENT ON TABLE company_progress_views IS '企业端进度查看记录 - C-05';
COMMENT ON TABLE task_blockage_summaries IS '卡点处理记录 - C-06';
COMMENT ON TABLE company_student_follows IS '企业-学生关注关系表 - C-09/C-10';
COMMENT ON TABLE student_follow_stats IS '学生被关注统计 - C-09/C-10';
COMMENT ON TABLE relationship_badges IS '共享声誉标签表 - C-07/C-08';
COMMENT ON TABLE mutual_ratings IS '双向评价表 - C-08';
COMMENT ON TABLE deliverable_creation_notes IS '学生创作说明表 - C-07';
COMMENT ON TABLE deliverable_ai_interpretations IS 'AI交付物解读表 - C-14';
COMMENT ON TABLE company_ai_advisor_sessions IS '企业AI顾问记录表 - C-13';

-- 迁移完成
DO $$
BEGIN
  RAISE NOTICE '✅ 跨端打通功能数据库迁移完成！';
  RAISE NOTICE '📊 新增表: 15个';
  RAISE NOTICE '🔔 新增触发器: 4个';
  RAISE NOTICE '👁️ 新增视图: 2个';
END $$;
