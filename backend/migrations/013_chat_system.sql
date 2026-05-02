-- 聊天系统数据库迁移
-- 创建时间：2024年

-- 1. 聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- active, archived, blocked
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  student_unread_count INTEGER DEFAULT 0,
  company_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_id, company_id)
);

-- 2. 聊天消息表 - 添加缺失列到现有表
DO $$
BEGIN
  -- 检查表是否存在，如果不存在则创建
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='chat_messages') THEN
    CREATE TABLE chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
      sender_type VARCHAR(20),
      message_type VARCHAR(20) DEFAULT 'text',
      content TEXT,
      file_url TEXT,
      file_name TEXT,
      file_size INTEGER,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ELSE
    -- 表已存在，添加缺失的列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='session_id') THEN
      ALTER TABLE chat_messages ADD COLUMN session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='message_type') THEN
      ALTER TABLE chat_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='file_url') THEN
      ALTER TABLE chat_messages ADD COLUMN file_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='file_name') THEN
      ALTER TABLE chat_messages ADD COLUMN file_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='file_size') THEN
      ALTER TABLE chat_messages ADD COLUMN file_size INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='is_read') THEN
      ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='read_at') THEN
      ALTER TABLE chat_messages ADD COLUMN read_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='updated_at') THEN
      ALTER TABLE chat_messages ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
  END IF;
END $$;

-- 3. 消息已读记录表（用于群聊场景扩展）
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_task ON chat_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_student ON chat_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_company ON chat_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user ON message_read_status(user_id);

-- 5. 创建触发器：更新会话最后消息时间
CREATE OR REPLACE FUNCTION update_chat_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET
    last_message_at = NEW.created_at,
    updated_at = CURRENT_TIMESTAMP,
    -- 更新未读计数
    student_unread_count = CASE
      WHEN NEW.sender_type = 'company' THEN student_unread_count + 1
      ELSE student_unread_count
    END,
    company_unread_count = CASE
      WHEN NEW.sender_type = 'student' THEN company_unread_count + 1
      ELSE company_unread_count
    END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_session_last_message ON chat_messages;
CREATE TRIGGER trigger_update_chat_session_last_message
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_last_message();

-- 6. 创建触发器：标记消息已读时减少未读计数
CREATE OR REPLACE FUNCTION update_chat_session_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id UUID;
  v_sender_type VARCHAR(20);
BEGIN
  -- 获取消息的会话ID和发送者类型
  SELECT session_id, sender_type INTO v_session_id, v_sender_type
  FROM chat_messages
  WHERE id = NEW.message_id;

  -- 更新对应的未读计数
  UPDATE chat_sessions
  SET
    student_unread_count = CASE
      WHEN v_sender_type = 'company' AND student_unread_count > 0
      THEN student_unread_count - 1
      ELSE student_unread_count
    END,
    company_unread_count = CASE
      WHEN v_sender_type = 'student' AND company_unread_count > 0
      THEN company_unread_count - 1
      ELSE company_unread_count
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_session_unread_count ON message_read_status;
CREATE TRIGGER trigger_update_chat_session_unread_count
AFTER INSERT ON message_read_status
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_unread_count();

-- 7. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER trigger_chat_sessions_updated_at
BEFORE UPDATE ON chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER trigger_chat_messages_updated_at
BEFORE UPDATE ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. 插入测试数据（可选）
-- 假设已有用户ID 1（学生）和用户ID 2（企业），任务ID 1
-- INSERT INTO chat_sessions (task_id, student_id, company_id) VALUES (1, 1, 2);
-- INSERT INTO chat_messages (session_id, sender_id, sender_type, content) VALUES (1, 2, 'company', '你好，请问这个任务什么时候能完成？');
-- INSERT INTO chat_messages (session_id, sender_id, sender_type, content) VALUES (1, 1, 'student', '您好，预计3天内完成，我会及时更新进度的。');

COMMENT ON TABLE chat_sessions IS '聊天会话表：存储学生和企业之间的聊天会话';
COMMENT ON TABLE chat_messages IS '聊天消息表：存储所有聊天消息';
COMMENT ON TABLE message_read_status IS '消息已读状态表：记录消息的已读状态';
