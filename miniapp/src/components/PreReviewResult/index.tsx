import { View, Text, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './pre-review-result.scss';

interface PreReviewResult {
  passLikelihood: number;
  criticalIssues: string[];
  warnings: string[];
  highlights: string[];
  overallFeedback: string;
  shouldSubmit: boolean;
  formattedMessage?: string;
}

interface PreReviewResultProps {
  result: PreReviewResult;
  onConfirmSubmit: () => void;
  onRevise: () => void;
}

export default function PreReviewResult({ result, onConfirmSubmit, onRevise }: PreReviewResultProps) {
  const getPassLikelihoodColor = (likelihood: number): string => {
    if (likelihood >= 0.8) return '#52c41a';
    if (likelihood >= 0.6) return '#1890ff';
    if (likelihood >= 0.4) return '#faad14';
    return '#ff4d4f';
  };

  const getPassLikelihoodLabel = (likelihood: number): string => {
    if (likelihood >= 0.8) return '通过概率很高';
    if (likelihood >= 0.6) return '通过概率较高';
    if (likelihood >= 0.4) return '通过概率一般';
    return '通过概率较低';
  };

  const getRecommendation = (): { icon: string; text: string; color: string } => {
    if (result.shouldSubmit) {
      return {
        icon: '✓',
        text: 'AI建议：可以提交',
        color: '#52c41a'
      };
    } else {
      return {
        icon: '▲',
        text: 'AI建议：建议修改后再提交',
        color: '#faad14'
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <View className="pre-review-result">
      {/* 头部 */}
      <View className="result-header">
        <Text className="header-title">○ AI预审结果</Text>
        <Text className="header-subtitle">帮你提前发现问题，提高通过率</Text>
      </View>

      {/* 通过概率 */}
      <View className="pass-likelihood-card">
        <View className="likelihood-label">通过概率</View>
        <View
          className="likelihood-value"
          style={{ color: getPassLikelihoodColor(result.passLikelihood) }}
        >
          {Math.round(result.passLikelihood * 100)}%
        </View>
        <View className="likelihood-bar-container">
          <View
            className="likelihood-bar"
            style={{
              width: `${result.passLikelihood * 100}%`,
              backgroundColor: getPassLikelihoodColor(result.passLikelihood)
            }}
          />
        </View>
        <Text className="likelihood-desc">
          {getPassLikelihoodLabel(result.passLikelihood)}
        </Text>
      </View>

      {/* AI建议 */}
      <View
        className="recommendation-card"
        style={{ borderLeftColor: recommendation.color }}
      >
        <Text className="recommendation-icon">{recommendation.icon}</Text>
        <Text className="recommendation-text" style={{ color: recommendation.color }}>
          {recommendation.text}
        </Text>
      </View>

      {/* 总体反馈 */}
      {result.overallFeedback && (
        <View className="feedback-section">
          <Text className="section-title">● 总体反馈</Text>
          <Text className="feedback-text">{result.overallFeedback}</Text>
        </View>
      )}

      {/* 关键问题 */}
      {result.criticalIssues && result.criticalIssues.length > 0 && (
        <View className="issues-section critical">
          <Text className="section-title">▲ 关键问题（必须修改）</Text>
          <View className="issues-list">
            {result.criticalIssues.map((issue, index) => (
              <View key={index} className="issue-item critical">
                <Text className="issue-icon">•</Text>
                <Text className="issue-text">{issue}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 警告 */}
      {result.warnings && result.warnings.length > 0 && (
        <View className="issues-section warning">
          <Text className="section-title">▲ 建议改进</Text>
          <View className="issues-list">
            {result.warnings.map((warning, index) => (
              <View key={index} className="issue-item warning">
                <Text className="issue-icon">•</Text>
                <Text className="issue-text">{warning}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 亮点 */}
      {result.highlights && result.highlights.length > 0 && (
        <View className="issues-section highlight">
          <Text className="section-title">◇ 做得好的地方</Text>
          <View className="issues-list">
            {result.highlights.map((highlight, index) => (
              <View key={index} className="issue-item highlight">
                <Text className="issue-icon">•</Text>
                <Text className="issue-text">{highlight}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 操作按钮 */}
      <View className="action-buttons">
        {!result.shouldSubmit && (
          <Button className="revise-btn" onClick={onRevise}>
            修改后再提交
          </Button>
        )}
        <Button
          className={`submit-btn ${result.shouldSubmit ? 'primary' : 'secondary'}`}
          onClick={onConfirmSubmit}
        >
          {result.shouldSubmit ? '确认提交' : '仍然提交'}
        </Button>
      </View>

      {/* 提示 */}
      <View className="bottom-tip">
        <Text className="tip-text">
          ◇ AI预审仅供参考，最终审核由企业决定
        </Text>
      </View>
    </View>
  );
}
