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
exports.BackgroundTask = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BackgroundTaskSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    taskType: {
        type: String,
        enum: ['ability_radar', 'comparison_report', 'growth_path', 'graduation_report', 'achievement_check'],
        required: true,
        index: true
    },
    taskName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    relatedId: String,
    metadata: mongoose_1.Schema.Types.Mixed,
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    lastAttemptAt: Date,
    completedAt: Date,
    error: String,
    errorStack: String,
    result: mongoose_1.Schema.Types.Mixed
}, {
    timestamps: true
});
// 复合索引
BackgroundTaskSchema.index({ userId: 1, status: 1 });
BackgroundTaskSchema.index({ status: 1, createdAt: -1 });
BackgroundTaskSchema.index({ userId: 1, taskType: 1, status: 1 });
exports.BackgroundTask = mongoose_1.default.model('BackgroundTask', BackgroundTaskSchema);
//# sourceMappingURL=BackgroundTask.js.map