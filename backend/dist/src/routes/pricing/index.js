"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const pricingSuggestion_1 = require("../../services/pricingSuggestion");
const router = (0, express_1.Router)();
// AI智能定价建议
router.post('/pricing-suggestion', auth_1.authenticate, pricingSuggestion_1.getPricingSuggestion);
exports.default = router;
//# sourceMappingURL=index.js.map