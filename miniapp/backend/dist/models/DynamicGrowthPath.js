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
exports.DynamicGrowthPath = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DynamicGrowthPathSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    currentState: {
        overallLevel: String,
        strongestAbilities: [String],
        weakestAbilities: [String],
        completedProjects: Number,
        totalEarnings: Number
    },
    phases: [{
            phaseNumber: Number,
            phaseName: String,
            goal: String,
            duration: String,
            actions: [{
                    actionType: {
                        type: String,
                        enum: ['learn_skill', 'do_project', 'find_mentor', 'join_community', 'other']
                    },
                    title: String,
                    description: String,
                    priority: {
                        type: String,
                        enum: ['high', 'medium', 'low']
                    },
                    estimatedTime: String,
                    expectedOutcome: String
                }],
            recommendedProjects: [{
                    category: String,
                    difficulty: String,
                    reason: String
                }],
            abilityGoals: [{
                    ability: String,
                    currentScore: Number,
                    targetScore: Number,
                    improvementPath: String
                }]
        }],
    milestones: [{
            title: String,
            description: String,
            targetDate: Date,
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: Date
        }],
    predictions: {
        expectedLevel: String,
        expectedTimeframe: String,
        expectedEarnings: Number,
        confidenceLevel: String
    }
}, {
    timestamps: true
});
DynamicGrowthPathSchema.index({ userId: 1, versionNumber: 1 });
DynamicGrowthPathSchema.index({ userId: 1, generatedAt: -1 });
exports.DynamicGrowthPath = mongoose_1.default.model('DynamicGrowthPath', DynamicGrowthPathSchema);
//# sourceMappingURL=DynamicGrowthPath.js.map