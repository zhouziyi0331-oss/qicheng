"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiEngineController_1 = require("../controllers/aiEngineController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = express_1.default.Router();
// AI需求确认路由
router.post('/requirement/start', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), aiEngineController_1.AIRequirementController.startDialogue);
router.post('/requirement/message', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), aiEngineController_1.AIRequirementController.sendMessage);
router.get('/requirement/history/:sessionId', auth_1.authenticate, aiEngineController_1.AIRequirementController.getDialogueHistory);
// AI任务拆解路由
router.post('/decomposition/decompose', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), aiEngineController_1.AITaskDecompositionController.decomposeTask);
router.post('/decomposition/create-subtasks', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), aiEngineController_1.AITaskDecompositionController.createSubtasks);
router.get('/decomposition/subtasks/:taskId', auth_1.authenticate, aiEngineController_1.AITaskDecompositionController.getSubtasks);
// AI任务审核路由
router.post('/review/task', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), aiEngineController_1.AITaskReviewController.reviewTask);
router.post('/review/:reviewId/human', auth_1.authenticate, (0, roleCheck_1.requireRole)('admin'), aiEngineController_1.AITaskReviewController.humanReview);
// AI问答路由
router.post('/qa/ask', auth_1.authenticate, aiEngineController_1.AIQAController.askQuestion);
router.post('/qa/:historyId/helpful', auth_1.authenticate, aiEngineController_1.AIQAController.markHelpful);
exports.default = router;
//# sourceMappingURL=aiEngine.js.map