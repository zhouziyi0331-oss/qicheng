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
exports.PracticeProject = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PracticeProjectSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    track: { type: String, enum: ['content', 'dev'], required: true },
    status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
    tags: [{ type: String }],
    budget: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    expectedEndDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String, required: true },
    deliverables: [{ type: String }],
    companyFeedback: { type: String },
    processData: {
        iterations: { type: Number },
        revisionCount: { type: Number },
        communicationCount: { type: Number },
        toolsUsed: [{ type: String }]
    },
    scores: {
        execution: { type: Number, min: 0, max: 100 },
        problemSolving: { type: Number, min: 0, max: 100 },
        replicability: { type: Number, min: 0, max: 100 }
    }
}, {
    timestamps: true
});
PracticeProjectSchema.index({ userId: 1, status: 1 });
PracticeProjectSchema.index({ track: 1, status: 1 });
exports.PracticeProject = mongoose_1.default.model('PracticeProject', PracticeProjectSchema);
//# sourceMappingURL=PracticeProject.js.map