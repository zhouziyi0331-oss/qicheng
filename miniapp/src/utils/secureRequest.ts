/**
 * ✅ 安全API请求封装
 *
 * 集成后端所有安全措施：
 * - 自动添加Token认证
 * - Token过期自动刷新
 * - 统一错误处理
 * - 登录锁定提示
 */

import Taro from '@tarojs/taro';
import { tokenManager, parseLoginLockError } from './token';

// ✅ 修复：使用正确的API地址（15775端口）
const BASE_URL = process.env.TARO_APP_API_URL || 'http://127.0.0.1:15775/api/v1';

// 开发环境小程序需要配置不校验合法域名
console.log('🔗 API Base URL:', BASE_URL);

// ✅ 请求超时时间
const TIMEOUT = 30000; // 30秒

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
  needAuth?: boolean; // 是否需要认证
}

/**
 * ✅ 安全请求封装
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = true,
    loadingText = '加载中...',
    needAuth = true,
  } = options;

  // 显示加载提示
  if (showLoading) {
    Taro.showLoading({ title: loadingText, mask: true });
  }

  try {
    // ✅ P0安全: 自动添加Token
    const accessToken = tokenManager.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (needAuth && accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 发起请求
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: headers,
      timeout: TIMEOUT,
    });

    if (showLoading) {
      Taro.hideLoading();
    }

    // ✅ 处理成功响应
    if (response.statusCode === 200) {
      return response.data as T;
    }

    // ✅ 处理Token过期（401）
    if (response.statusCode === 401) {
      // 尝试刷新Token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // 重试请求
        return request(options);
      } else {
        // 刷新失败，跳转登录
        await handleUnauthorized();
        throw new Error('登录已过期，请重新登录');
      }
    }

    // ✅ P1安全: 处理登录锁定（429）
    if (response.statusCode === 429) {
      const errorMsg = response.data?.error || response.data?.message || '请求过于频繁';
      const lockInfo = parseLoginLockError(errorMsg);

      if (lockInfo.isLocked) {
        Taro.showModal({
          title: '账号已锁定',
          content: lockInfo.remainingMinutes
            ? `登录失败次数过多，请${lockInfo.remainingMinutes}分钟后重试`
            : errorMsg,
          showCancel: false,
        });
      }

      throw new Error(errorMsg);
    }

    // ✅ 处理其他错误
    const errorMsg = response.data?.error || response.data?.message || '请求失败';
    throw new Error(errorMsg);

  } catch (error: any) {
    if (showLoading) {
      Taro.hideLoading();
    }

    // 网络错误
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        Taro.showToast({ title: '请求超时，请稍后重试', icon: 'none' });
      } else if (error.errMsg.includes('fail')) {
        Taro.showToast({ title: '网络连接失败', icon: 'none' });
      }
    }

    throw error;
  }
}

/**
 * ✅ P0安全: 刷新Access Token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await Taro.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
    });

    if (response.statusCode === 200 && response.data.accessToken) {
      tokenManager.setAccessToken(response.data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('刷新Token失败:', error);
    return false;
  }
}

/**
 * ✅ P0安全: 处理未授权（跳转登录）
 */
async function handleUnauthorized(): Promise<void> {
  await tokenManager.clearTokens();

  Taro.showToast({
    title: '登录已过期',
    icon: 'none',
    duration: 2000,
  });

  // 延迟跳转到登录页
  setTimeout(() => {
    Taro.reLaunch({ url: '/pages/auth/login/index' });
  }, 2000);
}

/**
 * ✅ P1安全: 文件上传（带安全校验）
 */
export async function uploadFile(options: {
  filePath: string;
  name?: string;
  formData?: Record<string, any>;
  maxSize?: number; // 最大文件大小（字节）
}): Promise<string> {
  const {
    filePath,
    name = 'file',
    formData = {},
    maxSize = 10 * 1024 * 1024, // 默认10MB
  } = options;

  try {
    // ✅ P1安全: 检查文件大小
    const fileInfo = await Taro.getFileInfo({ filePath });
    if (fileInfo.size > maxSize) {
      throw new Error(`文件大小不能超过${Math.floor(maxSize / 1024 / 1024)}MB`);
    }

    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) {
      throw new Error('未登录');
    }

    Taro.showLoading({ title: '上传中...', mask: true });

    const response = await Taro.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath,
      name,
      formData,
      header: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    Taro.hideLoading();

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      return data.data.url;
    }

    throw new Error('上传失败');
  } catch (error: any) {
    Taro.hideLoading();
    Taro.showToast({
      title: error.message || '上传失败',
      icon: 'none',
    });
    throw error;
  }
}

/**
 * ✅ 便捷方法
 */
export const http = {
  get: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'GET', data, ...options }),

  post: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'POST', data, ...options }),

  put: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PUT', data, ...options }),

  delete: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'DELETE', data, ...options }),

  upload: uploadFile,
};
