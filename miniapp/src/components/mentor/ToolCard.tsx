import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './ToolCard.scss';

interface ToolCardProps {
  toolName: string;
  description: string;
  reason: string;
  relevanceScore: number;
  onUse?: () => void;
  onDismiss?: () => void;
}

const TOOL_ICONS = {
  'Figma': '●',
  'Notion': '▪',
  'Trello': '▪',
  'Jira': '◆',
  'Slack': '●',
  'GitHub': '○',
  'VS Code': '●',
  'Postman': '●',
  'Chrome DevTools': '●',
  'default': '●️'
};

export default function ToolCard({
  toolName,
  description,
  reason,
  relevanceScore,
  onUse,
  onDismiss
}: ToolCardProps) {
  const icon = TOOL_ICONS[toolName] || TOOL_ICONS.default;
  const isHighRelevance = relevanceScore >= 0.8;

  const handleUse = () => {
    Taro.showToast({
      title: '已记录使用',
      icon: 'success'
    });
    onUse?.();
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <View className="tool-card">
      <View className="tool-header">
        <View className="tool-icon">
          <Text>{icon}</Text>
        </View>
        <Text className="tool-title">{toolName}</Text>
        {isHighRelevance && (
          <View className="tool-badge">
            <Text>强烈推荐</Text>
          </View>
        )}
      </View>

      <Text className="tool-description">{description}</Text>

      <View className="tool-reason">
        <Text className="reason-label">◇ 为什么推荐给你</Text>
        <Text className="reason-text">{reason}</Text>
      </View>

      <View className="tool-actions">
        <View className="tool-btn primary" onClick={handleUse}>
          <Text>我会试试</Text>
        </View>
        <View className="tool-btn secondary" onClick={handleDismiss}>
          <Text>稍后再说</Text>
        </View>
      </View>
    </View>
  );
}
