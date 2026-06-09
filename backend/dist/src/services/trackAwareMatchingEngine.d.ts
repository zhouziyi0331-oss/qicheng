/**
 * 更新匹配引擎以支持赛道过滤
 * 确保只匹配学生选择的赛道的项目
 */
/**
 * 为学生推荐任务（基于赛道）
 * 只返回学生选择的赛道的任务
 */
export declare function getRecommendedTasksForStudent(studentId: string, limit?: number): Promise<any[]>;
/**
 * 触发任务匹配（企业端）
 * 只匹配符合任务赛道的学生
 */
export declare function triggerTaskMatching(taskId: string): Promise<number>;
declare const _default: {
    getRecommendedTasksForStudent: typeof getRecommendedTasksForStudent;
    triggerTaskMatching: typeof triggerTaskMatching;
};
export default _default;
//# sourceMappingURL=trackAwareMatchingEngine.d.ts.map