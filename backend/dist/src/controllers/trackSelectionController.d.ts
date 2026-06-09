/**
 * 赛道选择控制器
 * 实现学生赛道选择和路径展示功能
 */
import { Request, Response } from 'express';
/**
 * 获取赛道推荐和分析
 * GET /api/v1/students/track-recommendation
 */
export declare function getTrackRecommendation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 选择赛道
 * POST /api/v1/students/select-track
 */
export declare function selectTrack(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取赛道路径对比
 * GET /api/v1/students/track-paths
 */
export declare function getTrackPaths(req: Request, res: Response): Promise<void>;
/**
 * 获取当前用户的赛道信息
 * GET /api/v1/students/my-track
 */
export declare function getMyTrack(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=trackSelectionController.d.ts.map