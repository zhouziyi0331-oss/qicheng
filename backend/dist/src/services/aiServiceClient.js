"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';
class AIServiceClient {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: AI_SERVICE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    // 交付物预检
    async preCheckSubmission(data) {
        const response = await this.client.post('/api/ai/pre-check-submission', data);
        return response.data;
    }
    // 进步识别
    async getProgressFeedback(data) {
        const response = await this.client.post('/api/ai/progress-feedback', data);
        return response.data;
    }
    // 任务拆解
    async breakdownTask(data) {
        const response = await this.client.post('/api/ai/task-breakdown/breakdown', data);
        return response.data;
    }
    // 实时答疑
    async answerQuestion(data) {
        const response = await this.client.post('/api/ai/qa/ask', data);
        return response.data;
    }
    // 邀请制匹配 - 为任务匹配学生
    async matchStudentsForTask(data) {
        const response = await this.client.post('/api/ai/matching/match-students', data);
        return response.data;
    }
    // 邀请制匹配 - 为学生匹配任务
    async matchTasksForStudent(data) {
        const response = await this.client.post('/api/ai/matching/match-tasks', data);
        return response.data;
    }
    // 动态能力画像更新
    async updateProfile(data) {
        const response = await this.client.post('/api/ai/profile/update', data);
        return response.data;
    }
    // 健康检查
    async healthCheck() {
        const response = await this.client.get('/api/ai/health');
        return response.data;
    }
    // AI导师对话（通用chat接口）
    async chat(data) {
        const response = await this.client.post('/api/ai/chat', data);
        return response.data;
    }
}
exports.aiServiceClient = new AIServiceClient();
//# sourceMappingURL=aiServiceClient.js.map