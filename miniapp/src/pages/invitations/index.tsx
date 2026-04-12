import { View, Text, ScrollView, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface Invitation {
  matchId: string;
  taskId: string;
  title: string;
  description: string;
  taskType: string;
  price: number; // 学生看到的85%价格
  deadline: string;
  estimatedHours: number;
  levelRequired: number;
  acceptanceCriteria: string;
  matchScore: number;
  matchReason: string;
  companyName: string;
  industry: string;
  invitedAt: string;
  invitationStatus: string;
}

export default function Invitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/tasks/flow/invitations',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setInvitations(res.data.data.invitations);
      } else {
        Taro.showToast({ title: res.data.message || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载任务邀请失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
  };

  const handleAccept = async (invitation: Invitation) => {
    Taro.showModal({
      title: '确认接单',
      content: `确认接受任务《${invitation.title}》吗？报酬¥${invitation.price}，先到先得！`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            Taro.showLoading({ title: '接单中...' });
            const res = await Taro.request({
              url: `http://localhost:3000/api/v1/tasks/flow/${invitation.taskId}/accept`,
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              }
            });

            Taro.hideLoading();

            if (res.data.success) {
              Taro.showToast({ title: '接单成功！', icon: 'success' });
              setTimeout(() => {
                Taro.navigateTo({ url: `/pages/tasks/detail?id=${invitation.taskId}` });
              }, 1500);
            } else {
              Taro.showToast({ title: res.data.message || '接单失败', icon: 'none' });
              // 刷新列表
              loadInvitations();
            }
          } catch (err) {
            Taro.hideLoading();
            console.error('接单失败:', err);
            Taro.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  };

  const handleReject = async (invitation: Invitation) => {
    Taro.showModal({
      title: '确认拒绝',
      content: `确认拒绝任务《${invitation.title}》吗？`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            Taro.showLoading({ title: '处理中...' });
            const res = await Taro.request({
              url: `http://localhost:3000/api/v1/tasks/flow/${invitation.taskId}/reject`,
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              },
              data: {
                reason: '不合适'
              }
            });

            Taro.hideLoading();

            if (res.data.success) {
              Taro.showToast({ title: '已拒绝', icon: 'success' });
              loadInvitations();
            } else {
              Taro.showToast({ title: res.data.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            Taro.hideLoading();
            console.error('拒绝失败:', err);
            Taro.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <View className="invitations-page">
      {/* 头部统计 */}
      <View className="header">
        <Text className="title">任务邀请</Text>
        <Text className="count">共{invitations.length}个邀请</Text>
      </View>

      {loading ? (
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      ) : invitations.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无任务邀请</Text>
          <Text className="empty-hint">企业发布任务后，AI会为您推送合适的任务</Text>
        </View>
      ) : (
        <ScrollView className="invitation-list" scrollY>
          {invitations.map((invitation) => (
            <View key={invitation.matchId} className="invitation-card">
              {/* 匹配度标签 */}
              <View className="match-badge">
                <Text className="match-score">{invitation.matchScore}%</Text>
                <Text className="match-text">匹配</Text>
              </View>

              {/* 任务信息 */}
              <View className="task-info">
                <Text className="task-title">{invitation.title}</Text>
                <View className="task-meta">
                  <Text className="meta-item">{invitation.taskType}</Text>
                  <Text className="meta-item">{invitation.companyName}</Text>
                  {invitation.industry && (
                    <Text className="meta-item">{invitation.industry}</Text>
                  )}
                </View>
              </View>

              {/* 价格和时间 */}
              <View className="task-details">
                <View className="detail-item">
                  <Text className="detail-label">报酬</Text>
                  <Text className="detail-value price">¥{invitation.price}</Text>
                </View>
                <View className="detail-item">
                  <Text className="detail-label">截止</Text>
                  <Text className="detail-value">{formatDate(invitation.deadline)}</Text>
                </View>
                {invitation.estimatedHours && (
                  <View className="detail-item">
                    <Text className="detail-label">时长</Text>
                    <Text className="detail-value">{invitation.estimatedHours}小时</Text>
                  </View>
                )}
              </View>

              {/* 匹配理由 */}
              <View className="match-reason">
                <Text className="reason-label">推荐理由：</Text>
                <Text className="reason-text">{invitation.matchReason}</Text>
              </View>

              {/* 操作按钮 */}
              <View className="action-buttons">
                <Button
                  className="btn-detail"
                  onClick={() => handleViewDetail(invitation)}
                >
                  查看详情
                </Button>
                <Button
                  className="btn-reject"
                  onClick={() => handleReject(invitation)}
                >
                  拒绝
                </Button>
                <Button
                  className="btn-accept"
                  onClick={() => handleAccept(invitation)}
                >
                  立即接单
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 详情弹窗 */}
      {selectedInvitation && (
        <View className="detail-modal" onClick={() => setSelectedInvitation(null)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">{selectedInvitation.title}</Text>
              <Text className="modal-close" onClick={() => setSelectedInvitation(null)}>×</Text>
            </View>

            <ScrollView className="modal-body" scrollY>
              <View className="modal-section">
                <Text className="section-title">任务描述</Text>
                <Text className="section-content">{selectedInvitation.description}</Text>
              </View>

              <View className="modal-section">
                <Text className="section-title">验收标准</Text>
                <Text className="section-content">{selectedInvitation.acceptanceCriteria}</Text>
              </View>

              <View className="modal-section">
                <Text className="section-title">任务信息</Text>
                <View className="info-row">
                  <Text className="info-label">任务类型</Text>
                  <Text className="info-value">{selectedInvitation.taskType}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">报酬</Text>
                  <Text className="info-value price">¥{selectedInvitation.price}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">截止日期</Text>
                  <Text className="info-value">{formatDate(selectedInvitation.deadline)}</Text>
                </View>
                {selectedInvitation.estimatedHours && (
                  <View className="info-row">
                    <Text className="info-label">预计时长</Text>
                    <Text className="info-value">{selectedInvitation.estimatedHours}小时</Text>
                  </View>
                )}
                <View className="info-row">
                  <Text className="info-label">匹配度</Text>
                  <Text className="info-value">{selectedInvitation.matchScore}%</Text>
                </View>
              </View>

              <View className="modal-section">
                <Text className="section-title">企业信息</Text>
                <View className="info-row">
                  <Text className="info-label">企业名称</Text>
                  <Text className="info-value">{selectedInvitation.companyName}</Text>
                </View>
                {selectedInvitation.industry && (
                  <View className="info-row">
                    <Text className="info-label">所属行业</Text>
                    <Text className="info-value">{selectedInvitation.industry}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="modal-footer">
              <Button
                className="modal-btn-reject"
                onClick={() => {
                  setSelectedInvitation(null);
                  handleReject(selectedInvitation);
                }}
              >
                拒绝
              </Button>
              <Button
                className="modal-btn-accept"
                onClick={() => {
                  setSelectedInvitation(null);
                  handleAccept(selectedInvitation);
                }}
              >
                立即接单
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
