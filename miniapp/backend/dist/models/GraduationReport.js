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
exports.GraduationReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GraduationReportSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    journeySummary: {
        startDate: Date,
        endDate: Date,
        totalDays: Number,
        firstAssessmentDate: Date,
        lastAssessmentDate: Date,
        assessmentCount: Number
    },
    projectAchievements: {
        practiceProjects: Number,
        realProjects: Number,
        totalProjects: Number,
        projectCategories: [String],
        clientSatisfaction: Number
    },
    abilityGrowth: {
        initialLevel: String,
        finalLevel: String,
        levelUpCount: Number,
        dimensionGrowth: [{
                dimension: String,
                initialScore: Number,
                finalScore: Number,
                growth: Number,
                growthPercent: String
            }],
        allAbilityTags: [String],
        totalAbilityCount: Number,
        mostImprovedDimension: {
            dimension: String,
            growth: Number
        }
    },
    financialSummary: {
        totalEarnings: Number,
        totalWithdrawals: Number,
        currentBalance: Number,
        averageProjectEarnings: Number,
        highestProjectEarnings: Number
    },
    aiEvaluation: {
        overallAssessment: String,
        strengthsAnalysis: String,
        achievementsHighlight: [String],
        growthStory: String,
        futureRecommendations: [String],
        careerPathSuggestions: [String]
    },
    visualData: {
        abilityRadarComparison: {
            initial: mongoose_1.Schema.Types.Mixed,
            final: mongoose_1.Schema.Types.Mixed
        },
        growthCurve: [{
                date: Date,
                overallScore: Number
            }],
        projectTimeline: [{
                date: Date,
                projectTitle: String,
                projectType: {
                    type: String,
                    enum: ['practice', 'real']
                },
                earnings: Number
            }]
    },
    certificate: {
        certificateId: String,
        issuedAt: Date,
        level: String,
        specialization: [String]
    },
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    isUnlocked: {
        type: Boolean,
        default: false
    },
    unlockedAt: Date
}, {
    timestamps: true
});
exports.GraduationReport = mongoose_1.default.model('GraduationReport', GraduationReportSchema);
//# sourceMappingURL=GraduationReport.js.map