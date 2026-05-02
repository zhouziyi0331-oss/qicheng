"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agreementController_1 = require("../controllers/agreementController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 协议管理路由
router.get('/agreements', agreementController_1.AgreementController.getActiveAgreements);
router.get('/agreements/:type', agreementController_1.AgreementController.getAgreementByType);
router.post('/agreements/sign', auth_1.authenticate, agreementController_1.AgreementController.signAgreement);
router.get('/agreements/check/status', auth_1.authenticate, agreementController_1.AgreementController.checkUserAgreements);
router.get('/agreements/signatures/history', auth_1.authenticate, agreementController_1.AgreementController.getUserSignatures);
// 数据授权路由
router.get('/authorization/settings', auth_1.authenticate, agreementController_1.DataAuthorizationController.getAuthorizationSettings);
router.put('/authorization/update', auth_1.authenticate, agreementController_1.DataAuthorizationController.updateAuthorization);
router.put('/authorization/batch-update', auth_1.authenticate, agreementController_1.DataAuthorizationController.batchUpdateAuthorizations);
router.get('/authorization/history', auth_1.authenticate, agreementController_1.DataAuthorizationController.getAuthorizationHistory);
// 必读条款路由
router.post('/terms/confirm', auth_1.authenticate, agreementController_1.MandatoryTermsController.confirmTerm);
router.get('/terms/check/status', auth_1.authenticate, agreementController_1.MandatoryTermsController.checkUserTerms);
router.get('/terms/history', auth_1.authenticate, agreementController_1.MandatoryTermsController.getUserTerms);
exports.default = router;
//# sourceMappingURL=agreement.js.map