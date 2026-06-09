"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = exports.queryOne = exports.query = exports.pool = void 0;
// 数据库连接配置 - 别名导出
// 某些旧服务从 config/database 导入，这里重新导出 utils/db
var db_1 = require("../src/utils/db");
Object.defineProperty(exports, "pool", { enumerable: true, get: function () { return db_1.pool; } });
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return db_1.query; } });
Object.defineProperty(exports, "queryOne", { enumerable: true, get: function () { return db_1.queryOne; } });
Object.defineProperty(exports, "withTransaction", { enumerable: true, get: function () { return db_1.withTransaction; } });
//# sourceMappingURL=database.js.map