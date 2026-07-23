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
exports.SecretSpace = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SecretSpaceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    daysSinceJoined: { type: Number, default: 0 },
    consecutiveDays: { type: Number, default: 0 },
    lastCheckInDate: { type: Date },
    moodRecords: [{
            date: { type: Date, required: true },
            mood: {
                type: String,
                enum: ['excited', 'happy', 'normal', 'tired', 'frustrated'],
                required: true
            },
            note: { type: String, default: '' },
            tags: [{ type: String }]
        }],
    privateNotes: [{
            title: { type: String, required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            tags: [{ type: String }]
        }],
    personalMilestones: [{
            title: { type: String, required: true },
            description: { type: String, required: true },
            targetDate: { type: Date },
            completed: { type: Boolean, default: false },
            completedAt: { type: Date }
        }],
    favoriteQuotes: [{
            text: { type: String, required: true },
            author: { type: String },
            savedAt: { type: Date, default: Date.now }
        }],
    settings: {
        theme: {
            type: String,
            enum: ['cat', 'star', 'forest', 'ocean'],
            default: 'cat'
        },
        backgroundColor: { type: String, default: '#FFF5E1' },
        isPublic: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});
// 索引优化
SecretSpaceSchema.index({ userId: 1 });
SecretSpaceSchema.index({ 'moodRecords.date': -1 });
exports.SecretSpace = mongoose_1.default.model('SecretSpace', SecretSpaceSchema);
//# sourceMappingURL=SecretSpace.js.map