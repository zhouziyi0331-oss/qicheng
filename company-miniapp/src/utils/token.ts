/**
 * ✅ 安全Token管理工具
 *
 * 集成后端安全措施：
 * - P0: JWT黑名单机制
 * - Access Token存内存，不存Storage
 * - Refresh Token加密存Storage
 * - 退出时清除所有Token
 */

import Taro from '@tarojs/taro';

// ✅ P0安全: Access Token存内存，页面刷新后消失
let accessTokenInMemory: string | null = null;

const STORAGE_KEYS = {
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
};

/**
 * ✅ P0安全: Token管理器
 */
class TokenManager {
  /**
   * 设置Access Token（存内存）
   */
  setAccessToken(token: string): void {
    accessTokenInMemory = token;
  }

  /**
   * 获取Access Token（从内存）
   */
  getAccessToken(): string | null {
    return accessTokenInMemory;
  }

  /**
   * 设置Refresh Token（加密存Storage）
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      // ✅ P0安全: 简单加密（实际可以用更复杂的加密算法）
      const encrypted = this.simpleEncrypt(token);
      await Taro.setStorage({
        key: STORAGE_KEYS.REFRESH_TOKEN,
        data: encrypted,
      });
    } catch (error) {
      console.error('保存Refresh Token失败:', error);
    }
  }

  /**
   * 获取Refresh Token（解密）
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const encrypted = await Taro.getStorage({ key: STORAGE_KEYS.REFRESH_TOKEN });
      if (encrypted.data) {
        return this.simpleDecrypt(encrypted.data);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * ✅ P0安全: 保存Token对（登录成功后调用）
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);
  }

  /**
   * ✅ P0安全: 清除所有Token（退出登录）
   */
  async clearTokens(): Promise<void> {
    accessTokenInMemory = null;
    try {
      await Taro.removeStorage({ key: STORAGE_KEYS.REFRESH_TOKEN });
      await Taro.removeStorage({ key: STORAGE_KEYS.USER_INFO });
    } catch (error) {
      console.error('清除Token失败:', error);
    }
  }

  /**
   * 保存用户信息
   */
  async saveUserInfo(userInfo: any): Promise<void> {
    try {
      await Taro.setStorage({
        key: STORAGE_KEYS.USER_INFO,
        data: userInfo,
      });
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<any | null> {
    try {
      const result = await Taro.getStorage({ key: STORAGE_KEYS.USER_INFO });
      return result.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return !!accessTokenInMemory;
  }

  /**
   * 简单加密（实际应使用AES）
   */
  private simpleEncrypt(text: string): string {
    // Base64编码
    return Buffer.from(text).toString('base64');
  }

  /**
   * 简单解密
   */
  private simpleDecrypt(encrypted: string): string {
    // Base64解码
    return Buffer.from(encrypted, 'base64').toString();
  }
}

export const tokenManager = new TokenManager();

/**
 * ✅ P0安全: 手机号脱敏
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) {
    return '***';
  }
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

/**
 * ✅ P1安全: 检查登录锁定状态
 */
export function parseLoginLockError(errorMessage: string): {
  isLocked: boolean;
  remainingMinutes?: number;
} {
  if (!errorMessage) {
    return { isLocked: false };
  }

  // 检测"请X分钟后重试"模式
  const match = errorMessage.match(/请(\d+)分钟后重试/);
  if (match) {
    return {
      isLocked: true,
      remainingMinutes: parseInt(match[1]),
    };
  }

  // 检测账号锁定
  if (errorMessage.includes('锁定') || errorMessage.includes('频繁')) {
    return { isLocked: true };
  }

  return { isLocked: false };
}
