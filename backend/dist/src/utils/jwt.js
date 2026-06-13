"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.generateTokens = generateTokens;
exports.verifyToken = verifyToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
/**
 * Generate a single JWT token (for backward compatibility)
 */
function generateToken(payload) {
    const jti = require('crypto').randomBytes(16).toString('hex');
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, {
        expiresIn: config_1.config.jwt.accessExpiry,
        jwtid: jti,
    });
}
/**
 * Generate access + refresh token pair
 */
function generateTokens(payload) {
    const jti = require('crypto').randomBytes(16).toString('hex');
    const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, {
        expiresIn: config_1.config.jwt.accessExpiry,
        jwtid: jti + '-a',
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiry,
        jwtid: jti + '-r',
    });
    return { accessToken, refreshToken };
}
/**
 * Verify a JWT token
 */
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
}
/**
 * Verify a refresh token
 */
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
}
//# sourceMappingURL=jwt.js.map