/**
 * Phase 3.1: 引路人机制服务
 * 让经验丰富的学生成为新人的引路人，建立传承关系
 */
export interface MentorQualification {
    studentId: string;
    isQualified: boolean;
    qualificationLevel: number;
    totalMentees: number;
    activeMentees: number;
    avgMenteeSatisfaction: number;
    bio?: string;
    specialties: string[];
    availableSlots: number;
}
export interface MentorRelationship {
    id: string;
    mentorStudentId: string;
    menteeStudentId: string;
    relationshipType: 'guide' | 'senior' | 'peer';
    status: 'active' | 'completed' | 'inactive';
    matchedReason: string;
    startedAt: Date;
    totalInteractions: number;
    menteeGrowthScore: number;
}
export interface MentorMatch {
    mentorId: string;
    mentorName: string;
    mentorLevel: number;
    mentorOpcLabel: string;
    qualificationLevel: number;
    matchScore: number;
    matchReason: string;
    specialties: string[];
    bio?: string;
}
declare class MentorRelationshipService {
    /**
     * 检查学生是否有资格成为引路人
     */
    checkQualification(studentId: string): Promise<{
        qualified: boolean;
        reason: string;
        requirements: {
            completedTasks: {
                current: number;
                required: number;
                met: boolean;
            };
            level: {
                current: number;
                required: number;
                met: boolean;
            };
            avgRating: {
                current: number;
                required: number;
                met: boolean;
            };
        };
    }>;
    /**
     * 申请成为引路人
     */
    applyToBeMentor(params: {
        studentId: string;
        applicationReason: string;
        experienceSummary?: string;
        specialties?: string[];
    }): Promise<{
        success: boolean;
        applicationId?: number;
        message: string;
    }>;
    /**
     * 为新人匹配引路人
     * 匹配策略：相似OPC + 同赛道 + 可用名额
     */
    findMentorForStudent(studentId: string): Promise<MentorMatch[]>;
    /**
     * 建立引路人关系
     */
    createRelationship(params: {
        mentorStudentId: string;
        menteeStudentId: string;
        matchedReason: string;
    }): Promise<{
        success: boolean;
        relationshipId?: string;
        message: string;
    }>;
    /**
     * 记录引路人互动
     */
    recordInteraction(params: {
        relationshipId: string;
        interactionType: 'message' | 'advice' | 'encouragement' | 'resource_share';
        content: string;
        mentorStudentId: string;
        menteeStudentId: string;
        context?: any;
    }): Promise<boolean>;
}
declare const _default: MentorRelationshipService;
export default _default;
//# sourceMappingURL=mentorRelationshipService.d.ts.map