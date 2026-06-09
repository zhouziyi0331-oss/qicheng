interface TransferTaskOptions {
    taskId: string;
    fromStudentId: string;
    toStudentId: string;
    reason: string;
}
interface SummonMasterOptions {
    taskId: string;
    studentId: string;
    masterId: string;
    message?: string;
}
declare class ThreeStrikeSafetyNetService {
    /**
     * 检查是否触发三次审核兜底
     */
    checkThreeStrikeTrigger(taskId: string, studentId: string): Promise<boolean>;
    /**
     * 获取可转单的学生列表
     * 条件：同赛道、等级相近、当前任务数<3
     */
    getTransferCandidates(taskId: string, currentStudentId: string): Promise<any[]>;
    /**
     * 执行转单
     * 分润：原学生20%，接包学生80%
     */
    transferTask(options: TransferTaskOptions): Promise<void>;
    /**
     * 获取可召唤的大师列表
     * 条件：已认证、在线、擅长该赛道
     */
    getAvailableMasters(taskId: string): Promise<any[]>;
    /**
     * 召唤大师
     */
    summonMaster(options: SummonMasterOptions): Promise<void>;
    /**
     * 获取三次审核兜底状态
     */
    getThreeStrikeStatus(taskId: string, studentId: string): Promise<any>;
}
declare const _default: ThreeStrikeSafetyNetService;
export default _default;
//# sourceMappingURL=threeStrikeSafetyNetService.d.ts.map