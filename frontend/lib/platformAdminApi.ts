import { adminApiInstance } from './api';

// ── 平台管理API ──────────────────────────────────────────────

// 提现审核
export const withdrawalAdminApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    adminApiInstance.get('/admin/platform/withdrawals', { params }),

  approve: (id: string, note?: string) =>
    adminApiInstance.post(`/admin/platform/withdrawals/${id}/approve`, { note }),

  reject: (id: string, reason: string) =>
    adminApiInstance.post(`/admin/platform/withdrawals/${id}/reject`, { reason }),

  getStats: () =>
    adminApiInstance.get('/admin/platform/withdrawals/stats'),
};

// 用户认证审核
export const verificationAdminApi = {
  list: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    adminApiInstance.get('/admin/platform/verifications', { params }),

  approve: (id: string, note?: string) =>
    adminApiInstance.post(`/admin/platform/verifications/${id}/approve`, { note }),

  reject: (id: string, reason: string) =>
    adminApiInstance.post(`/admin/platform/verifications/${id}/reject`, { reason }),

  getStats: () =>
    adminApiInstance.get('/admin/platform/verifications/stats'),
};

// 任务审核
export const taskAuditAdminApi = {
  list: (params?: { page?: number; limit?: number; status?: string; risk_level?: string }) =>
    adminApiInstance.get('/admin/platform/task-audits', { params }),

  approve: (id: string, note?: string) =>
    adminApiInstance.post(`/admin/platform/task-audits/${id}/approve`, { note }),

  reject: (id: string, reason: string) =>
    adminApiInstance.post(`/admin/platform/task-audits/${id}/reject`, { reason }),

  flag: (id: string, risk_level: string, reason: string) =>
    adminApiInstance.post(`/admin/platform/task-audits/${id}/flag`, { risk_level, reason }),

  getStats: () =>
    adminApiInstance.get('/admin/platform/task-audits/stats'),
};

// 评价管理
export const ratingAdminApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    adminApiInstance.get('/admin/platform/ratings', { params }),

  hide: (id: string, reason: string) =>
    adminApiInstance.post(`/admin/platform/ratings/${id}/hide`, { reason }),

  show: (id: string) =>
    adminApiInstance.post(`/admin/platform/ratings/${id}/show`),

  getReports: (params?: { page?: number; limit?: number; status?: string }) =>
    adminApiInstance.get('/admin/platform/rating-reports', { params }),

  handleReport: (id: string, action: 'approve' | 'reject', note?: string) =>
    adminApiInstance.post(`/admin/platform/rating-reports/${id}/handle`, { action, note }),

  getStats: () =>
    adminApiInstance.get('/admin/platform/ratings/stats'),
};

// 系统配置
export const systemConfigAdminApi = {
  getAll: () =>
    adminApiInstance.get('/admin/platform/config'),

  get: (key: string) =>
    adminApiInstance.get(`/admin/platform/config/${key}`),

  update: (key: string, value: any, description?: string) =>
    adminApiInstance.put(`/admin/platform/config/${key}`, { value, description }),

  getCategories: () =>
    adminApiInstance.get('/admin/platform/config/categories'),
};

// 平台指标统计
export const platformMetricsApi = {
  getOverview: () =>
    adminApiInstance.get('/admin/platform/metrics/overview'),

  getUserMetrics: (params?: { start_date?: string; end_date?: string }) =>
    adminApiInstance.get('/admin/platform/metrics/users', { params }),

  getTaskMetrics: (params?: { start_date?: string; end_date?: string }) =>
    adminApiInstance.get('/admin/platform/metrics/tasks', { params }),

  getFinanceMetrics: (params?: { start_date?: string; end_date?: string }) =>
    adminApiInstance.get('/admin/platform/metrics/finance', { params }),

  getRiskMetrics: () =>
    adminApiInstance.get('/admin/platform/metrics/risks'),

  getGrowthTrends: (params?: { period?: 'day' | 'week' | 'month'; limit?: number }) =>
    adminApiInstance.get('/admin/platform/metrics/growth', { params }),
};

// 统一导出平台管理API
export const platformAdminAPI = {
  // 提现审核
  getWithdrawals: (params?: any) => withdrawalAdminApi.list(params),
  approveWithdrawal: (id: string, note?: string) => withdrawalAdminApi.approve(id, note),
  rejectWithdrawal: (id: string, reason: string) => withdrawalAdminApi.reject(id, reason),
  getWithdrawalStats: () => withdrawalAdminApi.getStats(),

  // 用户认证审核
  getVerifications: (params?: any) => verificationAdminApi.list(params),
  approveVerification: (id: string, note?: string) => verificationAdminApi.approve(id, note),
  rejectVerification: (id: string, reason: string) => verificationAdminApi.reject(id, reason),
  getVerificationStats: () => verificationAdminApi.getStats(),

  // 任务审核
  getTaskAudits: (params?: any) => taskAuditAdminApi.list(params),
  approveTask: (id: string, note?: string) => taskAuditAdminApi.approve(id, note),
  rejectTask: (id: string, reason: string) => taskAuditAdminApi.reject(id, reason),
  flagTask: (id: string, risk_level: string, reason: string) => taskAuditAdminApi.flag(id, risk_level, reason),
  getTaskAuditStats: () => taskAuditAdminApi.getStats(),

  // 评价管理
  getRatings: (params?: any) => ratingAdminApi.list(params),
  hideRating: (id: string, reason: string) => ratingAdminApi.hide(id, reason),
  showRating: (id: string) => ratingAdminApi.show(id),
  getRatingReports: (params?: any) => ratingAdminApi.getReports(params),
  handleRatingReport: (id: string, action: 'approve' | 'reject', note?: string) =>
    ratingAdminApi.handleReport(id, action, note),
  getRatingStats: () => ratingAdminApi.getStats(),
  deleteRating: (id: string) => adminApiInstance.delete(`/admin/platform/ratings/${id}`),

  // 系统配置
  getConfig: () => systemConfigAdminApi.getAll(),
  getConfigByKey: (key: string) => systemConfigAdminApi.get(key),
  updateConfig: (key: string, value: any, description?: string) =>
    systemConfigAdminApi.update(key, value, description),
  getConfigCategories: () => systemConfigAdminApi.getCategories(),

  // 平台指标
  getMetricsOverview: () => platformMetricsApi.getOverview(),
  getUserMetrics: (params?: any) => platformMetricsApi.getUserMetrics(params),
  getTaskMetrics: (params?: any) => platformMetricsApi.getTaskMetrics(params),
  getFinanceMetrics: (params?: any) => platformMetricsApi.getFinanceMetrics(params),
  getRiskMetrics: () => platformMetricsApi.getRiskMetrics(),
  getGrowthTrends: (params?: any) => platformMetricsApi.getGrowthTrends(params),
};

