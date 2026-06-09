import { request } from '@/utils/request';

// AI导师相关API
export const mentorAPI = {
  /**
   * AI导师对话
   */
  chat: (data: {
    studentId: string;
    taskId: string;
    message: string;
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  }) => request<{
    reply: string;
    suggestions?: string[];
  }>({
    url: '/api/v1/mentor/chat',
    method: 'POST',
    data
  }),

  /**
   * 获取对话历史
   */
  getConversations: (taskId: string) => request<{
    conversations: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      created_at: string;
    }>;
  }>({
    url: `/api/v1/mentor/conversations/${taskId}`,
    method: 'GET'
  }),

  /**
   * 请求任务拆解
   */
  requestBreakdown: (taskId: string) => request<{
    breakdown: {
      steps: Array<{
        title: string;
        description: string;
        estimated_time: string;
      }>;
    };
  }>({
    url: `/api/v1/mentor/breakdown/${taskId}`,
    method: 'POST'
  }),

  /**
   * 请求交付物建议
   */
  requestSubmissionAdvice: (taskId: string, currentWork: string) => request<{
    advice: string;
    checklist: string[];
  }>({
    url: `/api/v1/mentor/submission-advice/${taskId}`,
    method: 'POST',
    data: { currentWork }
  })
};
