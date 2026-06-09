import { request } from '@/utils/request';

// 企业相关API
export const companyAPI = {
  /**
   * 获取企业首页数据
   */
  getDashboard: (companyId: string) => request<{
    overview: {
      total_tasks: number;
      active_tasks: number;
      completed_tasks: number;
      total_spent: number;
    };
    recent_tasks: Array<{
      id: string;
      title: string;
      status: string;
      student_count: number;
      created_at: string;
    }>;
  }>({
    url: `/api/v1/company/dashboard/${companyId}`,
    method: 'GET'
  }),

  /**
   * 发布任务
   */
  createTask: (data: {
    title: string;
    description: string;
    budget: number;
    deadline: string;
    requirements: string[];
    attachments?: string[];
    target_level?: number;
    target_opc_labels?: string[];
  }) => request<{
    taskId: string;
    matchedStudents: Array<{
      studentId: string;
      name: string;
      matchScore: number;
      matchReason: string;
    }>;
  }>({
    url: '/api/v1/tasks/create',
    method: 'POST',
    data
  }),

  /**
   * 获取企业任务列表
   */
  getTasks: (companyId: string, status?: string) => request<{
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      budget: number;
      status: string;
      student_count: number;
      deadline: string;
      created_at: string;
    }>;
  }>({
    url: `/api/v1/company/tasks/${companyId}${status ? `?status=${status}` : ''}`,
    method: 'GET'
  }),

  /**
   * 获取任务匹配的学生
   */
  getMatchedStudents: (taskId: string) => request<{
    students: Array<{
      id: string;
      name: string;
      avatar_url: string;
      opc_label: string;
      match_score: number;
      match_reason: string;
      completed_tasks: number;
      rating: number;
    }>;
  }>({
    url: `/api/v1/tasks/${taskId}/matched-students`,
    method: 'GET'
  }),

  /**
   * 验收任务
   */
  reviewTask: (taskId: string, data: {
    rating: number;
    feedback: string;
    approved: boolean;
  }) => request({
    url: `/api/v1/tasks/${taskId}/review`,
    method: 'POST',
    data
  }),

  /**
   * 获取企业档案
   */
  getProfile: (companyId: string) => request<{
    id: string;
    company_name: string;
    contact_person: string;
    contact_phone: string;
    industry: string;
    company_size: string;
    total_tasks: number;
    total_spent: number;
  }>({
    url: `/api/v1/company/profile/${companyId}`,
    method: 'GET'
  }),

  /**
   * 更新企业档案
   */
  updateProfile: (data: {
    company_name?: string;
    contact_person?: string;
    contact_phone?: string;
    industry?: string;
    company_size?: string;
  }) => request({
    url: '/api/v1/company/profile',
    method: 'PUT',
    data
  })
};
