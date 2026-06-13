"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
/**
 * Express-validator validation middleware
 * Checks for validation errors and returns 400 if any are found
 */
function validate(req, _res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return next(new errorHandler_1.AppError(400, `${firstError.msg}`, 'VALIDATION_ERROR', errors.array()));
    }
    next();
}
//# sourceMappingURL=validate.js.map