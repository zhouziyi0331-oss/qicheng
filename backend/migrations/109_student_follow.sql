-- E-09: 关注学生功能
-- 企业可以关注优秀学生，接收学生动态和优先匹配

-- 关注关系表
CREATE TABLE student_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 关注来源
  follow_source VARCHAR(50),  -- 'task_completed', 'profile_view', 'recommendation', 'manual'
  follow_reason TEXT,  -- 关注原因

  -- 通知设置
  notify_on_available BOOLEAN DEFAULT true,  -- 学生有空时通知
  notify_on_level_up BOOLEAN DEFAULT true,   -- 学生升级时通知
  notify_on_new_skill BOOLEAN DEFAULT true,  -- 学生学会新技能时通知

  -- 标签和备注
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- 统计
  total_tasks_together INTEGER DEFAULT 0,  -- 一起完成的任务数
  last_interaction_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, student_id)
);

-- 学生动态表
CREATE TABLE student_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 动态类型
  activity_type VARCHAR(50) NOT NULL,  -- 'level_up', 'skill_acquired', 'task_completed', 'portfolio_added', 'achievement_earned'

  -- 动态内容
  title VARCHAR(200) NOT NULL,
  description TEXT,
  metadata JSONB,  -- 额外数据

  -- 可见性
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 关注通知表
CREATE TABLE follow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  activity_id UUID REFERENCES student_activities(id),

  -- 通知类型
  notification_type VARCHAR(50) NOT NULL,  -- 'student_available', 'level_up', 'new_skill', 'new_portfolio'

  -- 通知内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- 状态
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学生收藏夹（企业整理关注的学生）
CREATE TABLE student_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),

  name VARCHAR(100) NOT NULL,  -- '前端专家', '后端团队', '设计师组'
  description TEXT,
  color VARCHAR(20),  -- 收藏夹颜色标识

  student_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏夹-学生关联表
CREATE TABLE collection_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES student_collections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collection_id, student_id)
);

-- 索引
CREATE INDEX idx_follows_company ON student_follows(company_id, created_at DESC);
CREATE INDEX idx_follows_student ON student_follows(student_id, created_at DESC);
CREATE INDEX idx_activities_student ON student_activities(student_id, created_at DESC);
CREATE INDEX idx_activities_type ON student_activities(activity_type, created_at DESC);
CREATE INDEX idx_follow_notifications_company ON follow_notifications(company_id, is_read, created_at DESC);
CREATE INDEX idx_collections_company ON student_collections(company_id);
CREATE INDEX idx_collection_students_collection ON collection_students(collection_id);
CREATE INDEX idx_collection_students_student ON collection_students(student_id);

-- 更新关注数统计的触发器
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 增加企业的关注数
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.company_id;
    -- 增加学生的粉丝数
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.student_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 减少企业的关注数
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.company_id;
    -- 减少学生的粉丝数
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.student_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_counts
AFTER INSERT OR DELETE ON student_follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- 学生完成任务时创建动态
CREATE OR REPLACE FUNCTION create_activity_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO student_activities (
      id,
      student_id,
      activity_type,
      title,
      description,
      metadata,
      is_public
    ) VALUES (
      gen_random_uuid(),
      NEW.student_id,
      'task_completed',
      '完成任务: ' || NEW.title,
      '成功完成了任务，获得 ¥' || NEW.budget || ' 报酬',
      jsonb_build_object(
        'task_id', NEW.id,
        'budget', NEW.budget,
        'rating', NEW.client_rating,
        'category', NEW.category
      ),
      true
    );

    -- 更新关注关系的最后互动时间
    UPDATE student_follows
    SET last_interaction_at = NOW(),
        total_tasks_together = total_tasks_together + 1
    WHERE company_id = NEW.company_id AND student_id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_task_complete
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION create_activity_on_task_complete();

-- 学生升级时创建动态
CREATE OR REPLACE FUNCTION create_activity_on_level_up()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_level > OLD.student_level THEN
    INSERT INTO student_activities (
      id,
      student_id,
      activity_type,
      title,
      description,
      metadata,
      is_public
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      'level_up',
      '等级提升至 Lv.' || NEW.student_level,
      '通过努力学习和任务完成，等级提升了！',
      jsonb_build_object('new_level', NEW.student_level, 'old_level', OLD.student_level),
      true
    );

    -- 通知所有关注该学生且开启了升级通知的企业
    INSERT INTO follow_notifications (id, company_id, student_id, notification_type, title, content)
    SELECT
      gen_random_uuid(),
      company_id,
      NEW.id,
      'level_up',
      NEW.username || ' 升级了！',
      NEW.username || ' 已升级至 Lv.' || NEW.student_level || '，能力更上一层楼！'
    FROM student_follows
    WHERE student_id = NEW.id AND notify_on_level_up = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_level_up
AFTER UPDATE ON users
FOR EACH ROW
WHEN (NEW.role = 'student' AND NEW.student_level IS DISTINCT FROM OLD.student_level)
EXECUTE FUNCTION create_activity_on_level_up();

-- 更新收藏夹学生数量的触发器
CREATE OR REPLACE FUNCTION update_collection_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE student_collections
    SET student_count = student_count + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE student_collections
    SET student_count = student_count - 1
    WHERE id = OLD.collection_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collection_student_count
AFTER INSERT OR DELETE ON collection_students
FOR EACH ROW
EXECUTE FUNCTION update_collection_student_count();

-- 扩展用户表，添加关注统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

COMMENT ON TABLE student_follows IS 'E-09: 企业关注学生';
COMMENT ON TABLE student_activities IS '学生动态';
COMMENT ON TABLE follow_notifications IS '关注通知';
COMMENT ON TABLE student_collections IS '学生收藏夹';
COMMENT ON TABLE collection_students IS '收藏夹-学生关联';
