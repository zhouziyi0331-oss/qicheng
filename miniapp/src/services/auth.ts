import { request } from '@/utils/request';

// 认证相关API
export const authAPI = {
  /**
   * 发送验证码
   */
  sendCode: (phone: string) => request({
    url: '/api/v1/auth/send-code',
    method: 'POST',
    data: { phone }
  }),

  /**
   * 注册
   */
  register: (data: {
    phone: string;
    code: string;
    password: string;
    role: 'student' | 'company';
    userType: 'student' | 'company';
    deviceType?: string;
    sourceChannel?: string;
    // 企业注册额外字段
    companyName?: string;
    contactName?: string;
  }) => request<{
    userId: string;
    role: string;
    userType: string;
    accessToken: string;
    refreshToken: string;
    nextStep: 'onboarding' | 'pending_review';
  }>({
    url: '/api/v1/auth/register',
    method: 'POST',
    data
  }),

  /**
   * 登录（支持密码或验证码）
   */
  login: (data: {
    phone: string;
    password?: string;
    code?: string;
  }) => request<{
    userId: string;
    role: string;
    userType: string;
    accessToken: string;
    refreshToken: string;
  }>({
    url: '/api/v1/auth/login',
    method: 'POST',
    data
  }),

  /**
   * 刷新token
   */
  refreshToken: (refreshToken: string) => request<{
    accessToken: string;
    refreshToken: string;
  }>({
    url: '/api/v1/auth/refresh',
    method: 'POST',
    data: { refreshToken }
  }),

  /**
   * 登出
   */
  logout: (refreshToken: string) => request({
    url: '/api/v1/auth/logout',
    method: 'POST',
    data: { refreshToken }
  }),

  /**
   * 获取当前用户信息
   */
  getCurrentUser: () => request<{
    id: string;
    phone: string;
    role: string;
    userType: string;
    createdAt: string;
    lastLoginAt: string;
    profile: any;
  }>({
    url: '/api/v1/auth/me',
    method: 'GET'
  })
};
