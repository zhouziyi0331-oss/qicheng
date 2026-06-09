/**
 * 前端API兼容层
 *
 * 问题：前端某些API调用使用了完整的 /api/v1/ 前缀路径
 * 解决：创建路由别名，将前端调用映射到实际的后端路由
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=apiCompatibility.d.ts.map