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
exports.ComparisonReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ComparisonReportSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    comparisonNumber: {
        type: Number,
        required: true
    },
    beforeSnapshot: {
        type: {
            type: String,
            enum: ['assessment', 'project']
        },
        refId: mongoose_1.Schema.Types.ObjectId,
        date: Date,
        abilityRadarId: mongoose_1.Schema.Types.ObjectId,
        overallScore: Number
    },
    afterSnapshot: {
        type: {
            type: String,
            enum: ['assessment', 'project']
        },
        refId: mongoose_1.Schema.Types.ObjectId,
        date: Date,
        abilityRadarId: mongoose_1.Schema.Types.ObjectId,
        overallScore: Number
    },
    analysis: {
        dimensionChanges: [{
                dimension: String,
                beforeScore: Number,
                afterScore: Number,
                change: Number,
                changePercent: String,
                evaluation: String
            }],
        newAbilities: [String],
        improvedAbilities: [String],
        stableAbilities: [String],
        overallGrowth: Number,
        summary: String,
        recommendations: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
ComparisonReportSchema.index({ userId: 1, comparisonNumber: 1 });
ComparisonReportSchema.index({ userId: 1, createdAt: -1 });
exports.ComparisonReport = mongoose_1.default.model('ComparisonReport', ComparisonReportSchema);
//# sourceMappingURL=ComparisonReport.js.map