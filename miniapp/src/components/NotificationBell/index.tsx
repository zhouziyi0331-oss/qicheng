import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useWebSocket } from '../../hooks/useWebSocket';
import './notification-bell.scss';

interface NotificationBellProps {
  size?: 'small' | 'medium' | 'large';
}

export default function NotificationBell({ size = 'medium' }: NotificationBellProps) {
  const { unreadCount, connected } = useWebSocket({ autoConnect: true });

  const handleClick = () => {
    Taro.navigateTo({
      url: '/pages/notification-center/index'
    });
  };

  const getSizeClass = () => {
    return `size-${size}`;
  };

  return (
    <View className={`notification-bell ${getSizeClass()}`} onClick={handleClick}>
      {/* 铃铛图标 */}
      <View className="bell-icon">
        <Text className="icon-text">🔔</Text>
      </View>

      {/* 未读数量徽章 */}
      {unreadCount > 0 && (
        <View className="unread-badge">
          <Text className="badge-text">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}

      {/* 连接状态指示器 */}
      {connected && (
        <View className="connection-indicator online" />
      )}
    </View>
  );
}
