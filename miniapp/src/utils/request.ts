import Taro from '@tarojs/taro';
import { config } from '../config';
import { tokenManager } from './token';

// API基础地址 - 统一使用config配置
export const API_BASE_URL = config.apiBaseUrl;

// 请求拦截器
export const request = async <T = any>(options: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
}): Promise<{ success: boolean; data: T; message?: string }> => {
  try {
    // 获取token - 使用tokenManager统一管理
    const token = tokenManager.getAccessToken();
    
    // 发起请求
    const res = await Taro.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method,
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      timeout: 30000 // 30秒超时
    });
    
    // 处理响应
    if (res.statusCode === 200) {
      return res.data as any;
    } else if (res.statusCode === 401) {
      // token过期，使用tokenManager清除
      await tokenManager.clearTokens();
      Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' });
      }, 1500);
      throw new Error('登录已过期');
    } else {
      const errorMsg = (res.data as any)?.message || '请求失败';
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error('请求错误:', error);
    
    // 网络错误
    if (error.errMsg && error.errMsg.includes('timeout')) {
      throw new Error('请求超时，请检查网络');
    } else if (error.errMsg && error.errMsg.includes('fail')) {
      throw new Error('网络连接失败，请检查网络');
    }
    
    throw error;
  }
};

// 上传文件
export const uploadFile = async (filePath: string): Promise<string> => {
  try {
    // 使用tokenManager统一管理
    const token = tokenManager.getAccessToken();
    
    const res = await Taro.uploadFile({
      url: `${API_BASE_URL}/api/v1/upload`,
      filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    if (res.statusCode === 200) {
      const data = JSON.parse(res.data);
      return data.data.url;
    } else {
      throw new Error('上传失败');
    }
  } catch (error) {
    console.error('上传错误:', error);
    throw error;
  }
};
