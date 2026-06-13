-- E-12: 定向培养计划
-- 企业可以为学生制定培养计划，定向培养所需人才

-- 培养计划表
CREATE TABLE cultivation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 计划信息
  plan_name VARCHAR(200) NOT NULL,
  description TEXT,
  target_role VARCHAR(100),  -- '高级前端工程师', 'UI设计师'等

  -- 培养周期
  duration_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 培养目标
  target_skills TEXT[] NOT NULL,
  target_level INTEGER,
  target_task_count INTEGER,

  -- 阶段划分
  phases JSONB NOT NULL,
  -- [
  --   {phase: 1, name: "基础阶段", duration_weeks: 4, skills: ["React基础", "ES6"], tasks: 2},
  --   {phase: 2, name: "进阶阶段", duration_weeks: 8, skills: ["Redux", "TypeScript"], tasks: 4}
  -- ]

  -- 激励机制
  incentives JSONB,
  -- {
  --   "completion_bonus": 1000,  // 完成奖金
  --   "milestone_rewards": [500, 300, 200],  // 里程碑奖励
  --   "skill_bonus_per_item": 100  // 每掌握一项技能奖励
  -- }

  -- 投资预算
  total_budget DECIMAL(10,2),
  spent_amount DECIMAL(10,2) DEFAULT 0,

  -- 进度追踪
  current_phase INTEGER DEFAULT 1,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  skills_acquired TEXT[] DEFAULT '{}',
  tasks_completed_in_plan INTEGER DEFAULT 0,

  -- 状态
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'active', 'paused', 'completed', 'cancelled'

  -- 学生响应
  student_accepted BOOLEAN DEFAULT false,
  student_response TEXT,
  student_responded_at TIMESTAMPTZ,

  -- 评估
  final_evaluation TEXT,
  success_score DECIMAL(3,2),  -- 成功程度评分 (0-1)
  evaluated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, student_id, plan_name)
);

-- 培养阶段进度表
CREATE TABLE cultivation_phase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES cultivation_plans(id) ON DELETE CASCADE,

  phase_number INTEGER NOT NULL,
  phase_name VARCHAR(200),

  -- 阶段目标
  target_skills TEXT[],
  target_tasks INTEGER,

  -- 进度
  skills_acquired TEXT[] DEFAULT '{}',
  tasks_completed INTEGER DEFAULT 0,

  -- 状态
  status VARCHAR(50) DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- 评估
  phase_evaluation TEXT,
  phase_score DECIMAL(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, phase_number)
);

-- 培养任务关联表
CREATE TABLE cultivation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES cultivation_plans(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id),
  phase_number INTEGER,

  -- 任务在计划中的作用
  purpose VARCHAR(100),  -- '技能练习', '实战项目', '能力评估'

  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, task_id)
);

-- 技能学习记录
CREATE TABLE skill_learning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES cultivation_plans(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),

  skill_name VARCHAR(100) NOT NULL,
  skill_category VARCHAR(50),

  -- 学习过程
  learning_started_at TIMESTAMPTZ,
  learning_completed_at TIMESTAMPTZ,

  -- 掌握程度
  proficiency_level DECIMAL(3,2),  -- 0-1
  verified_by_task_id UUID REFERENCES tasks(id),

  -- 认证
  is_certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 培养计划评论/反馈
CREATE TABLE cultivation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES cultivation_plans(id) ON DELETE CASCADE,

  feedback_by UUID NOT NULL REFERENCES users(id),
  feedback_role VARCHAR(50),  -- 'company', 'student', 'admin'

  feedback_type VARCHAR(50),  -- 'progress_update', 'phase_complete', 'suggestion', 'issue'
  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_plans_company ON cultivation_plans(company_id, status);
CREATE INDEX idx_plans_student ON cultivation_plans(student_id, status);
CREATE INDEX idx_plans_status ON cultivation_plans(status, end_date);
CREATE INDEX idx_phase_progress_plan ON cultivation_phase_progress(plan_id, phase_number);
CREATE INDEX idx_cultivation_tasks_plan ON cultivation_tasks(plan_id);
CREATE INDEX idx_cultivation_tasks_task ON cultivation_tasks(task_id);
CREATE INDEX idx_skill_records_plan ON skill_learning_records(plan_id);
CREATE INDEX idx_skill_records_student ON skill_learning_records(student_id, skill_name);
CREATE INDEX idx_cultivation_feedback_plan ON cultivation_feedback(plan_id, created_at DESC);

-- 学生接受培养计划后，创建阶段进度记录
CREATE OR REPLACE FUNCTION initialize_cultivation_phases()
RETURNS TRIGGER AS $$
DECLARE
  phase_item JSONB;
BEGIN
  IF NEW.student_accepted = true AND OLD.student_accepted = false THEN
    -- 更新状态为active
    UPDATE cultivation_plans SET status = 'active' WHERE id = NEW.id;

    -- 为每个阶段创建进度记录
    FOR phase_item IN SELECT * FROM jsonb_array_elements(NEW.phases)
    LOOP
      INSERT INTO cultivation_phase_progress (
        id,
        plan_id,
        phase_number,
        phase_name,
        target_skills,
        target_tasks
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        (phase_item->>'phase')::INTEGER,
        phase_item->>'name',
        ARRAY(SELECT jsonb_array_elements_text(phase_item->'skills')),
        (phase_item->>'tasks')::INTEGER
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_cultivation_phases
AFTER UPDATE ON cultivation_plans
FOR EACH ROW
WHEN (NEW.student_accepted = true AND OLD.student_accepted = false)
EXECUTE FUNCTION initialize_cultivation_phases();

-- 任务完成时更新培养计划进度
CREATE OR REPLACE FUNCTION update_cultivation_progress_on_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 更新培养任务记录
    UPDATE cultivation_tasks
    SET is_completed = true, completed_at = NOW()
    WHERE task_id = NEW.id;

    -- 更新培养计划的任务完成数
    UPDATE cultivation_plans cp
    SET tasks_completed_in_plan = tasks_completed_in_plan + 1,
        spent_amount = spent_amount + NEW.budget,
        completion_percentage = (
          (tasks_completed_in_plan + 1)::DECIMAL /
          (SELECT SUM((phase->>'tasks')::INTEGER) FROM jsonb_array_elements(phases) AS phase)
        ) * 100
    WHERE cp.id IN (SELECT plan_id FROM cultivation_tasks WHERE task_id = NEW.id);

    -- 更新阶段进度
    UPDATE cultivation_phase_progress cpp
    SET tasks_completed = tasks_completed + 1
    WHERE cpp.plan_id IN (SELECT plan_id FROM cultivation_tasks WHERE task_id = NEW.id)
      AND cpp.phase_number = (SELECT phase_number FROM cultivation_tasks WHERE task_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cultivation_progress
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_cultivation_progress_on_task();

-- 阶段完成检查
CREATE OR REPLACE FUNCTION check_phase_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tasks_completed >= NEW.target_tasks THEN
    UPDATE cultivation_phase_progress
    SET status = 'completed', completed_at = NOW()
    WHERE id = NEW.id;

    -- 自动开启下一阶段
    UPDATE cultivation_phase_progress
    SET status = 'in_progress', started_at = NOW()
    WHERE plan_id = NEW.plan_id
      AND phase_number = NEW.phase_number + 1
      AND status = 'not_started';

    -- 更新计划的当前阶段
    UPDATE cultivation_plans
    SET current_phase = NEW.phase_number + 1
    WHERE id = NEW.plan_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_phase_completion
AFTER UPDATE ON cultivation_phase_progress
FOR EACH ROW
WHEN (NEW.tasks_completed IS DISTINCT FROM OLD.tasks_completed)
EXECUTE FUNCTION check_phase_completion();

-- 检查计划完成
CREATE OR REPLACE FUNCTION check_plan_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_phases INTEGER;
  completed_phases INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_phases
  FROM cultivation_phase_progress
  WHERE plan_id = NEW.plan_id;

  SELECT COUNT(*) INTO completed_phases
  FROM cultivation_phase_progress
  WHERE plan_id = NEW.plan_id AND status = 'completed';

  IF total_phases = completed_phases THEN
    UPDATE cultivation_plans
    SET status = 'completed',
        completion_percentage = 100,
        updated_at = NOW()
    WHERE id = NEW.plan_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_plan_completion
AFTER UPDATE ON cultivation_phase_progress
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION check_plan_completion();

-- 扩展用户表，添加培养计划统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS cultivation_plans_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_cultivations INTEGER DEFAULT 0;

-- 更新用户培养统计
CREATE OR REPLACE FUNCTION update_user_cultivation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE users SET cultivation_plans_count = cultivation_plans_count + 1
    WHERE id IN (NEW.company_id, NEW.student_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE users SET completed_cultivations = completed_cultivations + 1
    WHERE id IN (NEW.company_id, NEW.student_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_cultivation_stats
AFTER INSERT OR UPDATE ON cultivation_plans
FOR EACH ROW
EXECUTE FUNCTION update_user_cultivation_stats();

COMMENT ON TABLE cultivation_plans IS 'E-12: 定向培养计划，企业为学生制定培养方案';
COMMENT ON TABLE cultivation_phase_progress IS '培养阶段进度';
COMMENT ON TABLE cultivation_tasks IS '培养任务关联';
COMMENT ON TABLE skill_learning_records IS '技能学习记录';
COMMENT ON TABLE cultivation_feedback IS '培养计划反馈';
