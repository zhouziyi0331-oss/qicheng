"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientContactInfo = getClientContactInfo;
const database_1 = __importDefault(require("../../config/database"));
async function getClientContactInfo(req, res, next) {
    try {
        const studentId = req.user?.id;
        const { clientId } = req.params;
        const collaborationResult = await database_1.default.query(`SELECT COUNT(*) as count,
       AVG(ta.student_rating) as avg_student_rating,
       AVG(ta.client_rating) as avg_client_rating
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.student_id = $1 AND t.client_id = $2 AND ta.status = 'completed'`, [studentId, clientId]);
        const collaboration = collaborationResult.rows[0];
        const collaborationCount = parseInt(collaboration.count);
        if (collaborationCount < 2) {
            res.json({
                success: true,
                data: {
                    unlocked: false,
                    collaborationCount,
                    requiredCount: 2,
                    message: '与该企业合作2次后即可解锁联系方式'
                }
            });
            return;
        }
        const avgStudentRating = parseFloat(collaboration.avg_student_rating || '0');
        const avgClientRating = parseFloat(collaboration.avg_client_rating || '0');
        const mutualRating = Math.round((avgStudentRating + avgClientRating) / 2);
        const clientResult = await database_1.default.query(`SELECT u.name, c.contact_person, c.wechat, c.phone
       FROM users u
       JOIN clients c ON u.id = c.user_id
       WHERE u.id = $1`, [clientId]);
        if (clientResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: '企业信息不存在'
            });
            return;
        }
        const client = clientResult.rows[0];
        res.json({
            success: true,
            data: {
                unlocked: true,
                collaborationCount,
                mutualRating,
                clientName: client.name,
                contactInfo: {
                    contactPerson: client.contact_person,
                    wechat: client.wechat,
                    phone: client.phone
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=client-contact.js.map