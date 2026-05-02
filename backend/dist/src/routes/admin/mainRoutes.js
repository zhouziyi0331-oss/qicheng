"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 管理端主路由
 * 整合所有管理端功能模块
 */
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const studentRoutes_1 = __importDefault(require("./studentRoutes"));
const companyRoutes_1 = __importDefault(require("./companyRoutes"));
const taskRoutes_1 = __importDefault(require("./taskRoutes"));
const orderRoutes_1 = __importDefault(require("./orderRoutes"));
const mentorRoutes_1 = __importDefault(require("./mentorRoutes"));
const aiRoutes_1 = __importDefault(require("./aiRoutes"));
const contentRoutes_1 = __importDefault(require("./contentRoutes"));
const financeRoutes_1 = __importDefault(require("./financeRoutes"));
const systemRoutes_1 = __importDefault(require("./systemRoutes"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// 认证相关（无需token）
router.use('/auth', authRoutes_1.default);
// 以下路由都需要认证
router.use('/dashboard', auth_1.authenticate, dashboardRoutes_1.default);
router.use('/students', auth_1.authenticate, studentRoutes_1.default);
router.use('/companies', auth_1.authenticate, companyRoutes_1.default);
router.use('/tasks', auth_1.authenticate, taskRoutes_1.default);
router.use('/orders', auth_1.authenticate, orderRoutes_1.default);
router.use('/mentor', auth_1.authenticate, mentorRoutes_1.default);
router.use('/ai', auth_1.authenticate, aiRoutes_1.default);
router.use('/content', auth_1.authenticate, contentRoutes_1.default);
router.use('/finance', auth_1.authenticate, financeRoutes_1.default);
router.use('/system', auth_1.authenticate, systemRoutes_1.default);
exports.default = router;
//# sourceMappingURL=mainRoutes.js.map