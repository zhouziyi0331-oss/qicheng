import { Request, Response } from 'express';
/**
 * 第2单完成触发器
 * POST /api/milestone/second-task-complete
 */
export declare const handleSecondTaskComplete: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取OPC故事墙
 * GET /api/story-wall
 */
export declare const getStoryWall: (req: Request, res: Response) => Promise<void>;
/**
 * 提交故事到故事墙
 * POST /api/story-wall/submit
 */
export declare const submitStory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=milestoneController.d.ts.map