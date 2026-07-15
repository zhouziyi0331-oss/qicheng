import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { tokenManager } from '../../utils/token';
import { getApiUrl } from '../../config';
import './index.scss';

interface CollaborationProgress {
  studentId: string;
  companyId: string;
  completedCount: number;
  inProgressCount: number;
  canUnlockContact: boolean;
  contactUnlocked: boolean;
  studentAgreed: boolean | null;
  companyAgreed: boolean | null;
  hint: string;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'can_unlock' | 'unlocked';
}

interface CollaborationProgressHintProps {
  companyId: string;  // 学生端传入企业ID
  mode?: 'banner' | 'inline' | 'card';
  showAction?: boolean;
  onUnlockRequest?: () => void;
}

export default function CollaborationProgressHint({
  companyId,  // 学生端传入企业ID
  mode = 'banner',
  showAction = false,
  onUnlockRequest
}: CollaborationProgressHintProps) {
  const [progress, setProgress] = useState<CollaborationProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [companyId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const studentId = Taro.getStorageSync('userId');  // 学生端获取自己的ID
      const res = await Taro.request({
        url: getApiUrl(`/api/v1/security/collaboration-progress/${studentId}/${companyId}`),
        method: 'GET',
        header: {
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`
        }
      });

      if (res.data.success) {
        setProgress(res.data.data);
      }
    } catch (err) {
      console.error('加载合作进度失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockClick = () => {
    if (onUnlockRequest) {
      onUnlockRequest();
    } else {
      Taro.showModal({
        title: '申请解锁联系方式',
        content: '您与该学生已完成2单合作，双方同意后可解锁联系方式。是否发送解锁申请？',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            // TODO: 调用解锁申请API
            Taro.showToast({ title: '申请已发送', icon: 'success' });
          }
        }
      });
    }
  };

  if (loading || !progress) {
    return null;
  }

  // 如果已解锁，显示简单提示
  if (progress.contactUnlocked) {
    return (
      <View className={`collaboration-hint collaboration-hint-${mode} unlocked`}>
        <View className="hint-icon">✓</View>
        <Text className="hint-text">已解锁联系方式</Text>
      </View>
    );
  }

  // 如果还没开始合作，不显示
  if (progress.status === 'not_started') {
    return null;
  }

  const getIcon = () => {
    if (progress.canUnlockContact) return '○';
    if (progress.completedCount === 1) return '◇';
    return '○';
  };

  return (
    <View className={`collaboration-hint collaboration-hint-${mode} status-${progress.status}`}>
      <View className="hint-icon">{getIcon()}</View>
      <View className="hint-content">
        <Text className="hint-text">{progress.hint}</Text>
        {progress.canUnlockContact && !progress.contactUnlocked && showAction && (
          <View className="hint-action" onClick={handleUnlockClick}>
            申请解锁
          </View>
        )}
      </View>
      {mode === 'card' && (
        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${progress.percentage}%` }} />
        </View>
      )}
    </View>
  );
}
