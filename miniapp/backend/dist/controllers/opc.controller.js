"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = exports.getUserResults = exports.getLatestResult = exports.getResult = exports.submitTest = exports.getQuestions = void 0;
const opc_service_1 = require("../services/opc.service");
const logger_1 = require("../utils/logger");
/**
 * OPC测评控制器
 */
/**
 * 获取所有测试题
 */
const getQuestions = async (req, res) => {
    try {
        const questions = await opc_service_1.opcService.getQuestions();
        res.json({
            success: true,
            data: questions
        });
    }
    catch (error) {
        logger_1.log.error('获取OPC测试题失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getQuestions = getQuestions;
/**
 * 提交OPC测评
 */
const submitTest = async (req, res) => {
    try {
        const userId = req.userId;
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                success: false,
                error: '答案格式错误'
            });
        }
        const result = await opc_service_1.opcService.submitAssessment(userId, answers);
        res.json({
            success: true,
            data: result,
            message: '测评提交成功'
        });
    }
    catch (error) {
        logger_1.log.error('提交OPC测评失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.submitTest = submitTest;
/**
 * 获取用户OPC测评结果
 */
const getResult = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await opc_service_1.opcService.getLatestResult(userId);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: '未找到测评结果'
            });
        }
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('获取OPC测评结果失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getResult = getResult;
/**
 * 获取用户最新的测评结果
 */
const getLatestResult = async (req, res) => {
    try {
        const userId = req.userId;
        const result = await opc_service_1.opcService.getLatestResult(userId);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: '未找到测评结果'
            });
        }
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('获取最新测评结果失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getLatestResult = getLatestResult;
/**
 * 获取用户所有测评历史
 */
const getUserResults = async (req, res) => {
    try {
        const userId = req.userId;
        const results = await opc_service_1.opcService.getUserResults(userId);
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        logger_1.log.error('获取测评历史失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getUserResults = getUserResults;
/**
 * 生成OPC成长报告（占位，后续实现）
 */
const generateReport = async (req, res) => {
    try {
        const { userId } = req.params;
        // TODO: 实现完整的成长报告生成逻辑
        // 包括：成长叙事时间线、工作风格演变分析等
        res.json({
            success: true,
            message: 'OPC成长报告功能开发中',
            data: {
                status: 'coming_soon'
            }
        });
    }
    catch (error) {
        logger_1.log.error('生成OPC报告失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.generateReport = generateReport;
//# sourceMappingURL=opc.controller.js.map