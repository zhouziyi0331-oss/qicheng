// API配置文件
// 文件位置: miniapp/src/config/index.ts

export const config = {
  // API基础URL
  apiBaseUrl: process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://api.qicheng.com',

  // 超时时间
  timeout: 30000,

  // 是否启用日志
  enableLog: process.env.NODE_ENV === 'development',
};

// 获取完整API URL
export function getApiUrl(path: string): string {
  // 如果path已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 确保path以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${config.apiBaseUrl}${normalizedPath}`;
}

// 导出默认配置
export default config;
