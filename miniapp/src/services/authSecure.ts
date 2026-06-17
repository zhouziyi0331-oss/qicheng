/**
 * ✅ 学生端认证服务 - 集成所有安全措施
 *
 * 使用新的安全API层，集成：
 * - P0: JWT黑名单
 * - P0: Token内存存储
 * - P1: 登录锁定提示
 */

import { http } from '../utils/secureRequest';
import { tokenManager } from '../utils/token';
import Taro from '@tarojs/taro';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    role: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface WechatLoginParams {
  code: string;
  encryptedData?: string;
  iv?: string;
}

/**
 * ✅ 认证服务
 */
class AuthService {
  /**
   * ✅ P1安全: 手机号+密码登录（支持登录锁定提示）
   */
  async loginWithPassword(phone: string, password: string): Promise<LoginResponse> {
    try {
      const response = await http.post<LoginResponse>('/auth/login', {
        phone,
        password,
      });

      // ✅ P0安全: 保存Token到安全存储
      await tokenManager.saveTokens(response.accessToken, response.refreshToken);
      await tokenManager.saveUserInfo(response.user);

      return response;
    } catch (error: any) {
      // 错误已在http层处理（包括登录锁定提示）
      throw error;
    }
  }

  /**
   * ✅ 微信一键登录
   */
  async loginWithWechat(params: WechatLoginParams): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>('/auth/wechat/login', params);

    // ✅ P0安全: 保存Token
    await tokenManager.saveTokens(response.accessToken, response.refreshToken);
    await tokenManager.saveUserInfo(response.user);

    return response;
  }

  /**
   * ✅ 发送验证码
   */
  async sendSmsCode(phone: string): Promise<void> {
    await http.post('/auth/sms/send', { phone });

    Taro.showToast({
      title: '验证码已发送',
      icon: 'success',
    });
  }

  /**
   * ✅ 验证码登录
   */
  async loginWithSmsCode(phone: string, code: string): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>('/auth/sms/login', {
      phone,
      code,
    });

    // ✅ P0安全: 保存Token
    await tokenManager.saveTokens(response.accessToken, response.refreshToken);
    await tokenManager.saveUserInfo(response.user);

    return response;
  }

  /**
   * ✅ P0安全: 退出登录（清除所有Token）
   */
  async logout(): Promise<void> {
    try {
      // 调用后端退出接口（将JWT加入黑名单）
      await http.post('/auth/logout', {}, { showLoading: false });
    } catch (error) {
      // 即使后端调用失败，也要清除本地Token
      console.error('退出登录失败:', error);
    } finally {
      // ✅ P0安全: 清除所有本地Token
      await tokenManager.clearTokens();

      // 跳转到登录页
      Taro.reLaunch({ url: '/pages/auth/login/index' });
    }
  }

  /**
   * ✅ 退出所有设备
   */
  async logoutAll(): Promise<void> {
    try {
      await http.post('/auth/logout-all');

      Taro.showToast({
        title: '已退出所有设备',
        icon: 'success',
      });
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '操作失败',
        icon: 'none',
      });
      throw error;
    } finally {
      await tokenManager.clearTokens();
      Taro.reLaunch({ url: '/pages/auth/login/index' });
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<any> {
    // 先从本地缓存获取
    const cached = await tokenManager.getUserInfo();
    if (cached) {
      return cached;
    }

    // 如果没有缓存，从服务器获取
    const user = await http.get('/user/profile');
    await tokenManager.saveUserInfo(user);
    return user;
  }

  /**
   * 检查登录状态
   */
  isLoggedIn(): boolean {
    return tokenManager.isLoggedIn();
  }

  /**
   * 刷新用户信息
   */
  async refreshUserInfo(): Promise<any> {
    const user = await http.get('/user/profile');
    await tokenManager.saveUserInfo(user);
    return user;
  }
}

export const authService = new AuthService();
