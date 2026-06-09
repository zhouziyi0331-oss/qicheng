import express from 'express';
import { AgreementController, DataAuthorizationController, MandatoryTermsController } from '../controllers/agreementController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 协议管理路由
router.get('/agreements', AgreementController.getActiveAgreements);
router.get('/agreements/:type', AgreementController.getAgreementByType);
router.post('/agreements/sign', authenticate, AgreementController.signAgreement);
router.get('/agreements/check/status', authenticate, AgreementController.checkUserAgreements);
router.get('/agreements/signatures/history', authenticate, AgreementController.getUserSignatures);

// 数据授权路由
router.get('/authorization/settings', authenticate, DataAuthorizationController.getAuthorizationSettings);
router.put('/authorization/update', authenticate, DataAuthorizationController.updateAuthorization);
router.put('/authorization/batch-update', authenticate, DataAuthorizationController.batchUpdateAuthorizations);
router.get('/authorization/history', authenticate, DataAuthorizationController.getAuthorizationHistory);

// 必读条款路由
router.post('/terms/confirm', authenticate, MandatoryTermsController.confirmTerm);
router.get('/terms/check/status', authenticate, MandatoryTermsController.checkUserTerms);
router.get('/terms/history', authenticate, MandatoryTermsController.getUserTerms);

export default router;
