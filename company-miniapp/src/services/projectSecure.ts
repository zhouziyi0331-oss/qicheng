/**
 * ✅ 企业端项目服务 - 集成横向越权保护
 *
 * 企业特定功能
 */

import { http } from '../utils/secureRequest';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  clientId: string;
  createdAt: string;
  applicantsCount?: number;
}

export interface Student {
  id: string;
  nickname: string;
  avatarUrl: string;
  level: number;
  completedOrders: number;
  phone?: string; // ✅ 后端会自动脱敏
  personalityTag?: string;
}

class ProjectService {
  /**
   * ✅ P0安全: 获取我发布的项目列表
   * 后端会自动过滤只返回当前企业的项目
   */
  async getMyProjects(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Task[]> {
    return await http.get<Task[]>('/tasks/my', params);
  }

  /**
   * 发布新项目
   */
  async createProject(data: {
    title: string;
    description: string;
    reward: number;
    requirements?: string;
    deadline?: string;
  }): Promise<Task> {
    return await http.post<Task>('/tasks', data);
  }

  /**
   * ✅ P0安全: 获取项目详情
   * 后端会校验企业只能查看自己的项目
   */
  async getProjectById(projectId: string): Promise<Task> {
    return await http.get<Task>(`/tasks/${projectId}`);
  }

  /**
   * 更新项目
   */
  async updateProject(projectId: string, data: Partial<Task>): Promise<void> {
    await http.put(`/tasks/${projectId}`, data);
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<void> {
    await http.delete(`/tasks/${projectId}`);
  }

  /**
   * ✅ P0安全: 获取项目的申请者列表
   * 后端会校验只返回自己项目的申请者
   */
  async getProjectApplicants(projectId: string): Promise<Student[]> {
    return await http.get<Student[]>(`/tasks/${projectId}/applicants`);
  }

  /**
   * 批准申请者
   */
  async approveApplicant(projectId: string, studentId: string): Promise<void> {
    await http.post(`/tasks/${projectId}/approve`, { studentId });
  }

  /**
   * 拒绝申请者
   */
  async rejectApplicant(projectId: string, studentId: string, reason?: string): Promise<void> {
    await http.post(`/tasks/${projectId}/reject`, { studentId, reason });
  }
}

export const projectService = new ProjectService();
