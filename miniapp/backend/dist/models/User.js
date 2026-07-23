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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    openId: { type: String, required: true, unique: true, index: true },
    unionId: { type: String },
    nickname: { type: String, required: true },
    avatar: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    wechatId: { type: String },
    company: { type: String },
    track: { type: String, enum: ['content', 'dev'] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    // 财务余额字段
    balance: { type: Number, default: 0, min: 0 },
    totalWithdrawal: { type: Number, default: 0, min: 0 },
    // OPC测评相关
    personalityTag: { type: String },
    opcCompleted: { type: Boolean, default: false },
    opcCompletedAt: { type: Date },
    lifeQuestion: { type: String },
    // 数据标记
    isTestData: { type: Boolean, default: false }
}, {
    timestamps: true
});
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map