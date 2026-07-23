"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc';
        await mongoose_1.default.connect(mongoUri);
        console.log('✓ MongoDB连接成功');
    }
    catch (error) {
        console.error('✗ MongoDB连接失败:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
mongoose_1.default.connection.on('error', (err) => {
    console.error('MongoDB运行时错误:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('MongoDB连接断开');
});
//# sourceMappingURL=database.js.map