// 启程平台配色系统 - 柔和插画风格

export const colors = {
  // 主色调 - 柔和的紫粉色系
  primary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
  },

  // 辅助色 - 柔和的黄绿色
  accent: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
  },

  // 粉色
  pink: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
  },

  // 蓝色
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
  },

  // 背景色
  background: {
    primary: '#FAF5FF',    // 浅紫色背景
    secondary: '#FDF2F8',  // 浅粉色背景
    card: '#FFFFFF',       // 卡片白色
  },

  // 文字色
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  },

  // 状态色
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}

// 圆角
export const radius = {
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  full: '9999px',
}

// 阴影
export const shadows = {
  sm: '0 2px 8px rgba(168, 85, 247, 0.08)',
  md: '0 4px 16px rgba(168, 85, 247, 0.12)',
  lg: '0 8px 24px rgba(168, 85, 247, 0.16)',
  xl: '0 12px 32px rgba(168, 85, 247, 0.2)',
}

// 渐变
export const gradients = {
  primary: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)',
  accent: 'linear-gradient(135deg, #FEF9C3 0%, #FBCFE8 100%)',
  card: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)',
}
