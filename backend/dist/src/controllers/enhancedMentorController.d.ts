import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * 增强版导师控制器
 * 统一的API入口，整合情感陪伴和项目实战功能
 */
export declare class EnhancedMentorController {
    /**
     * 统一对话接口
     * POST /api/v1/mentor/chat
     */
    chat(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 初始化新项目
     * POST /api/v1/mentor/projects/init
     */
    initProject(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 获取用户的项目列表
     * GET /api/v1/mentor/projects
     */
    getProjects(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 获取项目详情
     * GET /api/v1/mentor/projects/:projectId
     */
    getProjectDetail(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 任务拆解引导
     * POST /api/v1/mentor/projects/:projectId/decompose
     */
    guideDecomposition(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 评估任务拆解
     * POST /api/v1/mentor/projects/:projectId/evaluate-decomposition
     */
    evaluateDecomposition(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 执行代码
     * POST /api/v1/mentor/projects/:projectId/execute-code
     */
    executeCode(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 获取代码执行历史
     * GET /api/v1/mentor/projects/:projectId/execution-history
     */
    getExecutionHistory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 上传文件
     * POST /api/v1/mentor/projects/:projectId/upload
     */
    uploadFile(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 获取项目文件列表
     * GET /api/v1/mentor/projects/:projectId/files
     */
    getProjectFiles(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 删除文件
     * DELETE /api/v1/mentor/files/:fileId
     */
    deleteFile(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 引导反思
     * POST /api/v1/mentor/projects/:projectId/reflect
     */
    guideReflection(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 保存反思日志
     * POST /api/v1/mentor/projects/:projectId/reflection-log
     */
    saveReflectionLog(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 切换导师模式
     * POST /api/v1/mentor/switch-mode
     */
    switchMode(req: AuthRequest, res: Response): Promise<void>;
    /**
     * 获取导师使用统计
     * GET /api/v1/mentor/stats
     */
    getStats(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: EnhancedMentorController;
export default _default;
//# sourceMappingURL=enhancedMentorController.d.ts.map