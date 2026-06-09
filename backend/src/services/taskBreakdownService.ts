import { aiServiceClient } from './aiServiceClient';
import { AppError } from '../middleware/errorHandler';

interface TaskBreakdownRequest {
  taskId: string;
  studentId: string;
}

interface TaskBreakdownResponse {
  task_id: string;
  student_id: string;
  breakdown: {
    phases: Array<{
      phase_number: number;
      title: string;
      description: string;
      estimated_hours: number;
      subtasks: Array<{
        title: string;
        description: string;
        estimated_hours: number;
        dependencies?: string[];
      }>;
      success_criteria: string[];
      potential_challenges: string[];
    }>;
    personalized_tips: string[];
    similar_task_references: Array<{
      task_id: string;
      title: string;
      similarity_score: number;
      key_learnings: string[];
    }>;
  };
  breakdown_strategy: string;
  created_at: string;
}

class TaskBreakdownService {
  /**
   * 为学生生成个性化的任务拆解
   */
  async breakdownTask(taskId: string, studentId: string): Promise<TaskBreakdownResponse> {
    try {
      const result = await aiServiceClient.breakdownTask({
        task_id: taskId,
        student_id: studentId,
      });

      return result;
    } catch (error: any) {
      console.error('Task breakdown failed:', error);
      throw new AppError(
        error.response?.status || 500,
        error.response?.data?.message || 'Failed to breakdown task'
      );
    }
  }

  /**
   * 格式化拆解结果为前端友好的格式
   */
  formatBreakdownForFrontend(breakdown: TaskBreakdownResponse) {
    return {
      taskId: breakdown.task_id,
      studentId: breakdown.student_id,
      strategy: breakdown.breakdown_strategy,
      phases: breakdown.breakdown.phases.map(phase => ({
        phaseNumber: phase.phase_number,
        title: phase.title,
        description: phase.description,
        estimatedHours: phase.estimated_hours,
        subtasks: phase.subtasks.map(subtask => ({
          title: subtask.title,
          description: subtask.description,
          estimatedHours: subtask.estimated_hours,
          dependencies: subtask.dependencies || [],
        })),
        successCriteria: phase.success_criteria,
        potentialChallenges: phase.potential_challenges,
      })),
      personalizedTips: breakdown.breakdown.personalized_tips,
      similarTaskReferences: breakdown.breakdown.similar_task_references.map(ref => ({
        taskId: ref.task_id,
        title: ref.title,
        similarityScore: ref.similarity_score,
        keyLearnings: ref.key_learnings,
      })),
      createdAt: breakdown.created_at,
    };
  }
}

export const taskBreakdownService = new TaskBreakdownService();
