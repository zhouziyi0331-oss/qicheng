-- E-14: 项目制发布
-- 支持企业发布包含多个里程碑和任务的大型项目

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  
  -- 项目基本信息
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  project_code VARCHAR(50) UNIQUE,  -- 项目编号，如 PRJ-2024-001
  
  -- 预算和工期
  total_budget DECIMAL(10,2) NOT NULL,
  budget_allocated DECIMAL(10,2) DEFAULT 0,  -- 已分配预算
  budget_spent DECIMAL(10,2) DEFAULT 0,      -- 已花费预算
  
  estimated_duration_days INTEGER,
  actual_start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  
  -- 项目状态
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- 'draft' - 草稿
  -- 'planning' - 规划中
  -- 'published' - 已发布
  -- 'in_progress' - 进行中
  -- 'paused' - 已暂停
  -- 'completed' - 已完成
  -- 'cancelled' - 已取消
  
  -- 项目团队
  project_manager_id UUID REFERENCES users(id),  -- 项目经理（企业内部）
  team_members JSONB DEFAULT '[]',  -- 分配的学生团队
  
  -- 项目分类
  category VARCHAR(100),
  tags TEXT[],
  
  -- 统计数据
  total_milestones INTEGER DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  
  -- 项目进度
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_company ON projects(company_id, created_at DESC);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_code ON projects(project_code) WHERE project_code IS NOT NULL;

-- 项目里程碑表
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 里程碑信息
  milestone_order INTEGER NOT NULL,  -- 里程碑顺序
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 预算分配
  budget_allocation DECIMAL(10,2) NOT NULL,
  budget_spent DECIMAL(10,2) DEFAULT 0,
  
  -- 工期
  estimated_duration_days INTEGER,
  due_date DATE,
  
  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending' - 待开始
  -- 'in_progress' - 进行中
  -- 'completed' - 已完成
  -- 'blocked' - 受阻
  -- 'skipped' - 已跳过
  
  -- 交付物要求
  deliverables JSONB DEFAULT '[]',
  acceptance_criteria JSONB DEFAULT '[]',
  
  -- 依赖关系
  depends_on_milestone_id UUID REFERENCES project_milestones(id),
  
  -- 统计
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- 时间戳
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_project_milestone_order UNIQUE(project_id, milestone_order)
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id, milestone_order);
CREATE INDEX idx_milestones_status ON project_milestones(project_id, status);
CREATE INDEX idx_milestones_depends ON project_milestones(depends_on_milestone_id) WHERE depends_on_milestone_id IS NOT NULL;

-- 项目任务关联表
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- 任务在项目中的角色
  task_order INTEGER,
  is_critical BOOLEAN DEFAULT false,  -- 是否是关键任务
  
  -- 关联信息
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  linked_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_project_task UNIQUE(project_id, task_id)
);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id, task_order);
CREATE INDEX idx_project_tasks_milestone ON project_tasks(milestone_id);
CREATE INDEX idx_project_tasks_task ON project_tasks(task_id);

-- 项目协作记录表
CREATE TABLE IF NOT EXISTS project_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- 角色
  role VARCHAR(50),  -- 'developer', 'designer', 'tester', 'lead'
  responsibilities TEXT[],
  
  -- 统计
  tasks_assigned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  contribution_score DECIMAL(5,2) DEFAULT 0,
  
  -- 时间
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  CONSTRAINT unique_project_collaboration UNIQUE(project_id, student_id)
);

CREATE INDEX idx_collaborations_project ON project_collaborations(project_id);
CREATE INDEX idx_collaborations_student ON project_collaborations(student_id);

-- 项目看板视图
CREATE OR REPLACE VIEW project_dashboard AS
SELECT
  p.id as project_id,
  p.project_code,
  p.name,
  p.status,
  p.total_budget,
  p.budget_spent,
  p.progress_percentage,
  p.total_milestones,
  p.completed_milestones,
  p.total_tasks,
  p.completed_tasks,
  COUNT(DISTINCT pc.student_id) as team_size,
  p.estimated_end_date,
  p.created_at
FROM projects p
LEFT JOIN project_collaborations pc ON p.id = pc.project_id AND pc.left_at IS NULL
GROUP BY p.id;

-- 生成项目编号的函数
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_seq INTEGER;
  v_code VARCHAR(50);
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::VARCHAR;
  
  -- 获取当年的项目序号
  SELECT COUNT(*) + 1 INTO v_seq
  FROM projects
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  v_code := 'PRJ-' || v_year || '-' || LPAD(v_seq::VARCHAR, 3, '0');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 触发器：创建项目时自动生成项目编号
CREATE OR REPLACE FUNCTION trigger_generate_project_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.project_code IS NULL THEN
    NEW.project_code := generate_project_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_project_code
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_project_code();

-- 触发器：更新项目统计
CREATE OR REPLACE FUNCTION trigger_update_project_stats()
RETURNS trigger AS $$
BEGIN
  -- 更新项目的里程碑和任务统计
  UPDATE projects
  SET total_milestones = (SELECT COUNT(*) FROM project_milestones WHERE project_id = NEW.project_id),
      completed_milestones = (SELECT COUNT(*) FROM project_milestones WHERE project_id = NEW.project_id AND status = 'completed'),
      total_tasks = (SELECT COUNT(*) FROM project_tasks WHERE project_id = NEW.project_id),
      updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_milestone_update_stats
AFTER INSERT OR UPDATE OR DELETE ON project_milestones
FOR EACH ROW
EXECUTE FUNCTION trigger_update_project_stats();

-- 触发器：里程碑完成时检查项目是否完成
CREATE OR REPLACE FUNCTION trigger_check_project_completion()
RETURNS trigger AS $$
DECLARE
  v_total_milestones INTEGER;
  v_completed_milestones INTEGER;
BEGIN
  IF NEW.status = 'completed' THEN
    SELECT total_milestones, completed_milestones
    INTO v_total_milestones, v_completed_milestones
    FROM projects WHERE id = NEW.project_id;
    
    -- 如果所有里程碑都完成，标记项目为完成
    IF v_completed_milestones >= v_total_milestones AND v_total_milestones > 0 THEN
      UPDATE projects
      SET status = 'completed',
          completed_at = NOW(),
          progress_percentage = 100,
          updated_at = NOW()
      WHERE id = NEW.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_milestone_check_completion
AFTER UPDATE ON project_milestones
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION trigger_check_project_completion();

-- 注释
COMMENT ON TABLE projects IS 'E-14: 项目表，存储大型项目信息';
COMMENT ON TABLE project_milestones IS 'E-14: 项目里程碑表，项目的关键节点';
COMMENT ON TABLE project_tasks IS 'E-14: 项目任务关联表，关联任务到项目和里程碑';
COMMENT ON TABLE project_collaborations IS 'E-14: 项目协作记录表，追踪学生在项目中的参与';
COMMENT ON VIEW project_dashboard IS 'E-14: 项目看板视图，展示项目概览';
