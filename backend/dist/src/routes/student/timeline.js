"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeline = getTimeline;
const db_1 = require("../../utils/db");
// GET /student/timeline
async function getTimeline(req, res, next) {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const timeline = await (0, db_1.query)(`SELECT id, event_type as "eventType", event_title as "eventTitle",
              event_desc as "eventDesc", is_milestone as "isMilestone",
              event_data as "eventData", created_at as "createdAt"
       FROM growth_timeline
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        res.json({ success: true, data: timeline });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=timeline.js.map