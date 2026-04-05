-- ============================================================
-- 启程 (Qicheng) · 数据库索引
-- ============================================================

-- users
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_wechat_openid ON users(wechat_openid) WHERE wechat_openid IS NOT NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- student_profiles
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_opc_label ON student_profiles(opc_label) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_profiles_level ON student_profiles(level_a, level_b) WHERE deleted_at IS NULL;

-- test_results
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_current ON test_results(user_id, is_current) WHERE is_current = TRUE;
-- pgvector IVFFlat索引 (在 004_vector_setup.sql 中创建, 需先有数据)

-- tasks
CREATE INDEX idx_tasks_company_id ON tasks(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_level_track ON tasks(level_required, track) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_tasks_is_first_task ON tasks(is_first_task) WHERE is_first_task = TRUE;

-- task_assignments
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_student_id ON task_assignments(student_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status) WHERE deleted_at IS NULL;

-- task_submissions
CREATE INDEX idx_task_submissions_task_student ON task_submissions(task_id, student_id);
CREATE INDEX idx_task_submissions_status ON task_submissions(status);

-- task_steps
CREATE INDEX idx_task_steps_task_student ON task_steps(task_id, student_id);

-- payments
CREATE INDEX idx_payments_task_id ON payments(task_id);
CREATE INDEX idx_payments_student_id ON payments(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
-- 首单结算 cron job 扫描
CREATE INDEX idx_payments_first_task_pending ON payments(status, is_first_task, settled_at)
  WHERE is_first_task = TRUE AND status = 'escrowed' AND settled_at IS NULL;

-- student_balances
CREATE INDEX idx_student_balances_user_id ON student_balances(user_id);

-- withdrawals
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_withdrawals_status ON withdrawals(status) WHERE deleted_at IS NULL;

-- contact_unlocks
CREATE INDEX idx_contact_unlocks_student ON contact_unlocks(student_id);
CREATE INDEX idx_contact_unlocks_company ON contact_unlocks(company_id);

-- opc_reports
CREATE INDEX idx_opc_reports_user_id ON opc_reports(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opc_reports_status ON opc_reports(status) WHERE deleted_at IS NULL;

-- growth_timeline
CREATE INDEX idx_growth_timeline_user_id ON growth_timeline(user_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_growth_timeline_event_type ON growth_timeline(user_id, event_type);

-- emotion_signals
CREATE INDEX idx_emotion_signals_user_id ON emotion_signals(user_id, detected_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_emotion_signals_unresolved ON emotion_signals(user_id, signal_type)
  WHERE resolved_at IS NULL AND deleted_at IS NULL;

-- story_wall_posts
-- RULE: NO LEADERBOARD — 绝不创建基于 likes 的排序索引 (See PRD Ch.09)
CREATE INDEX idx_story_wall_posts_feed ON story_wall_posts(track, level, created_at DESC)
  WHERE status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_story_wall_posts_user ON story_wall_posts(user_id) WHERE deleted_at IS NULL;

-- user_tags
CREATE INDEX idx_user_tags_user_category ON user_tags(user_id, tag_category);
CREATE INDEX idx_user_tags_opc_label ON user_tags(tag_value) WHERE tag_category = 'opc_label';

-- notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = FALSE AND deleted_at IS NULL;

-- chat_messages
CREATE INDEX idx_chat_messages_task_id ON chat_messages(task_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- admin_operation_logs
CREATE INDEX idx_admin_logs_admin_id ON admin_operation_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_target ON admin_operation_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created_at ON admin_operation_logs(created_at DESC);

-- onboarding_status
CREATE INDEX idx_onboarding_status_user_id ON onboarding_status(user_id);
CREATE INDEX idx_onboarding_incomplete ON onboarding_status(is_completed, current_step)
  WHERE is_completed = FALSE;

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
