import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface FollowData {
  company_id: string;
  student_id: string;
  follow_source?: string;
  follow_reason?: string;
  tags?: string[];
  notes?: string;
}

interface NotificationSettings {
  notify_on_available?: boolean;
  notify_on_level_up?: boolean;
  notify_on_new_skill?: boolean;
}

interface Collection {
  id?: string;
  company_id: string;
  name: string;
  description?: string;
  color?: string;
}

/**
 * E-09: 关注学生服务
 * 管理企业对学生的关注、动态、通知等功能
 */
class FollowService {
  /**
   * 关注学生
   */
  async followStudent(data: FollowData): Promise<any> {
    const { company_id, student_id, follow_source, follow_reason, tags, notes } = data;

    // 检查是否已关注
    const existing = await pool.query(
      `SELECT id FROM student_follows WHERE company_id = $1 AND student_id = $2`,
      [company_id, student_id]
    );

    if (existing.rows.length > 0) {
      throw new Error('已经关注过该学生');
    }

    const result = await pool.query(
      `INSERT INTO student_follows
       (id, company_id, student_id, follow_source, follow_reason, tags, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [uuidv4(), company_id, student_id, follow_source, follow_reason, tags || [], notes]
    );

    return result.rows[0];
  }

  /**
   * 取消关注
   */
  async unfollowStudent(companyId: string, studentId: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM student_follows WHERE company_id = $1 AND student_id = $2`,
      [companyId, studentId]
    );

    if (result.rowCount === 0) {
      throw new Error('未关注该学生');
    }
  }

  /**
   * 检查是否关注
   */
  async isFollowing(companyId: string, studentId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM student_follows WHERE company_id = $1 AND student_id = $2`,
      [companyId, studentId]
    );

    return result.rows.length > 0;
  }

  /**
   * 获取企业关注的学生列表
   */
  async getFollowingStudents(companyId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         sf.*,
         u.id as student_id,
         u.username,
         u.avatar,
         u.student_level,
         u.bio,
         u.followers_count,
         (SELECT COUNT(*) FROM tasks WHERE student_id = u.id AND status = 'completed') as completed_tasks,
         (SELECT AVG(client_rating) FROM tasks WHERE student_id = u.id AND status = 'completed') as avg_rating
       FROM student_follows sf
       JOIN users u ON sf.student_id = u.id
       WHERE sf.company_id = $1
       ORDER BY sf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取关注该学生的企业列表
   */
  async getFollowers(studentId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         sf.*,
         u.id as company_id,
         u.company_name,
         u.avatar,
         u.industry
       FROM student_follows sf
       JOIN users u ON sf.company_id = u.id
       WHERE sf.student_id = $1
       ORDER BY sf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 更新关注设置
   */
  async updateFollowSettings(
    companyId: string,
    studentId: string,
    settings: NotificationSettings & { tags?: string[]; notes?: string }
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (settings.notify_on_available !== undefined) {
      updates.push(`notify_on_available = $${paramIndex++}`);
      values.push(settings.notify_on_available);
    }

    if (settings.notify_on_level_up !== undefined) {
      updates.push(`notify_on_level_up = $${paramIndex++}`);
      values.push(settings.notify_on_level_up);
    }

    if (settings.notify_on_new_skill !== undefined) {
      updates.push(`notify_on_new_skill = $${paramIndex++}`);
      values.push(settings.notify_on_new_skill);
    }

    if (settings.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(settings.tags);
    }

    if (settings.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(settings.notes);
    }

    if (updates.length === 0) {
      throw new Error('没有可更新的设置');
    }

    updates.push(`updated_at = NOW()`);
    values.push(companyId, studentId);

    const query = `
      UPDATE student_follows
      SET ${updates.join(', ')}
      WHERE company_id = $${paramIndex++} AND student_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('未关注该学生');
    }

    return result.rows[0];
  }

  /**
   * 获取学生动态
   */
  async getStudentActivities(studentId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM student_activities
       WHERE student_id = $1 AND is_public = true
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取关注学生的动态流
   */
  async getFollowingActivitiesFeed(companyId: string, limit: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         sa.*,
         u.username as student_name,
         u.avatar as student_avatar,
         u.student_level
       FROM student_activities sa
       JOIN users u ON sa.student_id = u.id
       WHERE sa.student_id IN (
         SELECT student_id FROM student_follows WHERE company_id = $1
       )
       AND sa.is_public = true
       ORDER BY sa.created_at DESC
       LIMIT $2`,
      [companyId, limit]
    );

    return result.rows;
  }

  /**
   * 获取关注通知
   */
  async getFollowNotifications(companyId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         fn.*,
         u.username as student_name,
         u.avatar as student_avatar
       FROM follow_notifications fn
       JOIN users u ON fn.student_id = u.id
       WHERE fn.company_id = $1
       ORDER BY fn.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 标记通知已读
   */
  async markNotificationAsRead(notificationId: string, companyId: string): Promise<void> {
    await pool.query(
      `UPDATE follow_notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [notificationId, companyId]
    );
  }

  /**
   * 标记所有通知已读
   */
  async markAllNotificationsAsRead(companyId: string): Promise<void> {
    await pool.query(
      `UPDATE follow_notifications
       SET is_read = true, read_at = NOW()
       WHERE company_id = $1 AND is_read = false`,
      [companyId]
    );
  }

  /**
   * 获取未读通知数
   */
  async getUnreadNotificationCount(companyId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM follow_notifications
       WHERE company_id = $1 AND is_read = false`,
      [companyId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * 创建收藏夹
   */
  async createCollection(data: Collection): Promise<any> {
    const { company_id, name, description, color } = data;

    const result = await pool.query(
      `INSERT INTO student_collections (id, company_id, name, description, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), company_id, name, description, color || '#1890ff']
    );

    return result.rows[0];
  }

  /**
   * 获取企业的收藏夹列表
   */
  async getCollections(companyId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM student_collections
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId]
    );

    return result.rows;
  }

  /**
   * 更新收藏夹
   */
  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<any> {
    const allowedFields = ['name', 'description', 'color'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有可更新的字段');
    }

    fields.push(`updated_at = NOW()`);
    values.push(collectionId);

    const query = `
      UPDATE student_collections
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('收藏夹不存在');
    }

    return result.rows[0];
  }

  /**
   * 删除收藏夹
   */
  async deleteCollection(collectionId: string, companyId: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM student_collections WHERE id = $1 AND company_id = $2`,
      [collectionId, companyId]
    );

    if (result.rowCount === 0) {
      throw new Error('收藏夹不存在');
    }
  }

  /**
   * 将学生添加到收藏夹
   */
  async addStudentToCollection(collectionId: string, studentId: string): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO collection_students (id, collection_id, student_id)
         VALUES ($1, $2, $3)`,
        [uuidv4(), collectionId, studentId]
      );
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('学生已在该收藏夹中');
      }
      throw error;
    }
  }

  /**
   * 从收藏夹移除学生
   */
  async removeStudentFromCollection(collectionId: string, studentId: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM collection_students WHERE collection_id = $1 AND student_id = $2`,
      [collectionId, studentId]
    );

    if (result.rowCount === 0) {
      throw new Error('学生不在该收藏夹中');
    }
  }

  /**
   * 获取收藏夹中的学生
   */
  async getCollectionStudents(collectionId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.avatar,
         u.student_level,
         u.bio,
         cs.added_at,
         (SELECT COUNT(*) FROM tasks WHERE student_id = u.id AND status = 'completed') as completed_tasks
       FROM collection_students cs
       JOIN users u ON cs.student_id = u.id
       WHERE cs.collection_id = $1
       ORDER BY cs.added_at DESC`,
      [collectionId]
    );

    return result.rows;
  }

  /**
   * 获取关注统计
   */
  async getFollowStats(companyId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_following,
         COUNT(*) FILTER (WHERE last_interaction_at IS NOT NULL) as interacted_students,
         SUM(total_tasks_together) as total_collaborations,
         COUNT(DISTINCT tags) as unique_tags
       FROM student_follows
       WHERE company_id = $1`,
      [companyId]
    );

    const unreadNotifications = await this.getUnreadNotificationCount(companyId);

    return {
      ...result.rows[0],
      total_following: parseInt(result.rows[0].total_following, 10),
      interacted_students: parseInt(result.rows[0].interacted_students, 10),
      total_collaborations: parseInt(result.rows[0].total_collaborations, 10),
      unique_tags: parseInt(result.rows[0].unique_tags, 10),
      unread_notifications: unreadNotifications,
    };
  }

  /**
   * 获取推荐关注的学生
   */
  async getRecommendedStudents(companyId: string, limit: number = 10): Promise<any[]> {
    // 基于企业历史任务，推荐相似技能的学生
    const result = await pool.query(
      `SELECT DISTINCT
         u.id,
         u.username,
         u.avatar,
         u.student_level,
         u.bio,
         u.followers_count,
         (SELECT COUNT(*) FROM tasks WHERE student_id = u.id AND status = 'completed') as completed_tasks,
         (SELECT AVG(client_rating) FROM tasks WHERE student_id = u.id AND status = 'completed') as avg_rating
       FROM users u
       WHERE u.role = 'student'
         AND u.id NOT IN (SELECT student_id FROM student_follows WHERE company_id = $1)
         AND u.id IN (
           SELECT DISTINCT student_id FROM tasks
           WHERE company_id = $1 AND status = 'completed' AND client_rating >= 4.0
         )
       ORDER BY completed_tasks DESC, avg_rating DESC
       LIMIT $2`,
      [companyId, limit]
    );

    return result.rows;
  }
}

export default new FollowService();
