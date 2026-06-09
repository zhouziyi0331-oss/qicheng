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
exports.Invitation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InvitationSchema = new mongoose_1.Schema({
    invitationId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    taskId: {
        type: String,
        required: true,
        index: true,
    },
    companyId: {
        type: String,
        required: true,
        index: true,
    },
    studentId: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending',
        index: true,
    },
    customMessage: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 1,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
    respondedAt: {
        type: Date,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});
// 复合索引用于查询
InvitationSchema.index({ studentId: 1, status: 1 });
InvitationSchema.index({ taskId: 1, status: 1 });
InvitationSchema.index({ companyId: 1, taskId: 1 });
exports.Invitation = mongoose_1.default.model('Invitation', InvitationSchema);
//# sourceMappingURL=Invitation.js.map