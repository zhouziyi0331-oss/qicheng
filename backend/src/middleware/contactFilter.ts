import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import logger from '../utils/logger';

const CONTACT_REPLACEMENT = '[联系方式已屏蔽，完成2单后可解锁]';

/**
 * Filter contact information (phone numbers, WeChat IDs, QQ numbers, etc.)
 * from message content. Applied to all chat message endpoints.
 */
export function filterContactInfo(content: string): { filtered: string; wasFiltered: boolean } {
  let filtered = content;
  let wasFiltered = false;

  for (const pattern of config.contactFilterPatterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      wasFiltered = true;
      pattern.lastIndex = 0; // reset again before replace
      filtered = filtered.replace(pattern, CONTACT_REPLACEMENT);
    }
    pattern.lastIndex = 0;
  }

  return { filtered, wasFiltered };
}

/**
 * Express middleware: filter contact info from req.body.content
 * for chat message routes.
 */
export function contactFilterMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body?.content && typeof req.body.content === 'string') {
    const { filtered, wasFiltered } = filterContactInfo(req.body.content);
    if (wasFiltered) {
      logger.info('Contact info filtered from message', {
        taskId: req.params.taskId,
        userId: req.user?.userId,
      });
      req.body.originalContent = req.body.content; // store original (will be encrypted in DB)
      req.body.content = filtered;
      req.body.isFiltered = true;
    }
  }
  next();
}
