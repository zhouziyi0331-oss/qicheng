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
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    outTradeNo: String,
    itemType: {
        type: String,
        enum: ['decomposition_report', 'graduation_report', 'practice_unlock', 'other'],
        required: true,
        index: true
    },
    itemId: {
        type: String,
        required: true,
        index: true
    },
    itemTitle: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'CNY'
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['wechat', 'alipay', 'mock', 'admin_grant'],
        required: true
    },
    paidAt: Date,
    expiredAt: Date,
    remark: String,
    metadata: mongoose_1.Schema.Types.Mixed
}, {
    timestamps: true
});
// 复合索引
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ userId: 1, itemType: 1, itemId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
exports.Payment = mongoose_1.default.model('Payment', PaymentSchema);
//# sourceMappingURL=Payment.js.map