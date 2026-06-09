import { Request, Response, NextFunction } from 'express';
/**
 * 社区控制器
 */
export declare function createPost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPosts(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPostDetail(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function applyToPost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function reviewApplication(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPostApplications(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function closePost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deletePost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMyPosts(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMyApplications(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=communityController.d.ts.map