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
exports.DecompositionReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DecompositionReportSchema = new mongoose_1.Schema({
    projectId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ['generating', 'pending_review', 'completed', 'failed'],
        default: 'generating'
    },
    isUnlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date },
    paymentAmount: { type: Number },
    abilityBreakdown: {
        abilities: [{
                name: { type: String },
                description: { type: String },
                evidence: [{ type: String }],
                marketValue: { type: String }
            }]
    },
    problemValue: {
        painPoint: { type: String },
        rootCause: { type: String },
        impact: { type: String },
        metrics: [{
                label: { type: String },
                before: { type: String },
                after: { type: String }
            }]
    },
    targetCustomers: {
        types: [{
                type: { type: String },
                description: { type: String },
                painPoints: [{ type: String }],
                applicability: { type: String, enum: ['high', 'medium', 'low'] },
                priceRange: { type: String }
            }]
    },
    acquisitionChannels: {
        channels: [{
                name: { type: String },
                difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
                timeToResult: { type: String },
                tactics: [{ type: String }],
                expectedConversion: { type: String }
            }]
    },
    growthPath: {
        foundation: {
            phase: { type: String },
            duration: { type: String },
            goals: [{ type: String }],
            expectedValue: { type: String }
        },
        advanced: {
            phase: { type: String },
            duration: { type: String },
            goals: [{ type: String }],
            expectedValue: { type: String }
        },
        breakthrough: {
            phase: { type: String },
            duration: { type: String },
            goals: [{ type: String }],
            expectedValue: { type: String }
        }
    },
    generationMetadata: {
        aiModel: { type: String },
        promptVersion: { type: String },
        tokensUsed: { type: Number },
        generatedAt: { type: Date },
        reviewedBy: { type: String },
        reviewedAt: { type: Date },
        qualityScore: { type: Number, min: 0, max: 100 }
    }
}, {
    timestamps: true
});
DecompositionReportSchema.index({ userId: 1, isUnlocked: 1 });
DecompositionReportSchema.index({ status: 1 });
exports.DecompositionReport = mongoose_1.default.model('DecompositionReport', DecompositionReportSchema);
//# sourceMappingURL=DecompositionReport.js.map