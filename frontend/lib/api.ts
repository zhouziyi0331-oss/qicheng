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
  companyTasks: () => api.get("/tasks/company"),
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
  list: (page = 1) => api.get("/notifications", { params: { page } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
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
  dashboard: () => api.get("/admin/dashboard"),
  companyTasks: (page = 1) => api.get("/admin/company-tasks", { params: { page } }),
  takedownTask: (id: string, reason: string) => api.post(`/admin/company-tasks/${id}/takedown`, { reason }),
  blacklistCompany: (id: string, reason: string) => api.post(`/admin/companies/${id}/blacklist`, { reason }),
  listStudents: (page = 1, search?: string) => api.get("/admin/students", { params: { page, search } }),
  getStudentDetail: (userId: string) => api.get(`/admin/students/${userId}`),
  getTaskMessages: (taskId: string) => api.get(`/admin/support/tasks/${taskId}/messages`),
  interveneTask: (taskId: string, action: string, note: string) => api.post(`/admin/support/tasks/${taskId}/intervene`, { action, note }),
  sendNotification: (userId: string, title: string, body: string) => api.post(`/admin/support/users/${userId}/notify`, { title, body }),
  getFinancePayments: (page = 1) => api.get("/admin/finance/payments", { params: { page } }),
  getWithdrawals: (page = 1) => api.get("/admin/finance/withdrawals", { params: { page } }),
  approveWithdrawal: (id: string) => api.post(`/admin/finance/withdrawals/${id}/approve`),
  getFirstTaskAdvances: () => api.get("/admin/finance/first-task-advances"),
  broadcast: (title: string, body: string, roles: string[]) => api.post("/admin/notifications/broadcast", { title, body, roles }),
  getLogs: (page = 1) => api.get("/admin/logs", { params: { page } }),
  getConfig: () => api.get("/admin/config"),
  updateConfig: (key: string, value: unknown) => api.put(`/admin/config/${key}`, { value }),
};

// ── 聊天 ──────────────────────────────────────────────────
export const chatApi = {
  getMessages: (taskId: string) => api.get(`/chat/${taskId}/messages`),
  send: (taskId: string, content: string) =>
    api.post(`/chat/${taskId}/messages`, { content }),
};
