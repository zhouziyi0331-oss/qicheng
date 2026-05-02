"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReports = listReports;
exports.orderReport = orderReport;
exports.getReport = getReport;
exports.triggerReportGeneration = triggerReportGeneration;
exports.downloadReportPDF = downloadReportPDF;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
const payment_1 = require("../../utils/payment");
const pdfGeneratorService_1 = require("../../services/pdfGeneratorService");
const REPORT_PRICES = {
    R1: 69, R2: 69, R3: 99, R4: 99, R5: 199, R6: 349, full: 299,
};
const REPORT_NAMES = {
    R1: '能力全景图', R2: '执行力档案', R3: '学习成长曲线',
    R4: '简历包装方案', R5: 'OPC方向报告', R6: '创业综合报告', full: '完整版报告（R1-R5）',
};
// GET /reports — 列表 + 预览钩子 (v7)
async function listReports(req, res, next) {
    try {
        const userId = req.user.userId;
        const purchasedReports = await (0, db_1.query)(`SELECT report_type, status, generated_at
       FROM opc_reports WHERE user_id = $1 AND deleted_at IS NULL`, [userId]);
        const purchasedTypes = new Set(purchasedReports.map((r) => r.report_type));
        // 获取用户数据，生成预览钩子
        const profile = await (0, db_1.queryOne)('SELECT opc_label, six_dim_scores, task_count FROM student_profiles WHERE user_id = $1', [userId]);
        const reportList = Object.keys(REPORT_PRICES).map((type) => {
            const purchased = purchasedTypes.has(type);
            const report = purchasedReports.find((r) => r.report_type === type);
            return {
                type,
                name: REPORT_NAMES[type],
                price: REPORT_PRICES[type],
                purchased,
                status: purchased ? report?.status : 'not_purchased',
                // v7 预览钩子: 让用户在付费前感受到"这个报告说的是我"
                preview: purchased ? null : buildPreviewHook(type, profile),
            };
        });
        res.json({ success: true, data: reportList });
    }
    catch (err) {
        next(err);
    }
}
// POST /reports/order — 购买报告
async function orderReport(req, res, next) {
    try {
        const userId = req.user.userId;
        const { reportType, paymentMethod = 'wechat' } = req.body;
        if (!reportType || !REPORT_PRICES[reportType]) {
            throw new errorHandler_1.AppError(400, '无效的报告类型', 'INVALID_REPORT_TYPE');
        }
        // R6 创业综合报告需要4级及以上学生才能购买
        if (reportType === 'R6') {
            const profile = await (0, db_1.queryOne)('SELECT level_a FROM student_profiles WHERE user_id = $1', [userId]);
            if (!profile || profile.level_a < 4) {
                throw new errorHandler_1.AppError(403, '创业综合报告需要达到4级及以上才能购买', 'LEVEL_TOO_LOW');
            }
        }
        const alreadyPurchased = await (0, db_1.queryOne)(`SELECT id FROM opc_reports WHERE user_id = $1 AND report_type = $2 AND deleted_at IS NULL`, [userId, reportType]);
        if (alreadyPurchased)
            throw new errorHandler_1.AppError(409, '你已购买过此报告', 'ALREADY_PURCHASED');
        const price = REPORT_PRICES[reportType];
        const reportId = (0, uuid_1.v4)();
        const paymentId = (0, uuid_1.v4)();
        await (0, db_1.withTransaction)(async (client) => {
            // 创建报告记录 (待支付)
            await client.query(`INSERT INTO opc_reports (id, user_id, report_type, status, paid_amount)
         VALUES ($1,$2,$3,'pending',$4)`, [reportId, userId, reportType, price]);
            // 创建支付记录
            await client.query(`INSERT INTO payments
          (payment_id, student_id, payer, gross_amount, platform_fee, net_amount, status)
         VALUES ($1,$2,'student',$3,0,$4,'pending')`, [paymentId, userId, price, price]);
        });
        // 生成支付参数
        const reportName = REPORT_NAMES[reportType];
        let paymentParams;
        if (paymentMethod === 'wechat') {
            paymentParams = (0, payment_1.generateWechatPayParams)(paymentId, price, `购买OPC报告-${reportName}`);
        }
        else {
            paymentParams = (0, payment_1.generateAlipayParams)(paymentId, price, `购买OPC报告-${reportName}`);
        }
        res.json({
            success: true,
            data: {
                reportId,
                paymentId,
                amount: price,
                reportName,
                paymentParams,
                message: `报告购买成功后24小时内生成（毕业生R5报告12小时内）`,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /reports/:id — 获取报告内容
async function getReport(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const report = await (0, db_1.queryOne)(`SELECT report_type, status, content_json, generated_at
       FROM opc_reports WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [id, userId]);
        if (!report)
            throw new errorHandler_1.AppError(404, '报告不存在', 'REPORT_NOT_FOUND');
        if (report.status !== 'done') {
            res.json({
                success: true,
                data: {
                    status: report.status,
                    message: report.status === 'generating' ? '报告正在生成中，请稍后查看' : '报告待支付',
                },
            });
            return;
        }
        res.json({ success: true, data: report });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// 内部: 预览钩子构建 (v7 核心设计)
// ============================================================
function buildPreviewHook(reportType, profile) {
    if (!profile)
        return null;
    const hooks = {
        R1: {
            tableOfContents: ['能力全景图总览', '六维度详细分析', '与同类OPC对比', '能力优势报告'],
            previewFirstLines: `你的专业技能和执行力组合很独特——在测试过的用户中，只有约15%的人有这样的搭配...`,
            blurredHint: `你的核心优势是「[模糊显示]」，这让你特别适合做...`,
        },
        R2: {
            tableOfContents: ['任务完成历史分析', '执行模式识别', '可靠度评级', '提升建议'],
            previewFirstLines: `从你完成的 ${profile.task_count || 0} 个任务来看，你的执行模式属于...`,
            blurredHint: `你的可靠度评级是「[模糊显示]」，这意味着...`,
        },
        R5: {
            tableOfContents: ['职业倾向分析', '市场需求匹配', '创新方向建议（3-5个）', '商业可行性评判'],
            previewFirstLines: `基于你的「${profile.opc_label || 'OPC'}」人格标签和实际任务经历...`,
            blurredHint: `你的OPC方向最适合「[模糊显示]」，第一步建议你...`,
        },
        R6: {
            tableOfContents: ['个人能力分析', '创业方向建议', '目标市场分析', '客户获取策略', '公司注册指南', '税务合规要点'],
            previewFirstLines: `基于你完成的 ${profile.task_count || 0} 个任务和能力评估，我们为你定制了创业路径...`,
            blurredHint: `你最适合的创业方向是「[模糊显示]」，目标客户群体是...`,
        },
        full: {
            tableOfContents: ['R1 能力全景图', 'R2 执行力档案', 'R3 学习成长曲线', 'R4 简历包装方案', 'R5 OPC方向报告'],
            previewFirstLines: `这份报告整合了你从注册到现在的完整成长轨迹...`,
            blurredHint: `五份报告告诉你一件事：你最适合做「[模糊显示]」，而且已经有了基础`,
        },
    };
    return hooks[reportType] || {
        previewFirstLines: '深度分析你的OPC能力和成长潜力...',
        blurredHint: '解锁完整报告，了解你的专属成长路径',
    };
}
// ============================================================
// 内部: 触发 AI-05 报告生成 (支付确认后调用)
// ============================================================
async function triggerReportGeneration(reportId, userId) {
    try {
        await (0, db_1.query)(`UPDATE opc_reports SET status = 'generating', generation_started_at = NOW() WHERE id = $1`, [reportId]);
        // 获取用户全量数据（包含具体任务历史）
        const userData = await (0, db_1.query)(`SELECT sp.*, tr.answers_json, tr.opc_label, tr.d1_score, tr.d2_score,
              tr.d3_score, tr.d4_score, tr.d5_score,
              gt.event_type, gt.event_title, gt.event_desc, gt.created_at as timeline_date,
              t.title as task_title, t.description as task_desc,
              ts.company_score, ts.submitted_at, ts.approved_at
       FROM student_profiles sp
       LEFT JOIN test_results tr ON tr.user_id = sp.user_id AND tr.is_current = TRUE
       LEFT JOIN growth_timeline gt ON gt.user_id = sp.user_id
       LEFT JOIN task_submissions ts ON ts.student_id = sp.user_id AND ts.status = 'approved'
       LEFT JOIN tasks t ON t.id = ts.task_id
       WHERE sp.user_id = $1
       ORDER BY ts.approved_at DESC`, [userId]);
        const report = await (0, db_1.queryOne)('SELECT report_type FROM opc_reports WHERE id = $1', [reportId]);
        if (!report)
            return;
        let reportContent;
        let rawResponse = null;
        // R6 创业综合报告使用专门的服务
        if (report.report_type === 'R6') {
            const { StartupReportService } = await Promise.resolve().then(() => __importStar(require('../../services/startupReportService')));
            reportContent = await StartupReportService.generateStartupReport(userId, reportId);
            rawResponse = JSON.stringify(reportContent);
        }
        else {
            // 其他报告类型使用现有的 AI 服务
            const aiResponse = await axios_1.default.post(`${config_1.config.ai.serviceUrl}/ai/generate-report`, { report_id: reportId, user_id: userId, report_type: report.report_type, user_data: userData }, { timeout: config_1.config.ai.reportTimeout });
            reportContent = aiResponse.data.content;
            rawResponse = aiResponse.data.raw_response;
        }
        await (0, db_1.query)(`UPDATE opc_reports
       SET status = 'done', content_json = $1::jsonb, generated_at = NOW(), ai_raw_response = $2
       WHERE id = $3`, [JSON.stringify(reportContent), rawResponse, reportId]);
        // 通知用户
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, content, action_url)
       VALUES ($1, 'report_ready', '你的报告已生成', '你的OPC成长报告已准备好，点击查看', $2)`, [userId, `/reports/${reportId}`]);
    }
    catch (err) {
        await (0, db_1.query)(`UPDATE opc_reports SET status = 'failed' WHERE id = $1`, [reportId]);
        logger_1.default.error('Report generation failed', { reportId, error: err.message });
    }
}
// ============================================================
// GET /reports/:id/pdf — 下载报告PDF
// ============================================================
async function downloadReportPDF(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // 获取报告
        const report = await (0, db_1.queryOne)(`SELECT id, report_type, status, content_json, user_id
       FROM opc_reports
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [id, userId]);
        if (!report) {
            throw new errorHandler_1.AppError(404, '报告不存在', 'REPORT_NOT_FOUND');
        }
        if (report.status !== 'done') {
            throw new errorHandler_1.AppError(403, '报告未完成，无法下载', 'REPORT_NOT_READY');
        }
        // 获取用户信息
        const user = await (0, db_1.queryOne)('SELECT username FROM users WHERE id = $1', [userId]);
        if (!user) {
            throw new errorHandler_1.AppError(404, '用户不存在', 'USER_NOT_FOUND');
        }
        // 生成PDF
        const pdfBuffer = await pdfGeneratorService_1.PDFGeneratorService.generateStartupReportPDF(report.content_json, user.username);
        // 设置响应头
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="startup-report-${id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // 发送PDF
        res.send(pdfBuffer);
    }
    catch (err) {
        logger_1.default.error('Error downloading report PDF:', err);
        next(err);
    }
}
//# sourceMappingURL=controller.js.map