import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * AI智能定价建议服务
 * 根据任务描述、等级、赛道，使用AI分析市场行情给出定价建议
 */
export declare const getPricingSuggestion: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 清理过期的定价建议缓存（定时任务调用）
 */
export declare const cleanExpiredPricingSuggestions: () => Promise<void>;
//# sourceMappingURL=pricingSuggestion.d.ts.map