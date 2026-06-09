import axios, { AxiosInstance } from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';

class AIServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // 交付物预检
  async preCheckSubmission(data: {
    task_id: string;
    student_id: string;
    submission_description: string;
    attachments: string[];
  }) {
    const response = await this.client.post('/api/ai/pre-check-submission', data);
    return response.data;
  }

  // 进步识别
  async getProgressFeedback(data: {
    student_id: string;
    task_id: string;
  }) {
    const response = await this.client.post('/api/ai/progress-feedback', data);
    return response.data;
  }

  // 任务拆解
  async breakdownTask(data: {
    task_id: string;
    student_id: string;
  }) {
    const response = await this.client.post('/api/ai/task-breakdown/breakdown', data);
    return response.data;
  }

  // 实时答疑
  async answerQuestion(data: {
    student_id: string;
    task_id: string;
    question: string;
    context?: string;
    conversation_history?: Array<{ role: string; content: string }>;
  }) {
    const response = await this.client.post('/api/ai/qa/ask', data);
    return response.data;
  }

  // 邀请制匹配 - 为任务匹配学生
  async matchStudentsForTask(data: {
    task_id: string;
    limit?: number;
  }) {
    const response = await this.client.post('/api/ai/matching/match-students', data);
    return response.data;
  }

  // 邀请制匹配 - 为学生匹配任务
  async matchTasksForStudent(data: {
    student_id: string;
    limit?: number;
  }) {
    const response = await this.client.post('/api/ai/matching/match-tasks', data);
    return response.data;
  }

  // 动态能力画像更新
  async updateProfile(data: {
    student_id: string;
    task_id: string;
    performance: {
      rating: number;
      completion_time: number;
      feedback?: string;
      stuck_points_count?: number;
      revision_count?: number;
    };
  }) {
    const response = await this.client.post('/api/ai/profile/update', data);
    return response.data;
  }

  // 健康检查
  async healthCheck() {
    const response = await this.client.get('/api/ai/health');
    return response.data;
  }

  // AI导师对话（通用chat接口）
  async chat(data: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system?: string;
  }) {
    const response = await this.client.post('/api/ai/chat', data);
    return response.data;
  }
}

export const aiServiceClient = new AIServiceClient();
