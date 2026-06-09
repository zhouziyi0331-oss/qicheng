import { Request, Response, NextFunction } from 'express';
export declare function getFeed(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createPost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function likePost(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPeersFeed(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getStoryWall(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function submitStory(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function commentOnStory(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map