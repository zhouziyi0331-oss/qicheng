/**
 * 合作进度服务
 *
 * 功能：
 * 1. 查询合作进度
 * 2. 检查是否可以解锁联系方式
 * 3. 获取解锁状态
 * 4. 生成进度提示文案
 */

import pool from '../utils/db';

interface CollaborationProgress {
  studentId: string;
  companyId: string;
  completedCount: number;
  inProgressCount: number;
  canUnlockContact: boolean;
  contactUnlocked: boolean;
  studentAgreed: boolean | null;
  companyAgreed: boolean | null;
  lastCompletedAt: Date | null;
  avgStudentRating: number | null;
  avgCompanyRating: number | null;
}

class CollaborationProgressService {
  /**
   * 获取合作进度
   */
  async getProgress(studentId: string, companyId: string): Promise<CollaborationProgress> {
    const result = await pool.query(
      `SELECT * FROM collaboration_progress
       WHERE student_id = $1 AND company_id = $2`,
      [studentId, companyId]
    );

    if (result.length === 0) {
      // 返回默认值
      return {
        studentId,
        companyId,
        completedCount: 0,
        inProgressCount: 0,
        canUnlockContact: false,
        contactUnlocked: false,
        studentAgreed: null,
        companyAgreed: null,
        lastCompletedAt: null,
        avgStudentRating: null,
        avgCompanyRating: null,
      };
    }

    const row = result[0];
    return {
      studentId: row.student_id as string,
      companyId: row.company_id as string,
      completedCount: parseInt(row.completed_count, 10),
      inProgressCount: parseInt(row.in_progress_count, 10),
      canUnlockContact: row.can_unlock_contact,
      contactUnlocked: row.contact_unlocked,
      studentAgreed: row.student_agreed,
      companyAgreed: row.company_agreed,
      lastCompletedAt: row.last_completed_at,
      avgStudentRating: row.avg_student_rating ? parseFloat(row.avg_student_rating) : null,
      avgCompanyRating: row.avg_company_rating ? parseFloat(row.avg_company_rating) : null,
    };
  }

  /**
   * 获取进度提示文案
   */
  getProgressHint(progress: CollaborationProgress, currentUserType: 'student' | 'company'): string {
    const { completedCount, canUnlockContact, contactUnlocked, studentAgreed, companyAgreed } =
      progress;

    // 已解锁
    if (contactUnlocked) {
      return '已解锁联系方式，可直接沟通';
    }

    // 可以解锁但还未完成双方授权
    if (canUnlockContact) {
      if (currentUserType === 'student') {
        if (studentAgreed && !companyAgreed) {
          return '你已同意解锁，等待企业确认';
        } else if (!studentAgreed && companyAgreed) {
          return '企业已同意解锁，等待你确认';
        } else if (studentAgreed && companyAgreed) {
          return '双方已同意，联系方式即将解锁';
        } else {
          return '已完成2单，可申请解锁联系方式';
        }
      } else {
        // company
        if (companyAgreed && !studentAgreed) {
          return '您已同意解锁，等待学生确认';
        } else if (!companyAgreed && studentAgreed) {
          return '学生已同意解锁，等待您确认';
        } else if (companyAgreed && studentAgreed) {
          return '双方已同意，联系方式即将解锁';
        } else {
          return '已完成2单，可申请解锁联系方式';
        }
      }
    }

    // 还未达到解锁条件
    const remaining = 2 - completedCount;
    if (remaining > 0) {
      return `再完成 ${remaining} 单可解锁联系方式`;
    }

    return '';
  }

  /**
   * 检查是否可以解锁联系方式
   */
  async canUnlock(studentId: string, companyId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT can_exchange_contacts($1, $2) as can_unlock`,
      [studentId, companyId]
    );

    return result[0].can_unlock;
  }

  /**
   * 获取所有合作进度（用于学生查看所有企业）
   */
  async getStudentCollaborations(studentId: string): Promise<CollaborationProgress[]> {
    const result = await pool.query(
      `SELECT * FROM collaboration_progress
       WHERE student_id = $1
       ORDER BY completed_count DESC, last_completed_at DESC`,
      [studentId]
    );

    return result.map((row) => ({
      studentId: row.student_id,
      companyId: row.company_id,
      completedCount: parseInt(row.completed_count, 10),
      inProgressCount: parseInt(row.in_progress_count, 10),
      canUnlockContact: row.can_unlock_contact,
      contactUnlocked: row.contact_unlocked,
      studentAgreed: row.student_agreed,
      companyAgreed: row.company_agreed,
      lastCompletedAt: row.last_completed_at,
      avgStudentRating: row.avg_student_rating ? parseFloat(row.avg_student_rating) : null,
      avgCompanyRating: row.avg_company_rating ? parseFloat(row.avg_company_rating) : null,
    }));
  }

  /**
   * 获取所有合作进度（用于企业查看所有学生）
   */
  async getCompanyCollaborations(companyId: string): Promise<CollaborationProgress[]> {
    const result = await pool.query(
      `SELECT * FROM collaboration_progress
       WHERE company_id = $1
       ORDER BY completed_count DESC, last_completed_at DESC`,
      [companyId]
    );

    return result.map((row) => ({
      studentId: row.student_id,
      companyId: row.company_id,
      completedCount: parseInt(row.completed_count, 10),
      inProgressCount: parseInt(row.in_progress_count, 10),
      canUnlockContact: row.can_unlock_contact,
      contactUnlocked: row.contact_unlocked,
      studentAgreed: row.student_agreed,
      companyAgreed: row.company_agreed,
      lastCompletedAt: row.last_completed_at,
      avgStudentRating: row.avg_student_rating ? parseFloat(row.avg_student_rating) : null,
      avgCompanyRating: row.avg_company_rating ? parseFloat(row.avg_company_rating) : null,
    }));
  }

  /**
   * 获取进度百分比（用于UI展示）
   */
  getProgressPercentage(completedCount: number): number {
    const target = 2; // 2单解锁
    return Math.min((completedCount / target) * 100, 100);
  }

  /**
   * 获取进度状态
   */
  getProgressStatus(
    progress: CollaborationProgress
  ): 'not_started' | 'in_progress' | 'can_unlock' | 'unlocked' {
    if (progress.contactUnlocked) {
      return 'unlocked';
    }
    if (progress.canUnlockContact) {
      return 'can_unlock';
    }
    if (progress.completedCount > 0 || progress.inProgressCount > 0) {
      return 'in_progress';
    }
    return 'not_started';
  }
}

export default new CollaborationProgressService();
