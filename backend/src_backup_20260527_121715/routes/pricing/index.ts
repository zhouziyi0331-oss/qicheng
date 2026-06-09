import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getPricingSuggestion } from '../../services/pricingSuggestion';

const router = Router();

// AI智能定价建议
router.post('/pricing-suggestion', authenticate, getPricingSuggestion);

export default router;
