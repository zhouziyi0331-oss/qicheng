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
exports.ProfileHistory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CapabilityScoresSchema = new mongoose_1.Schema({
    technical_depth: { type: Number, required: true },
    problem_solving: { type: Number, required: true },
    communication: { type: Number, required: true },
    collaboration: { type: Number, required: true },
    learning_agility: { type: Number, required: true },
    delivery_quality: { type: Number, required: true },
}, { _id: false });
const ProfileSnapshotSchema = new mongoose_1.Schema({
    opc_tag: { type: String, required: true },
    capability_scores: { type: CapabilityScoresSchema, required: true },
}, { _id: false });
const ProfileHistorySchema = new mongoose_1.Schema({
    studentId: {
        type: String,
        required: true,
        index: true,
    },
    taskId: {
        type: String,
        required: true,
    },
    submissionId: {
        type: String,
        required: true,
    },
    previousProfile: {
        type: ProfileSnapshotSchema,
        required: true,
    },
    updatedProfile: {
        type: ProfileSnapshotSchema,
        required: true,
    },
    changes: {
        opc_tag_changed: { type: Boolean, required: true },
        significant_score_changes: [
            {
                dimension: { type: String, required: true },
                old_score: { type: Number, required: true },
                new_score: { type: Number, required: true },
                change: { type: Number, required: true },
            },
        ],
    },
    insights: {
        strengths: [{ type: String }],
        areas_for_improvement: [{ type: String }],
        growth_trajectory: { type: String },
        recommended_next_tasks: [{ type: String }],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});
// 索引用于按时间倒序查询学生的历史记录
ProfileHistorySchema.index({ studentId: 1, createdAt: -1 });
exports.ProfileHistory = mongoose_1.default.model('ProfileHistory', ProfileHistorySchema);
//# sourceMappingURL=ProfileHistory.js.map