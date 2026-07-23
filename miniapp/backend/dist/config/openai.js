"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_CONFIG = exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
exports.openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || ''
});
exports.AI_CONFIG = {
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
    maxTokens: 3000
};
//# sourceMappingURL=openai.js.map