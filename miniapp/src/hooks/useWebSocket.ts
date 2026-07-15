import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import io, { Socket } from 'socket.io-client';
import { tokenManager } from '../utils/token';
import { config } from '../config';

interface WebSocketHookOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    // 使用tokenManager统一管理
    const token = tokenManager.getAccessToken();
    if (!token) {
      console.warn('No access token found, cannot connect to WebSocket');
      return;
    }

    // 使用配置的API地址
    const socket = io(config.apiBaseUrl, {
      path: '/socket.io',
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    // 连接成功
    socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
      setConnected(true);
      options.onConnect?.();
    });

    // 连接断开
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      options.onDisconnect?.();
    });

    // 连接错误
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      options.onError?.(error);
    });

    // AI任务完成通知
    socket.on('ai_task_complete', (data) => {
      handleNotification({
        type: 'ai_task_complete',
        title: 'AI任务完成',
        message: `${data.taskType}已完成`,
        data
      });
    });

    // 画像分析完成
    socket.on('profile_analysis_complete', (data) => {
      handleNotification({
        type: 'profile_analysis_complete',
        title: '画像分析完成',
        message: data.message || '你的能力画像已生成',
        data
      });
    });

    // 任务推荐
    socket.on('task_recommended', (data) => {
      handleNotification({
        type: 'task_recommended',
        title: '新任务推荐',
        message: `为你推荐了${data.count}个新任务`,
        data
      });
    });

    // 导师消息
    socket.on('mentor_message', (data) => {
      handleNotification({
        type: 'mentor_message',
        title: '导师消息',
        message: data.preview || '你有新的导师消息',
        data
      });
    });

    // 订单状态变化
    socket.on('order_status_changed', (data) => {
      handleNotification({
        type: 'order_status_changed',
        title: '订单状态更新',
        message: getOrderStatusMessage(data.status),
        data
      });
    });

    // 心跳
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    socket.on('pong', () => {
      // 心跳响应
    });

    socketRef.current = socket;

    return () => {
      clearInterval(heartbeatInterval);
    };
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  };

  const handleNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 显示系统通知
    Taro.showToast({
      title: notification.title,
      icon: 'none',
      duration: 2000
    });

    // 震动反馈
    Taro.vibrateShort();
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getOrderStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
      'accepted': '任务已被接受',
      'rejected': '任务被打回，需要修改',
      'completed': '任务已完成',
      'confirmed': '任务已确认，报酬已到账'
    };
    return messages[status] || '订单状态已更新';
  };

  return {
    connected,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}
