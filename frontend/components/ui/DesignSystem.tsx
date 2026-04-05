// 启程平台 - 设计组件库
// 扁平插画风格 + 渐变配色 + 年轻化视觉

import React from 'react';

/* ========================================
   按钮组件
   ======================================== */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'pink' | 'cyan' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = 'font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    pink: 'btn-gradient-pink',
    cyan: 'btn-gradient-cyan',
    icon: 'btn-icon',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${variant !== 'icon' ? sizes[size] : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ========================================
   卡片组件
   ======================================== */

interface CardProps {
  variant?: 'default' | 'gradient' | 'hover' | 'profile';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ variant = 'default', children, className = '', onClick }: CardProps) {
  const variants = {
    default: 'card',
    gradient: 'card-gradient',
    hover: 'card-hover',
    profile: 'card-profile',
  };

  return (
    <div className={`${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

/* ========================================
   标签组件
   ======================================== */

interface TagProps {
  type: 'opc-o' | 'opc-p' | 'opc-c' | 'level' | 'category';
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function Tag({ type, icon, children, className = '' }: TagProps) {
  const types = {
    'opc-o': 'tag-opc-o',
    'opc-p': 'tag-opc-p',
    'opc-c': 'tag-opc-c',
    'level': 'tag-level',
    'category': 'tag-category',
  };

  return (
    <span className={`${types[type]} ${className}`}>
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </span>
  );
}

/* ========================================
   输入框组件
   ======================================== */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`input ${error ? 'input-error' : ''} ${icon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

/* ========================================
   进度条组件
   ======================================== */

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export function Progress({ value, max = 100, showLabel = false, className = '' }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>进度</span>
          <span className="font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ========================================
   装饰性 Blob 组件
   ======================================== */

interface BlobProps {
  variant: 1 | 2 | 3;
  size?: number;
  className?: string;
  animate?: boolean;
}

export function Blob({ variant, size = 256, className = '', animate = true }: BlobProps) {
  const variants = {
    1: 'blob-1',
    2: 'blob-2',
    3: 'blob-3',
  };

  return (
    <div
      className={`${variants[variant]} ${animate ? 'animate-float' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ========================================
   加载动画组件
   ======================================== */

interface LoadingProps {
  variant?: 'pulse' | 'spin' | 'wave';
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ variant = 'pulse', size = 'md' }: LoadingProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  if (variant === 'pulse') {
    return (
      <div className={`${sizes[size]} rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse`} />
    );
  }

  if (variant === 'spin') {
    return (
      <div className={`${sizes[size]} rounded-full border-4 border-gray-200 border-t-purple-500 animate-spin`} />
    );
  }

  // wave
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

/* ========================================
   渐变文字组件
   ======================================== */

interface GradientTextProps {
  variant?: 'primary' | 'cyan' | 'rainbow';
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ variant = 'primary', children, className = '' }: GradientTextProps) {
  const variants = {
    primary: 'text-gradient-primary',
    cyan: 'text-gradient-cyan',
    rainbow: 'text-gradient-rainbow',
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/* ========================================
   统计卡片组件
   ======================================== */

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: 'primary' | 'pink' | 'cyan' | 'green' | 'orange';
}

export function StatCard({ icon, label, value, trend, gradient }: StatCardProps) {
  const gradients = {
    primary: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    cyan: 'from-cyan-500 to-cyan-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[gradient]} flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

/* ========================================
   任务卡片组件
   ======================================== */

interface TaskCardProps {
  title: string;
  description: string;
  category: string;
  level: number;
  budget: number;
  company: {
    name: string;
    avatar: string;
  };
  onClick?: () => void;
}

export function TaskCard({ title, description, category, level, budget, company, onClick }: TaskCardProps) {
  return (
    <div className="card-hover group" onClick={onClick}>
      {/* 标签 */}
      <div className="flex gap-2 mb-4">
        <Tag type="category">{category}</Tag>
        <Tag type="level" icon="⭐">Lv.{level}</Tag>
      </div>

      {/* 标题 */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
        {title}
      </h3>

      {/* 描述 */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {description}
      </p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
            {company.avatar}
          </div>
          <span className="text-sm text-gray-500">{company.name}</span>
        </div>
        <div className="text-2xl font-bold text-gradient-primary">
          ¥{budget}
        </div>
      </div>
    </div>
  );
}

/* ========================================
   个人资料卡片组件
   ======================================== */

interface ProfileCardProps {
  avatar: string;
  nickname: string;
  opcLabel: string;
  opcType: 'O' | 'P' | 'C';
  stats: {
    tasks: number;
    earnings: number;
    level: number;
  };
}

export function ProfileCard({ avatar, nickname, opcLabel, opcType, stats }: ProfileCardProps) {
  const opcIcons = {
    O: '🎨',
    P: '⚡',
    C: '💻',
  };

  const opcTypes = {
    O: 'opc-o' as const,
    P: 'opc-p' as const,
    C: 'opc-c' as const,
  };

  return (
    <div className="card-profile">
      {/* 装饰性元素 */}
      <Blob variant={1} size={128} className="top-0 right-0 opacity-20" animate={false} />

      {/* 头像 */}
      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl shadow-xl mb-4">
        {avatar}
      </div>

      {/* 昵称和标签 */}
      <h2 className="text-3xl font-bold mb-2">{nickname}</h2>
      <Tag type={opcTypes[opcType]} icon={opcIcons[opcType]} className="mb-6">
        {opcLabel}
      </Tag>

      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.tasks}</div>
          <div className="text-sm opacity-80">完成任务</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">¥{(stats.earnings / 1000).toFixed(1)}K</div>
          <div className="text-sm opacity-80">总收入</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">Lv.{stats.level}</div>
          <div className="text-sm opacity-80">当前等级</div>
        </div>
      </div>
    </div>
  );
}

/* ========================================
   空状态组件
   ======================================== */

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-6xl mb-6 animate-float">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ========================================
   通知徽章组件
   ======================================== */

interface BadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function Badge({ count, max = 99, className = '' }: BadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  if (count === 0) return null;

  return (
    <span className={`
      absolute -top-1 -right-1
      min-w-[20px] h-5 px-1.5
      flex items-center justify-center
      bg-gradient-to-r from-pink-500 to-red-500
      text-white text-xs font-bold
      rounded-full
      shadow-lg
      ${className}
    `}>
      {displayCount}
    </span>
  );
}

/* ========================================
   Toast 通知组件
   ======================================== */

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const types = {
    success: {
      icon: '✓',
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-900',
    },
    error: {
      icon: '✕',
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-900',
    },
    warning: {
      icon: '⚠',
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
    },
    info: {
      icon: 'ℹ',
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
    },
  };

  const config = types[type];

  return (
    <div className={`
      flex items-center gap-3 p-4 rounded-xl
      ${config.bg} border border-white
      shadow-xl
      animate-slide-up
    `}>
      <div className={`
        w-8 h-8 rounded-full
        bg-gradient-to-br ${config.gradient}
        flex items-center justify-center
        text-white font-bold
        shadow-lg
      `}>
        {config.icon}
      </div>
      <p className={`flex-1 font-medium ${config.text}`}>{message}</p>
      <button
        onClick={onClose}
        className={`${config.text} hover:opacity-70 transition-opacity`}
      >
        ✕
      </button>
    </div>
  );
}
