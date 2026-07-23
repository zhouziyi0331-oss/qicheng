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
exports.Favorite = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const FavoriteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemType: {
        type: String,
        enum: ['practice_project', 'real_project', 'decomposition_report', 'comparison_report', 'growth_path', 'achievement'],
        required: true
    },
    itemId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    snapshot: {
        title: { type: String, required: true },
        description: { type: String },
        imageUrl: { type: String },
        tags: [{ type: String }]
    },
    userNote: { type: String },
    category: { type: String },
    isPinned: { type: Boolean, default: false }
}, {
    timestamps: true
});
// 复合索引：确保同一用户不会重复收藏同一项目
FavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });
FavoriteSchema.index({ userId: 1, category: 1 });
exports.Favorite = mongoose_1.default.model('Favorite', FavoriteSchema);
//# sourceMappingURL=Favorite.js.map