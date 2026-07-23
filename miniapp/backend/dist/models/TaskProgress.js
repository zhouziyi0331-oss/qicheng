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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskProgress = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TaskProgressSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectType: {
        type: String,
        enum: ['practice', 'real'],
        required: true
    },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    projectSnapshot: {
        title: { type: String, required: true },
        description: { type: String, required: true },
        difficulty: { type: String, required: true }
    },
    tasks: [{
            taskNumber: { type: Number, required: true },
            title: { type: String, required: true },
            description: { type: String, required: true },
            approach: { type: String, required: true },
            steps: [{
                    stepNumber: { type: Number, required: true },
                    content: { type: String, required: true },
                    estimatedTime: { type: String, required: true },
                    tips: [{ type: String }]
                }],
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed', 'blocked'],
                default: 'pending'
            },
            progress: { type: Number, default: 0, min: 0, max: 100 },
            startedAt: { type: Date },
            completedAt: { type: Date },
            estimatedDuration: { type: String, required: true },
            actualDuration: { type: String },
            deliverables: [{
                    name: { type: String, required: true },
                    description: { type: String, required: true },
                    url: { type: String },
                    completed: { type: Boolean, default: false }
                }],
            challenges: [{
                    problem: { type: String, required: true },
                    solution: { type: String, required: true },
                    recordedAt: { type: Date, default: Date.now }
                }],
            reflection: {
                whatWorked: [{ type: String }],
                whatToImprove: [{ type: String }],
                lessonsLearned: [{ type: String }]
            }
        }],
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
        type: String,
        enum: ['planning', 'in_progress', 'completed', 'paused'],
        default: 'planning'
    },
    aiRecommendations: [{
            type: {
                type: String,
                enum: ['task_order', 'time_management', 'quality_improvement', 'resource'],
                required: true
            },
            content: { type: String, required: true },
            priority: {
                type: String,
                enum: ['high', 'medium', 'low'],
                default: 'medium'
            },
            createdAt: { type: Date, default: Date.now }
        }],
    projectSummary: {
        totalTimeSpent: { type: String },
        tasksCompleted: { type: Number },
        challengesFaced: { type: Number },
        keyAchievements: [{ type: String }],
        skillsImproved: [{ type: String }],
        nextSteps: [{ type: String }]
    }
}, {
    timestamps: true
});
// 复合索引：确保每个项目只有一个任务进度记录
TaskProgressSchema.index({ userId: 1, projectType: 1, projectId: 1 }, { unique: true });
TaskProgressSchema.index({ userId: 1, status: 1 });
exports.TaskProgress = mongoose_1.default.model('TaskProgress', TaskProgressSchema);
//# sourceMappingURL=TaskProgress.js.map