import { Request } from 'express';
export interface AuditLogParams {
    adminId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    req?: Request;
}
/**
 * 记录管理员操作审计日志
 */
export declare function logAdminAction(params: AuditLogParams): Promise<string>;
/**
 * 查询审计日志
 */
export declare function getAuditLogs(filters: {
    adminId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}): Promise<{
    list: Record<string, unknown>[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}>;
/**
 * 审计日志操作类型常量
 */
export declare const AuditAction: {
    readonly VIEW_STUDENT_DETAIL: "view_student_detail";
    readonly VIEW_COMPANY_DETAIL: "view_company_detail";
    readonly VIEW_PHONE: "view_phone";
    readonly VIEW_EMAIL: "view_email";
    readonly EXPORT_DATA: "export_data";
    readonly UPDATE_STUDENT: "update_student";
    readonly UPDATE_COMPANY: "update_company";
    readonly UPDATE_TASK: "update_task";
    readonly UPDATE_ORDER: "update_order";
    readonly APPROVE_COMPANY: "approve_company";
    readonly REJECT_COMPANY: "reject_company";
    readonly APPROVE_TASK: "approve_task";
    readonly REJECT_TASK: "reject_task";
    readonly APPROVE_WITHDRAWAL: "approve_withdrawal";
    readonly REJECT_WITHDRAWAL: "reject_withdrawal";
    readonly DELETE_STUDENT: "delete_student";
    readonly DELETE_COMPANY: "delete_company";
    readonly DELETE_TASK: "delete_task";
    readonly LOGIN: "login";
    readonly LOGOUT: "logout";
    readonly CHANGE_PASSWORD: "change_password";
    readonly CREATE_ADMIN: "create_admin";
    readonly UPDATE_ADMIN: "update_admin";
    readonly DELETE_ADMIN: "delete_admin";
};
/**
 * 资源类型常量
 */
export declare const ResourceType: {
    readonly STUDENT: "student";
    readonly COMPANY: "company";
    readonly TASK: "task";
    readonly ORDER: "order";
    readonly WITHDRAWAL: "withdrawal";
    readonly ADMIN: "admin";
    readonly SYSTEM: "system";
};
//# sourceMappingURL=auditLog.d.ts.map