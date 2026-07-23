"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectMatchInfo = exports.getMatchedProjects = void 0;
const match_service_1 = require("../services/match.service");
const logger_1 = require("../utils/logger");
/**
 * 项目匹配控制器
 */
/**
 * 获取智能匹配的项目列表
 */
const getMatchedProjects = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 20;
        const matches = await match_service_1.matchService.matchProjects(userId, limit);
        res.json({
            success: true,
            data: matches,
            count: matches.length
        });
    }
    catch (error) {
        logger_1.log.error('获取匹配项目失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getMatchedProjects = getMatchedProjects;
/**
 * 获取单个项目的匹配信息
 */
const getProjectMatchInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        const result = await match_service_1.matchService.getProjectWithMatchReason(userId, projectId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('获取项目匹配信息失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getProjectMatchInfo = getProjectMatchInfo;
//# sourceMappingURL=match.controller.js.map