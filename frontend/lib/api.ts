import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({ baseURL: BASE });

// 自动附加 JWT
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin API 实例（使用独立的 adminToken）
export const adminApiInstance = axios.create({ baseURL: BASE });

adminApiInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiInstance.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      // Admin token过期，清除并跳转登录
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        document.cookie = "adminToken=; path=/; max-age=0";
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

// 401 自动刷新 token
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const rt = localStorage.getItem("refreshToken");
        if (!rt) throw new Error("no refresh token");
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt });
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        document.cookie = "accessToken=; path=/; max-age=0";
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── 认证 ──────────────────────────────────────────────────
export const authApi = {
  sendCode: (phone: string) => api.post("/auth/send-code", { phone }),
  register: (data: {
    phone: string; code: string; password: string;
    role: "student" | "company"; nickname: string;
    userType: "student" | "company"; // 用户类型（注册后不可更改）
    companyName?: string; contactName?: string;
  }) => api.post("/auth/register", data),
  login: (phone: string, password: string) =>
    api.post("/auth/login", { phone, password }),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

// ── AI导师 ────────────────────────────────────────────────
export const mentorApi = {
  sendMessage: (taskId: string, message: string) =>
    api.post("/mentor/message", { taskId, message }),
  getConversations: (taskId: string) =>
    api.get(`/mentor/conversations/${taskId}`),
};

// ── 学生 ──────────────────────────────────────────────────
export const studentApi = {
  getOnboarding: () => api.get("/student/onboarding"),
  getTestQuestions: () => api.get("/student/test/questions"),
  submitTest: (answers: Record<string, string>) =>
    api.post("/student/test/submit", { answers }),
  getProfile: () => api.get("/student/profile"),
  updateProfile: (data: object) => api.post("/student/profile", data),
  getEmotionSignals: () => api.get("/student/emotion-signals"),
  getTimeline: () => api.get("/student/timeline"),
  submitLevelChallenge: (answers: Record<string, string | string[]>) => api.post("/student/level-challenge", { answers }),
};

// ── 任务 ──────────────────────────────────────────────────
export const taskApi = {
  // 任务大厅（所有active任务）
  market: (page = 1) => api.get("/tasks/market", { params: { page, limit: 20 } }),
  // 我的任务（学生）
  myTasks: (status?: string) => api.get("/tasks/my", { params: { status } }),
  // 定向推荐
  recommended: () => api.get("/tasks/recommended"),
  // 任务详情
  detail: (id: string) => api.get(`/tasks/${id}`),
  // 学生操作
  accept: (taskId: string) => api.post(`/tasks/${taskId}/accept`),
  getSteps: (taskId: string) => api.get(`/tasks/${taskId}/steps`),
  completeStep: (taskId: string, stepNum: number) =>
    api.post(`/tasks/${taskId}/steps/${stepNum}/done`),
  submit: (taskId: string, fileUrls: string[], submissionNote?: string) =>
    api.post(`/tasks/${taskId}/submit`, { fileUrls, submissionNote }),
  // 企业操作
  create: (data: object) => api.post("/tasks/company", data),
  createTask: (data: object) => api.post("/tasks/company", data), // 别名，兼容不同调用方式
  companyTasks: () => api.get("/tasks/company"),
  getStudentProfile: (studentId: string) => api.get(`/tasks/students/${studentId}/profile`),
  getProgress: (taskId: string, assigneeId: string) => api.get(`/tasks/${taskId}/progress/${assigneeId}`),
  approve: (taskId: string, assigneeId: string) =>
    api.post(`/tasks/company/${taskId}/approve`, { assigneeId }),
  reject: (taskId: string, assigneeId: string, reason: string) =>
    api.post(`/tasks/company/${taskId}/reject`, { assigneeId, reason }),
};

// ── 能力 & 成长 ────────────────────────────────────────────
export const abilityApi = {
  radar: () => api.get("/ability/radar"),
  timeline: () => api.get("/ability/timeline"),
};

// ── 故事墙 ────────────────────────────────────────────────
export const storyApi = {
  feed: (page = 1) => api.get("/story/feed", { params: { page, limit: 20 } }),
  like: (postId: string) => api.post(`/story/posts/${postId}/like`),
  createPost: (content: string, taskId?: string) =>
    api.post("/story/posts", { content, taskId }),
};

// ── 报告 ──────────────────────────────────────────────────
export const reportApi = {
  list: () => api.get("/reports"),
  order: (type: string) => api.post("/reports/order", { type }),
  get: (type: string) => api.get(`/reports/${type}`),
};

// ── 通知 ──────────────────────────────────────────────────
export const notificationApi = {
  list: (params?: { page?: number; limit?: number; type?: string; is_read?: boolean }) =>
    api.get("/notifications", { params }),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markMultipleRead: (ids: string[]) => api.post("/notifications/mark-read", { notification_ids: ids }),
  markAllRead: () => api.post("/notifications/mark-all-read"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getSettings: () => api.get("/notifications/settings"),
  updateSettings: (settings: any) => api.put("/notifications/settings", settings),
  test: (channel: string) => api.post("/notifications/test", { channel }),
};

// ── 支付 & 提现 ────────────────────────────────────────────
export const paymentApi = {
  balance: () => api.get("/payments/balance"),
  history: (page = 1) => api.get("/payments/history", { params: { page } }),
  withdraw: (amount: number, alipayAccount: string) =>
    api.post("/payments/withdraw", { amount, alipayAccount }),
};

// ── 后台管理 ───────────────────────────────────────────────
export const adminApi = {
  login: (username: string, password: string) =>
    adminApiInstance.post("/admin/auth/login", { username, password }),
  dashboard: () => adminApiInstance.get("/admin/dashboard/stats"),
  companyTasks: (page = 1) => adminApiInstance.get("/admin/company-tasks", { params: { page } }),
  takedownTask: (id: string, reason: string) => adminApiInstance.post(`/admin/company-tasks/${id}/takedown`, { reason }),
  blacklistCompany: (id: string, reason: string) => adminApiInstance.post(`/admin/companies/${id}/blacklist`, { reason }),
  listStudents: (page = 1, search?: string) => adminApiInstance.get("/admin/students", { params: { page, search } }),
  getStudentDetail: (userId: string) => adminApiInstance.get(`/admin/students/${userId}`),
  getTaskMessages: (taskId: string) => adminApiInstance.get(`/admin/support/tasks/${taskId}/messages`),
  interveneTask: (taskId: string, action: string, note: string) => adminApiInstance.post(`/admin/support/tasks/${taskId}/intervene`, { action, note }),
  sendNotification: (userId: string, title: string, body: string) => adminApiInstance.post(`/admin/support/users/${userId}/notify`, { title, body }),
  getFinanceOverview: () => adminApiInstance.get("/admin/finance/overview"),
  getFinancePayments: (page = 1) => adminApiInstance.get("/admin/finance/payments", { params: { page } }),
  getWithdrawals: (page = 1) => adminApiInstance.get("/admin/finance/withdrawals", { params: { page } }),
  approveWithdrawal: (id: string) => adminApiInstance.post(`/admin/finance/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: string, reason: string) => adminApiInstance.post(`/admin/finance/withdrawals/${id}/reject`, { reason }),
  getFirstTaskAdvances: () => adminApiInstance.get("/admin/finance/first-task-advances"),
  broadcast: (title: string, body: string, roles: string[]) => adminApiInstance.post("/admin/notifications/broadcast", { title, body, roles }),
  getLogs: (page = 1) => adminApiInstance.get("/admin/logs", { params: { page } }),
  getConfig: () => adminApiInstance.get("/admin/config"),
  updateConfig: (key: string, value: unknown) => adminApiInstance.put(`/admin/config/${key}`, { value }),
};

// ── 聊天 ──────────────────────────────────────────────────
export const chatApi = {
  getMessages: (taskId: string) => api.get(`/chat/${taskId}/messages`),
  send: (taskId: string, content: string) =>
    api.post(`/chat/${taskId}/messages`, { content }),
};

// ── 统计API（消除固定文案）──────────────────────────────────
export const statsApi = {
  /**
   * 获取人格标签统计
   * 用于替代"全国有12,843个和你一样的XX"固定文案
   */
  getPersonalityStats: (tag: string) =>
    api.get(`/stats/personality/${tag}`),

  /**
   * 获取赛道统计
   * 用于替代固定的市场均价
   */
  getTrackStats: (track: string) =>
    api.get(`/stats/track/${track}`),

  /**
   * 获取学生能力估值
   * 用于替代固定的"月薪估值¥6,000"
   */
  getStudentValuation: () =>
    api.get('/stats/student-valuation'),
};
