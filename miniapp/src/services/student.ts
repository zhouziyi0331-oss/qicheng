import { request } from '@/utils/request';

// 学生相关API
export const studentAPI = {
  /**
   * 提交OPC测评
   */
  submitOPCTest: (data: {
    answers: Array<{
      questionId: string;
      answer: any;
    }>;
  }) => request<{
    opc_label: string;
    six_dim_scores: {
      openness: number;
      persistence: number;
      curiosity: number;
      collaboration: number;
      empathy: number;
      creativity: number;
    };
    analysis: string;
  }>({
    url: '/api/v1/opc/submit',
    method: 'POST',
    data
  }),

  /**
   * 获取OPC测评结果
   */
  getOPCResult: (userId: string) => request<{
    opc_label: string;
    six_dim_scores: any;
    analysis: string;
    created_at: string;
  }>({
    url: `/api/v1/opc/result/${userId}`,
    method: 'GET'
  }),

  /**
   * 获取学生档案
   */
  getProfile: (studentId: string) => request<{
    id: string;
    name: string;
    avatar_url: string;
    school: string;
    major: string;
    grade: string;
    opc_label: string;
    six_dim_scores: any;
    completed_tasks: number;
    total_earnings: number;
    current_level: number;
  }>({
    url: `/api/v1/student/profile/${studentId}`,
    method: 'GET'
  }),

  /**
   * 更新学生档案
   */
  updateProfile: (data: {
    name?: string;
    avatar_url?: string;
    school?: string;
    major?: string;
    grade?: string;
  }) => request({
    url: '/api/v1/student/profile',
    method: 'PUT',
    data
  }),

  /**
   * 获取成长时间线
   */
  getTimeline: (studentId: string) => request<{
    timeline: Array<{
      id: string;
      event_type: string;
      event_title: string;
      event_desc: string;
      created_at: string;
    }>;
  }>({
    url: `/api/v1/student/timeline/${studentId}`,
    method: 'GET'
  }),

  /**
   * 获取成长报告
   */
  getReport: (studentId: string) => request<{
    report: {
      period: string;
      opc_growth: any;
      task_summary: any;
      skill_improvement: any;
      next_steps: string[];
    };
  }>({
    url: `/api/v1/reports/${studentId}`,
    method: 'GET'
  }),

  /**
   * 获取能力图谱
   */
  getAbilityMap: (studentId: string) => request<{
    six_dim_scores: any;
    skill_tags: string[];
    growth_trend: any;
  }>({
    url: `/api/v1/ability/${studentId}`,
    method: 'GET'
  })
};
