import { Request, Response } from 'express';
/**
 * 获取OPC故事墙列表
 */
export declare function getOPCStories(req: Request, res: Response): Promise<void>;
/**
 * 审核OPC故事
 */
export declare function reviewOPCStory(req: Request, res: Response): Promise<void>;
/**
 * 删除OPC故事
 */
export declare function deleteOPCStory(req: Request, res: Response): Promise<void>;
/**
 * 获取公告列表
 */
export declare function getAnnouncements(req: Request, res: Response): Promise<void>;
/**
 * 创建公告
 */
export declare function createAnnouncement(req: Request, res: Response): Promise<void>;
/**
 * 更新公告
 */
export declare function updateAnnouncement(req: Request, res: Response): Promise<void>;
/**
 * 发布公告
 */
export declare function publishAnnouncement(req: Request, res: Response): Promise<void>;
/**
 * 删除公告
 */
export declare function deleteAnnouncement(req: Request, res: Response): Promise<void>;
/**
 * 获取轮播图列表
 */
export declare function getBanners(req: Request, res: Response): Promise<void>;
/**
 * 创建轮播图
 */
export declare function createBanner(req: Request, res: Response): Promise<void>;
/**
 * 更新轮播图
 */
export declare function updateBanner(req: Request, res: Response): Promise<void>;
/**
 * 删除轮播图
 */
export declare function deleteBanner(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=contentController.d.ts.map