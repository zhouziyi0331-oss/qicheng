import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * 草稿箱控制器
 * 功能：任务发布草稿、任务提交草稿的自动保存和恢复
 */
export declare const saveTaskDraft: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTaskDraft: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const saveSubmitDraft: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSubmitDraft: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteDraft: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=draftController.d.ts.map