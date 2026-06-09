"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaService = void 0;
const aiServiceClient_1 = require("./aiServiceClient");
const errorHandler_1 = require("../middleware/errorHandler");
const uuid_1 = require("uuid");
const db_1 = require("../utils/db");
class QAService {
    /**
     * 实时答疑 - 苏格拉底式引导
     */
    async answerQuestion(request) {
        try {
            const result = await aiServiceClient_1.aiServiceClient.answerQuestion({
                student_id: request.studentId,
                task_id: request.taskId,
                question: request.question,
                context: request.context,
                conversation_history: request.conversationHistory,
            });
            // 保存对话历史到数据库
            await this.saveConversationMessage(request.studentId, request.taskId, request.question, result.answer);
            return result;
        }
        catch (error) {
            console.error('QA service failed:', error);
            throw new errorHandler_1.AppError(error.response?.status || 500, error.response?.data?.message || 'Failed to answer question');
        }
    }
    /**
     * 保存对话消息到数据库
     */
    async saveConversationMessage(studentId, taskId, question, answer) {
        try {
            const conversationId = (0, uuid_1.v4)();
            const query = `
        INSERT INTO conversations (id, student_id, task_id, question, answer, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
            await db_1.pool.query(query, [conversationId, studentId, taskId, question, answer]);
        }
        catch (error) {
            console.error('Failed to save conversation:', error);
            // 不抛出错误，避免影响主流程
        }
    }
    /**
     * 获取对话历史
     */
    async getConversationHistory(conversationId) {
        try {
            const query = `
        SELECT * FROM conversations
        WHERE id = $1
        ORDER BY created_at ASC
      `;
            const result = await db_1.pool.query(query, [conversationId]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError(404, 'Conversation not found');
            }
            const conversation = result.rows[0];
            return {
                conversationId: conversation.id,
                studentId: conversation.student_id,
                taskId: conversation.task_id,
                messages: [
                    {
                        role: 'student',
                        content: conversation.question,
                        timestamp: conversation.created_at,
                    },
                    {
                        role: 'assistant',
                        content: conversation.answer,
                        timestamp: conversation.created_at,
                    },
                ],
                createdAt: conversation.created_at,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            console.error('Failed to get conversation history:', error);
            throw new errorHandler_1.AppError(500, 'Failed to get conversation history');
        }
    }
    /**
     * 获取学生在特定任务的对话历史
     */
    async getConversationByStudentAndTask(studentId, taskId) {
        try {
            const query = `
        SELECT * FROM conversations
        WHERE student_id = $1 AND task_id = $2
        ORDER BY created_at ASC
      `;
            const result = await db_1.pool.query(query, [studentId, taskId]);
            if (result.rows.length === 0) {
                return {
                    conversationId: null,
                    studentId,
                    taskId,
                    messages: [],
                };
            }
            const messages = result.rows.flatMap((row) => [
                {
                    role: 'student',
                    content: row.question,
                    timestamp: row.created_at,
                },
                {
                    role: 'assistant',
                    content: row.answer,
                    timestamp: row.created_at,
                },
            ]);
            return {
                conversationId: result.rows[0].id,
                studentId,
                taskId,
                messages,
                createdAt: result.rows[0].created_at,
                updatedAt: result.rows[result.rows.length - 1].created_at,
            };
        }
        catch (error) {
            console.error('Failed to get conversation:', error);
            throw new errorHandler_1.AppError(500, 'Failed to get conversation');
        }
    }
    /**
     * 格式化答疑结果为前端友好的格式
     */
    formatAnswerForFrontend(response) {
        return {
            answer: response.answer,
            guidanceType: response.guidance_type,
            followUpQuestions: response.follow_up_questions,
            relatedStuckPoints: response.related_stuck_points.map(point => ({
                description: point.description,
                solutionHint: point.solution_hint,
                similarityScore: point.similarity_score,
            })),
            confidenceScore: response.confidence_score,
            createdAt: response.created_at,
        };
    }
    /**
     * 判断是否应该提供直接答案（基于问题类型）
     */
    shouldProvideDirectAnswer(question) {
        const directAnswerKeywords = [
            '是什么',
            '什么是',
            '定义',
            '解释',
            '语法',
            '错误信息',
            'error',
            'syntax',
        ];
        return directAnswerKeywords.some(keyword => question.toLowerCase().includes(keyword.toLowerCase()));
    }
}
exports.qaService = new QAService();
//# sourceMappingURL=qaService.js.map