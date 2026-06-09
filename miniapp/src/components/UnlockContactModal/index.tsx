import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import './index.scss';

interface UnlockContactModalProps {
  visible: boolean;
  studentId: string;
  companyId: string;
  studentName?: string;
  companyName?: string;
  userType: 'student' | 'company';
  status: {
    studentAgreed: boolean;
    companyAgreed: boolean;
    exchanged: boolean;
    canUnlock: boolean;
    collaborationCount: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function UnlockContactModal({
  visible,
  studentId,
  companyId,
  studentName,
  companyName,
  userType,
  status,
  onClose,
  onSuccess
}: UnlockContactModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  if (!visible) return null;

  const handleRequest = async () => {
    try {
      Taro.showLoading({ title: '发送申请中...' });

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/security/unlock-contact/request',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          studentId,
          companyId,
          taskId: Taro.getStorageSync('currentTaskId') || ''
        }
      });

      Taro.hideLoading();

      if (res.data.success) {
        Taro.showToast({
          title: res.data.message || '申请已发送',
          icon: 'success'
        });
        onSuccess();
        onClose();
      } else {
        Taro.showToast({
          title: res.data.message || '申请失败',
          icon: 'none'
        });
      }
    } catch (err) {
      Taro.hideLoading();
      console.error('申请解锁失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    }
  };

  const handleApprove = async () => {
    try {
      Taro.showLoading({ title: '处理中...' });

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/security/unlock-contact/approve',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          studentId,
          companyId
        }
      });

      Taro.hideLoading();

      if (res.data.success) {
        // 如果解锁成功，显示庆祝动效
        if (res.data.data.exchanged) {
          setShowCelebration(true);
          // 3秒后显示免责声明
          setTimeout(() => {
            setShowCelebration(false);
            setShowDisclaimer(true);
          }, 3000);
        } else {
          Taro.showToast({
            title: res.data.message || '已同意',
            icon: 'success'
          });
          onSuccess();
          onClose();
        }
      } else {
        Taro.showToast({
          title: res.data.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (err) {
      Taro.hideLoading();
      console.error('同意解锁失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    }
  };

  const handleReject = async () => {
    Taro.showModal({
      title: '确认拒绝',
      content: '拒绝后对方需要重新申请，确定要拒绝吗？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            Taro.showLoading({ title: '处理中...' });

            const res = await Taro.request({
              url: 'http://localhost:3000/api/v1/security/unlock-contact/reject',
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              },
              data: {
                studentId,
                companyId
              }
            });

            Taro.hideLoading();

            if (res.data.success) {
              Taro.showToast({ title: '已拒绝', icon: 'success' });
              onSuccess();
              onClose();
            } else {
              Taro.showToast({
                title: res.data.message || '操作失败',
                icon: 'none'
              });
            }
          } catch (err) {
            Taro.hideLoading();
            console.error('拒绝解锁失败:', err);
            Taro.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  };

  const handleViewContact = async () => {
    try {
      Taro.showLoading({ title: '加载中...' });

      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/security/unlock-contact/${studentId}/${companyId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      Taro.hideLoading();

      if (res.data.success) {
        const contact = res.data.data;
        const contactInfo = [
          contact.phone && `手机：${contact.phone}`,
          contact.wechat && `微信：${contact.wechat}`,
          contact.email && `邮箱：${contact.email}`
        ].filter(Boolean).join('\n');

        Taro.showModal({
          title: '联系方式',
          content: contactInfo,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        Taro.showToast({
          title: res.data.message || '获取失败',
          icon: 'none'
        });
      }
    } catch (err) {
      Taro.hideLoading();
      console.error('获取联系方式失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    }
  };

  const getModalContent = () => {
    const targetName = userType === 'student' ? companyName : studentName;
    const myAgreed = userType === 'student' ? status.studentAgreed : status.companyAgreed;
    const otherAgreed = userType === 'student' ? status.companyAgreed : status.studentAgreed;

    // 已解锁
    if (status.exchanged) {
      return {
        icon: '✓',
        title: '联系方式已解锁',
        desc: `您与${targetName}已完成${status.collaborationCount}单合作，双方已同意解锁联系方式`,
        actions: (
          <>
            <Button className="btn-secondary" onClick={onClose}>
              关闭
            </Button>
            <Button className="btn-primary" onClick={handleViewContact}>
              查看联系方式
            </Button>
          </>
        )
      };
    }

    // 双方都同意但还未解锁（理论上不会出现）
    if (myAgreed && otherAgreed) {
      return {
        icon: '⏳',
        title: '正在解锁中',
        desc: '双方已同意，系统正在处理解锁请求...',
        actions: (
          <Button className="btn-secondary" onClick={onClose}>
            关闭
          </Button>
        )
      };
    }

    // 我已同意，等待对方
    if (myAgreed && !otherAgreed) {
      return {
        icon: '⏰',
        title: '等待对方确认',
        desc: `您已同意解锁，等待${targetName}确认`,
        actions: (
          <Button className="btn-secondary" onClick={onClose}>
            关闭
          </Button>
        )
      };
    }

    // 对方已同意，等待我确认
    if (!myAgreed && otherAgreed) {
      return {
        icon: '🔔',
        title: '对方已同意解锁',
        desc: `${targetName}已同意解锁联系方式，是否同意？`,
        actions: (
          <>
            <Button className="btn-secondary" onClick={handleReject}>
              拒绝
            </Button>
            <Button className="btn-primary" onClick={handleApprove}>
              同意解锁
            </Button>
          </>
        )
      };
    }

    // 都未同意，可以发起申请
    if (status.canUnlock) {
      return {
        icon: '🔓',
        title: '申请解锁联系方式',
        desc: `您与${targetName}已完成${status.collaborationCount}单合作，可以申请解锁联系方式`,
        tips: [
          '解锁后可直接沟通',
          '后续合作可脱离平台',
          '需要对方同意才能解锁'
        ],
        actions: (
          <>
            <Button className="btn-secondary" onClick={onClose}>
              取消
            </Button>
            <Button className="btn-primary" onClick={handleRequest}>
              申请解锁
            </Button>
          </>
        )
      };
    }

    // 还未达到解锁条件
    return {
      icon: '🔒',
      title: '暂不可解锁',
      desc: `再完成 ${2 - status.collaborationCount} 单可解锁联系方式`,
      actions: (
        <Button className="btn-secondary" onClick={onClose}>
          知道了
        </Button>
      )
    };
  };

  const content = getModalContent();

  // 庆祝动效
  if (showCelebration) {
    return (
      <View className="unlock-modal-mask celebration">
        <View className="celebration-content">
          <View className="celebration-icon">🎉</View>
          <Text className="celebration-title">恭喜！联系方式已解锁</Text>
          <Text className="celebration-subtitle">你们已建立直接联系</Text>
          <View className="fireworks">
            <View className="firework firework-1">✨</View>
            <View className="firework firework-2">✨</View>
            <View className="firework firework-3">✨</View>
            <View className="firework firework-4">✨</View>
            <View className="firework firework-5">✨</View>
            <View className="firework firework-6">✨</View>
          </View>
        </View>
      </View>
    );
  }

  // 免责声明
  if (showDisclaimer) {
    return (
      <View className="unlock-modal-mask" onClick={(e) => e.stopPropagation()}>
        <View className="unlock-modal disclaimer-modal">
          <View className="modal-icon">⚠️</View>
          <Text className="modal-title">重要提示</Text>
          <View className="disclaimer-content">
            <Text className="disclaimer-text">
              恭喜你们建立了直接联系！现在可以查看对方的联系方式。
            </Text>
            <View className="disclaimer-box">
              <Text className="disclaimer-highlight">
                ⚠️ 平台免责声明
              </Text>
              <Text className="disclaimer-detail">
                解锁联系方式后，双方可以脱离平台直接对接。
              </Text>
              <Text className="disclaimer-detail">
                <Text className="disclaimer-bold">平台不再对脱离平台后产生的任何交易、纠纷或问题承担责任。</Text>
              </Text>
              <Text className="disclaimer-detail">
                建议重要合作仍通过平台进行，以获得平台保障。
              </Text>
            </View>
          </View>
          <View className="modal-actions">
            <Button className="btn-primary full-width" onClick={() => {
              setShowDisclaimer(false);
              onSuccess();
              onClose();
            }}>
              我已知晓
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="unlock-modal-mask" onClick={onClose}>
      <View className="unlock-modal" onClick={(e) => e.stopPropagation()}>
        <View className="modal-icon">{content.icon}</View>
        <Text className="modal-title">{content.title}</Text>
        <Text className="modal-desc">{content.desc}</Text>

        {content.tips && (
          <View className="modal-tips">
            {content.tips.map((tip, index) => (
              <View key={index} className="tip-item">
                <Text className="tip-icon">✓</Text>
                <Text className="tip-text">{tip}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="modal-actions">{content.actions}</View>
      </View>
    </View>
  );
}
