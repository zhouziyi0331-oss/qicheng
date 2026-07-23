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
exports.PracticeReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PracticeReportSchema = new mongoose_1.Schema({
    projectId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    whatDid: {
        description: { type: String, required: true },
        items: [{ type: String }]
    },
    problemSolved: {
        coreIssue: { type: String, required: true },
        rootCause: { type: String, required: true },
        improvement: {
            label: { type: String, required: true },
            before: { type: Number, required: true },
            after: { type: Number, required: true }
        }
    },
    replicability: {
        description: { type: String, required: true },
        industries: [{
                name: { type: String, required: true },
                icon: { type: String, required: true },
                level: { type: String, enum: ['high', 'medium'], required: true }
            }]
    },
    learned: {
        highlight: { type: String, required: true },
        items: [{ type: String }]
    },
    rewards: {
        exp: { type: Number, required: true },
        income: { type: Number, required: true },
        cases: { type: Number, required: true }
    }
}, {
    timestamps: true
});
exports.PracticeReport = mongoose_1.default.model('PracticeReport', PracticeReportSchema);
//# sourceMappingURL=PracticeReport.js.map