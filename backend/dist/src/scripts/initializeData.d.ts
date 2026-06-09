/**
 * 数据初始化脚本
 * 为现有的任务和学生生成向量和能力画像
 */
/**
 * 初始化所有学生的能力画像
 */
declare function initializeStudentCapabilities(): Promise<void>;
/**
 * 为所有现有任务生成向量和翻译
 */
declare function initializeTaskVectors(): Promise<void>;
export { initializeStudentCapabilities, initializeTaskVectors };
//# sourceMappingURL=initializeData.d.ts.map