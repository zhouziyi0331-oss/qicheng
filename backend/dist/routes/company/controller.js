"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
async function getProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        const profile = await (0, db_1.queryOne)(`SELECT u.id, u.phone, u.nickname,
              cp.company_name, cp.industry, cp.contact_name, cp.contact_position,
              cp.verified_at, cp.total_tasks_posted, cp.total_paid
       FROM users u
       JOIN company_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1`, [userId]);
        if (!profile)
            throw new errorHandler_1.AppError(404, '企业档案不存在', 'NOT_FOUND');
        res.json({ success: true, data: profile });
    }
    catch (err) {
        next(err);
    }
}
async function updateProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        const { companyName, industry, contactName, contactPosition } = req.body;
        await (0, db_1.query)(`UPDATE company_profiles SET
        company_name = COALESCE($1, company_name),
        industry = COALESCE($2, industry),
        contact_name = COALESCE($3, contact_name),
        contact_position = COALESCE($4, contact_position),
        updated_at = NOW()
       WHERE user_id = $5`, [companyName, industry, contactName, contactPosition, userId]);
        res.json({ success: true, message: '信息已更新' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map