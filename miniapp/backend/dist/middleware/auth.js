"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authenticateToken = exports.authMiddleware = void 0;
// 重导出 auth.middleware.ts 中的内容，保持向后兼容
var auth_middleware_1 = require("./auth.middleware");
Object.defineProperty(exports, "authMiddleware", { enumerable: true, get: function () { return auth_middleware_1.authMiddleware; } });
Object.defineProperty(exports, "authenticateToken", { enumerable: true, get: function () { return auth_middleware_1.authenticateToken; } });
Object.defineProperty(exports, "optionalAuthMiddleware", { enumerable: true, get: function () { return auth_middleware_1.optionalAuthMiddleware; } });
//# sourceMappingURL=auth.js.map