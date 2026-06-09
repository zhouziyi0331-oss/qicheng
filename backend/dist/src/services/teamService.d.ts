/**
 * 组队服务
 * 处理队伍创建、成员管理、任务分配、收入分配
 */
interface CreateTeamParams {
    creatorId: string;
    name: string;
    description: string;
    maxMembers: number;
    requiredSkills: string[];
    track: string;
    projectId?: string;
}
interface TeamInfo {
    id: string;
    name: string;
    creatorId: string;
    status: string;
    currentMembers: number;
    maxMembers: number;
    members: TeamMember[];
}
interface TeamMember {
    userId: string;
    role: string;
    assignedModule?: string;
    revenueSharePercent: number;
}
declare class TeamService {
    /**
     * 创建队伍（仅Lv.5及以上）
     */
    createTeam(params: CreateTeamParams): Promise<string>;
    /**
     * 申请加入队伍
     */
    applyToJoinTeam(teamId: string, applicantId: string, message?: string): Promise<void>;
    /**
     * 审核队伍申请
     */
    reviewTeamApplication(teamId: string, leaderId: string, applicantId: string, approved: boolean): Promise<void>;
    /**
     * 分配任务模块
     */
    assignModule(teamId: string, leaderId: string, memberId: string, moduleName: string, moduleDescription: string, revenueSharePercent: number): Promise<void>;
    /**
     * 获取队伍信息
     */
    getTeamInfo(teamId: string): Promise<TeamInfo | null>;
    /**
     * 分配队伍收入
     */
    distributeTeamRevenue(orderId: string, teamId: string, totalRevenue: number): Promise<void>;
    /**
     * 生成邀请链接
     */
    generateInviteLink(teamId: string, creatorId: string, inviteType: 'internal' | 'external'): Promise<{
        inviteCode: string;
        inviteUrl: string;
    }>;
    /**
     * 通过邀请码加入队伍
     */
    joinTeamByInviteCode(inviteCode: string, userId: string): Promise<string>;
    /**
     * 离开队伍
     */
    leaveTeam(teamId: string, userId: string): Promise<void>;
    /**
     * 解散队伍
     */
    disbandTeam(teamId: string, leaderId: string): Promise<void>;
}
declare const _default: TeamService;
export default _default;
//# sourceMappingURL=teamService.d.ts.map