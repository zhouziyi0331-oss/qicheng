/**
 * 学生行为观察服务
 * 持续观察学生的行为，建立对学生的深度理解
 */
interface StudentObservation {
    studentId: string;
    behaviorType: string;
    context: any;
    emotionalState?: {
        confidence: number;
        frustration: number;
        engagement: number;
    };
    workPattern?: {
        timeOfDay: string;
        sessionLength: number;
        breakFrequency: number;
    };
}
interface CompanyObservation {
    companyId: string;
    studentId: string;
    taskId: string;
    feedbackType: string;
    originalWords: string;
    tone?: string;
    preferences?: any;
}
declare class TeacherObservationService {
    /**
     * 记录学生行为事件
     */
    recordStudentBehavior(observation: StudentObservation): Promise<void>;
    /**
     * 记录企业反馈观察
     */
    recordCompanyFeedback(observation: CompanyObservation): Promise<void>;
    /**
     * 获取学生最近的行为记录
     */
    getRecentBehaviors(studentId: string, limit?: number): Promise<any[]>;
    /**
     * 获取学生在特定任务中的行为
     */
    getTaskBehaviors(studentId: string, taskId: string): Promise<any[]>;
    /**
     * 分析并更新学生的行为模式
     */
    private analyzeAndUpdatePatterns;
    /**
     * 识别关键时刻
     */
    private identifyKeyMoments;
    /**
     * 获取学生的关键时刻
     */
    getKeyMoments(studentId: string, limit?: number): Promise<any[]>;
}
declare const _default: TeacherObservationService;
export default _default;
//# sourceMappingURL=teacherObservationService.d.ts.map