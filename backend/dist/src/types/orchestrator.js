"use strict";
/**
 * 编排器类型定义
 * Phase R1: 事件驱动的Agent调度系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorTrigger = exports.AgentEvent = void 0;
// Agent事件类型
var AgentEvent;
(function (AgentEvent) {
    // 学生端事件
    AgentEvent["STUDENT_REGISTERED"] = "student_registered";
    AgentEvent["STUDENT_MESSAGE"] = "student_message";
    AgentEvent["TASK_ACCEPTED"] = "task_accepted";
    AgentEvent["TASK_STARTED"] = "task_started";
    AgentEvent["TASK_SUBMITTED"] = "task_submitted";
    AgentEvent["TASK_COMPLETED"] = "task_completed";
    AgentEvent["TASK_REJECTED"] = "task_rejected";
    AgentEvent["STUCK_DETECTED"] = "stuck_detected";
    AgentEvent["EMOTION_DISTRESS"] = "emotion_distress";
    // 企业端事件
    AgentEvent["ENTERPRISE_POST_TASK"] = "enterprise_post_task";
    AgentEvent["ENTERPRISE_ACCEPT"] = "enterprise_accept";
    AgentEvent["ENTERPRISE_REJECT"] = "enterprise_reject";
    // 系统事件
    AgentEvent["DEADLINE_APPROACHING"] = "deadline_approaching";
    AgentEvent["PROACTIVE_CHECKIN_TRIGGER"] = "proactive_checkin_trigger";
    AgentEvent["REPORT_PURCHASE"] = "report_purchase";
    AgentEvent["GENERATE_REPORT"] = "generate_report";
    AgentEvent["LEVEL_UPGRADED"] = "level_upgraded";
})(AgentEvent || (exports.AgentEvent = AgentEvent = {}));
// 导师触发场景（对应12个触发场景）
var MentorTrigger;
(function (MentorTrigger) {
    MentorTrigger["USER_INITIATED"] = "user_initiated";
    MentorTrigger["TASK_ACCEPTED"] = "task_accepted";
    MentorTrigger["STUCK_HELP_REQUEST"] = "stuck_help_request";
    MentorTrigger["EMOTIONAL_DISTRESS_DETECTED"] = "emotional_distress_detected";
    MentorTrigger["TASK_COMPLETED"] = "task_completed";
    MentorTrigger["PROACTIVE_CHECKIN"] = "proactive_checkin";
    MentorTrigger["TASK_REJECTED_COMFORT"] = "task_rejected_comfort";
    MentorTrigger["MILESTONE_REACHED"] = "milestone_reached";
    MentorTrigger["LONG_SILENCE"] = "long_silence";
    MentorTrigger["BREAKTHROUGH_MOMENT"] = "breakthrough_moment";
    MentorTrigger["PATTERN_RECOGNITION"] = "pattern_recognition";
    MentorTrigger["RELATIONSHIP_DEEPENING"] = "relationship_deepening"; // 关系深化
})(MentorTrigger || (exports.MentorTrigger = MentorTrigger = {}));
//# sourceMappingURL=orchestrator.js.map