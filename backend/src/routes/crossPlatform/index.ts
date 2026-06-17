/**
 * 跨端打通路由
 * 企业端和学生端双向联动API
 */

import express from 'express';
import crossPlatformService from '../../services/crossPlatformService';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

// C-01: 需求变更的实时匹配更新
router.post('/tasks/:taskId/requirement-change', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { old_requirements, new_requirements } = req.body;
    const userId = req.user?.userId;
    
    const result = await crossPlatformService.recordRequirementChange({
      task_id: taskId,
      changed_by: userId as string,
      old_requirements,
      new_requirements
    });
    
    res.json({
      success: true,
      data: result,
      message: `需求已更新，已通知${result.affected_students_count}名匹配学生`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 学生端: 获取匹配更新通知
router.get('/students/:studentId/matching-updates', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = await crossPlatformService.getMatchingUpdatesForStudent(studentId);
    
    res.json({ success: true, data: updates, count: updates.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// C-03: 企业端"等一个人"功能
router.post('/watch-student', authenticate, async (req, res) => {
  try {
    const companyId = req.user?.userId;
    const { student_id, watch_condition, note } = req.body;
    
    const result = await crossPlatformService.setWatchStudent(
      String(companyId), student_id, watch_condition, note
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// C-05: 任务进度更新
router.post('/tasks/:taskId/progress', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const studentId = req.user?.userId;
    const { stage, progress_percentage, estimated_completion } = req.body;
    
    const result = await crossPlatformService.updateTaskProgress(
      taskId, String(studentId || ''), stage, progress_percentage, estimated_completion
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 企业端: 查看任务进度
router.get('/tasks/:taskId/progress', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user?.userId;
    const progress = await crossPlatformService.getTaskProgress(taskId, String(companyId || ''));
    
    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// C-09: 企业关注学生
router.post('/follow-student', authenticate, async (req, res) => {
  try {
    const companyId = req.user?.userId;
    const { student_id, reason, source } = req.body;
    
    const result = await crossPlatformService.followStudent(
      String(companyId || ''), student_id, reason, source
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 企业端: 获取关注的学生动态
router.get('/followed-students-updates', authenticate, async (req, res) => {
  try {
    const companyId = req.user?.userId;
    const updates = await crossPlatformService.getFollowedStudentsUpdates(String(companyId || ''));
    
    res.json({ success: true, data: updates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 学生端: 获取我的关注者
router.get('/my-followers', authenticate, async (req, res) => {
  try {
    const studentId = req.user?.userId;
    const followers = await crossPlatformService.getStudentFollowers(String(studentId || ''));
    
    res.json({ success: true, data: followers, count: followers.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// C-08: 双向评价
router.post('/tasks/:taskId/mutual-rating', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await crossPlatformService.createMutualRating({
      task_id: taskId,
      ...req.body
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取关系标签
router.get('/relationship-badges', authenticate, async (req, res) => {
  try {
    const { company_id, student_id } = req.query;
    const badges = await crossPlatformService.getRelationshipBadges(
      company_id as string, student_id as string
    );
    
    res.json({ success: true, data: badges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 学生端: 添加创作说明
router.post('/tasks/:taskId/creation-notes', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const studentId = req.user?.userId;
    
    const result = await crossPlatformService.addCreationNotes({
      task_id: taskId,
      student_id: studentId,
      ...req.body
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
