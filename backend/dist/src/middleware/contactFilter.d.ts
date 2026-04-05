import { Request, Response, NextFunction } from 'express';
/**
 * Filter contact information (phone numbers, WeChat IDs, QQ numbers, etc.)
 * from message content. Applied to all chat message endpoints.
 */
export declare function filterContactInfo(content: string): {
    filtered: string;
    wasFiltered: boolean;
};
/**
 * Express middleware: filter contact info from req.body.content
 * for chat message routes.
 */
export declare function contactFilterMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=contactFilter.d.ts.map