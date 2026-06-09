import { request } from '@/utils/request';

// 任务相关API
export const taskAPI = {
  /**
   * 获取任务邀请列表
   */
  getInvitations: (studentId: string) => request<{
    invitations: Array<{
      id: string;
      task_id: string;
      task_title: string;
      task_description: string;
      budget: number;
      company_name: string;
      match_score: number;
      match_reason: string;
      created_at: string;
      expires_at: string;
    }>;
  }>({
    url: `/api/v1/tasks/invitations/${studentId}`,
    method: 'GET'
  }),

  /**
   * 获取我的任务
   */
  getMyTasks: (studentId: string) => request<{
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      budget: number;
      status: string;
      company_name: string;
      deadline: string;
      created_at: string;
    }>;
  }>({
    url: `/api/v1/tasks/my-tasks/${studentId}`,
    method: 'GET'
  }),

  /**
   * 接受任务
   */
  acceptTask: (taskId: string) => request({
    url: `/api/v1/tasks/${taskId}/accept`,
    method: 'POST'
  }),

  /**
   * 拒绝任务
   */
  rejectTask: (taskId: string, reason?: string) => request({
    url: `/api/v1/tasks/${taskId}/reject`,
    method: 'POST',
    data: { reason }
  }),

  /**
   * 获取任务详情
   */
  getTaskDetail: (taskId: string) => request<{
    id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
    company_name: string;
    deadline: string;
    requirements: string[];
    attachments: string[];
    created_at: string;
  }>({
    url: `/api/v1/tasks/${taskId}`,
    method: 'GET'
  }),

  /**
   * 获取任务拆解
   */
  getTaskBreakdown: (taskId: string) => request<{
    breakdown: {
      steps: Array<{
        id: string;
        title: string;
        description: string;
        estimated_time: string;
        order: number;
      }>;
      total_estimated_time: string;
    };
  }>({
    url: `/api/v1/task-breakdown/${taskId}`,
    method: 'GET'
  }),

  /**
   * 交付物预检
   */
  preCheckSubmission: (taskId: string, data: {
    description: string;
    attachments: string[];
  }) => request<{
    score: number;
    feedback: string;
    suggestions: string[];
    pass: boolean;
  }>({
    url: `/api/v1/submissions/${taskId}/pre-check`,
    method: 'POST',
    data
  }),

  /**
   * 提交任务
   */
  submitTask: (taskId: string, data: {
    description: string;
    attachments: string[];
  }) => request({
    url: `/api/v1/tasks/${taskId}/submit`,
    method: 'POST',
    data
  }),

  /**
   * 获取任务进度
   */
  getTaskProgress: (taskId: string) => request<{
    progress: {
      completed_steps: number;
      total_steps: number;
      percentage: number;
      current_step: string;
    };
  }>({
    url: `/api/v1/tasks/${taskId}/progress`,
    method: 'GET'
  })
};
