import { Request, Response } from 'express';
/**
 * 评价系统控制器
 */
export declare const submitRating: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTaskRatings: (req: Request, res: Response) => Promise<void>;
export declare const getUserRatingStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserReceivedRatings: (req: Request, res: Response) => Promise<void>;
export declare const getUserGivenRatings: (req: Request, res: Response) => Promise<void>;
export declare const replyToRating: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRatingTagPresets: (req: Request, res: Response) => Promise<void>;
export declare const checkRatingEligibility: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingRatingTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    submitRating: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getTaskRatings: (req: Request, res: Response) => Promise<void>;
    getUserRatingStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserReceivedRatings: (req: Request, res: Response) => Promise<void>;
    getUserGivenRatings: (req: Request, res: Response) => Promise<void>;
    replyToRating: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getRatingTagPresets: (req: Request, res: Response) => Promise<void>;
    checkRatingEligibility: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getPendingRatingTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=ratingController.d.ts.map