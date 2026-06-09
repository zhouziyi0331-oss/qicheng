-- Migration: 添加画像可见性控制字段
-- 用途: 控制首单前画像不可见

-- 1. 添加 is_visible_to_student 字段到 user_ability_profiles
ALTER TABLE user_ability_profiles
ADD COLUMN IF NOT EXISTS is_visible_to_student BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visible_since TIMESTAMP WITH TIME ZONE;

-- 2. 为已完成首单的学生设置画像可见
UPDATE user_ability_profiles uap
SET is_visible_to_student = true,
    visible_since = (
        SELECT MIN(ta.accepted_at)
        FROM task_assignments ta
        WHERE ta.student_id = uap.user_id
        AND ta.status = 'completed'
    )
WHERE EXISTS (
    SELECT 1
    FROM task_assignments ta
    WHERE ta.student_id = uap.user_id
    AND ta.status = 'completed'
)
AND is_current = true;

-- 3. 创建触发器：首单完成后自动设置画像可见
CREATE OR REPLACE FUNCTION set_profile_visible_on_first_order()
RETURNS TRIGGER AS $$
BEGIN
    -- 当任务状态变为completed时
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 检查这是否是学生的首单
        IF NOT EXISTS (
            SELECT 1
            FROM task_assignments
            WHERE student_id = NEW.student_id
            AND status = 'completed'
            AND id != NEW.id
        ) THEN
            -- 设置画像可见
            UPDATE user_ability_profiles
            SET is_visible_to_student = true,
                visible_since = NOW()
            WHERE user_id = NEW.student_id
            AND is_current = true
            AND is_visible_to_student = false;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_set_profile_visible ON task_assignments;
CREATE TRIGGER trigger_set_profile_visible
    AFTER UPDATE ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_visible_on_first_order();

-- 4. 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_user_ability_profiles_visible
ON user_ability_profiles(user_id, is_visible_to_student)
WHERE is_current = true;

COMMENT ON COLUMN user_ability_profiles.is_visible_to_student IS '画像是否对学生可见（首单前不可见）';
COMMENT ON COLUMN user_ability_profiles.visible_since IS '画像首次对学生可见的时间';
