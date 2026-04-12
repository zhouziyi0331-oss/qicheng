import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

interface Task {
  id: string;
  title: string;
  description: string;
  taskType: string;
  price: number;
  deadline: string;
  status: string;
  studentName?: string;
  studentId?: string;
  progressPercent?: number;
  createdAt: string;
}

interface Deliverable {
  id: string;
  description: string;
  fileUrls: string[];
  links: string[];
  submittedAt: string;
  aiReviewStatus: string;
  aiReviewScore?: number;
  aiReviewFeedback?: string;
  companyReviewStatus?: string;
  companyReviewFeedback?: string;
}

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.params;
  const [task, setTask] = useState<Task | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewFeedback, setReviewFeedback] = useState('');

  useEffect(() => {
    loadTaskDetail();
  }, [id]);

  const loadTaskDetail = async () => {
    setLoading(true);
    try {
      // 加载任务详情
      const taskRes = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (taskRes.data.success) {
        setTask(taskRes.data.data);
      }

      // 加载交付物
      const deliverableRes = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/flow/${id}/deliverable`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (deliverableRes.data.success) {
        setDeliverable(deliverableRes.data.data);
      }
    } catch (err) {
      console.error('加载任务详情失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (reviewAction === 'reject' && !reviewFeedback.trim()) {
      Taro.showToast({ title: '请填写拒绝原因', icon: 'none' });
      return;
    }

    try {
      Taro.showLoading({ title: '提交中...' });
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/flow/${id}/company-review`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          approved: reviewAction === 'approve',
          feedback: reviewFeedback
        }
      });

      Taro.hideLoading();

      if (res.data.success) {
        Taro.showToast({
          title: reviewAction === 'approve' ? '验收通过' : '已拒绝',
          icon: 'success'
        });
        setShowReviewModal(false);
        setReviewFeedback('');

        // 如果通过验收，跳转到支付页面
        if (reviewAction === 'approve') {
          setTimeout(() => {
            Taro.navigateTo({
              url: `/pages/payment/index?taskId=${id}&type=final`
            });
          }, 1500);
        } else {
          loadTaskDetail();
        }
      } else {
        Taro.showToast({ title: res.data.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      Taro.hideLoading();
      console.error('提交验收失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    }
  };

  const handlePayFinal = () => {
    Taro.navigateTo({
      url: `/pages/payment/index?taskId=${id}&type=final`
    });
  };

  const handleConfirm = async () => {
    Taro.showModal({
      title: '确认完成',
      content: '确认任务已完成并最终验收通过吗？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            Taro.showLoading({ title: '处理中...' });
            const res = await Taro.request({
              url: `http://localhost:3000/api/v1/tasks/flow/${id}/final-confirm`,
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              }
            });

            Taro.hideLoading();

            if (res.data.success) {
              Taro.showToast({ title: '任务已完成', icon: 'success' });
              setTimeout(() => {
                Taro.navigateBack();
              }, 1500);
            } else {
              Taro.showToast({ title: res.data.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            Taro.hideLoading();
            console.error('确认失败:', err);
            Taro.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  };

  const handleCancelTask = () => {
    Taro.showModal({
      title: '取消任务',
      content: '取消任务后将扣除30%定金作为违约金，确认取消吗？',
      confirmText: '确认取消',
      confirmColor: '#EF4444',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            Taro.showLoading({ title: '处理中...' });
            const res = await Taro.request({
              url: `http://localhost:3000/api/v1/tasks/${id}/cancel`,
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              }
            });

            Taro.hideLoading();

            if (res.data.success) {
              Taro.showToast({ title: '任务已取消', icon: 'success' });
              setTimeout(() => {
                Taro.navigateBack();
              }, 1500);
            } else {
              Taro.showToast({ title: res.data.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            Taro.hideLoading();
            console.error('取消失败:', err);
            Taro.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending_match': '待匹配',
      'matching': '匹配中',
      'pending_accept': '待接单',
      'in_progress': '进行中',
      'pending_review': '待验收',
      'reviewing': 'AI审核中',
      'pending_payment': '待支付尾款',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <View className="task-detail-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="task-detail-page">
        <View className="empty">任务不存在</View>
      </View>
    );
  }

  return (
    <View className="task-detail-page">
      <ScrollView className="content" scrollY>
        {/* 任务基本信息 */}
        <View className="info-card">
          <View className="card-header">
            <Text className="card-title">任务信息</Text>
            <View className={`status-badge status-${task.status}`}>
              {getStatusText(task.status)}
            </View>
          </View>

          <View className="info-row">
            <Text className="info-label">任务标题</Text>
            <Text className="info-value">{task.title}</Text>
          </View>

          <View className="info-row">
            <Text className="info-label">任务类型</Text>
            <Text className="info-value">{task.taskType}</Text>
          </View>

          <View className="info-row">
            <Text className="info-label">任务报酬</Text>
            <Text className="info-value price">¥{task.price}</Text>
          </View>

          <View className="info-row">
            <Text className="info-label">截止日期</Text>
            <Text className="info-value">{formatDate(task.deadline)}</Text>
          </View>

          {task.studentName && (
            <View className="info-row">
              <Text className="info-label">执行学生</Text>
              <Text className="info-value">{task.studentName}</Text>
            </View>
          )}

          {task.progressPercent !== undefined && (
            <View className="info-row">
              <Text className="info-label">任务进度</Text>
              <View className="progress-container">
                <View className="progress-bar">
                  <View className="progress-fill" style={{ width: `${task.progressPercent}%` }} />
                </View>
                <Text className="progress-text">{task.progressPercent}%</Text>
              </View>
            </View>
          )}

          <View className="info-row full">
            <Text className="info-label">任务描述</Text>
            <Text className="info-value desc">{task.description}</Text>
          </View>
        </View>

        {/* 交付物信息 */}
        {deliverable && (
          <View className="info-card">
            <View className="card-header">
              <Text className="card-title">交付物</Text>
              <Text className="submit-time">提交于 {formatDate(deliverable.submittedAt)}</Text>
            </View>

            <View className="deliverable-section">
              <Text className="section-label">作品说明</Text>
              <Text className="section-content">{deliverable.description}</Text>
            </View>

            {deliverable.fileUrls && deliverable.fileUrls.length > 0 && (
              <View className="deliverable-section">
                <Text className="section-label">作品截图</Text>
                <View className="image-grid">
                  {deliverable.fileUrls.map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      className="deliverable-image"
                      mode="aspectFill"
                      onClick={() => {
                        Taro.previewImage({
                          urls: deliverable.fileUrls,
                          current: url
                        });
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {deliverable.links && deliverable.links.length > 0 && (
              <View className="deliverable-section">
                <Text className="section-label">相关链接</Text>
                {deliverable.links.map((link, index) => (
                  <Text
                    key={index}
                    className="link-item"
                    onClick={() => {
                      Taro.setClipboardData({ data: link });
                      Taro.showToast({ title: '链接已复制', icon: 'success' });
                    }}
                  >
                    {link}
                  </Text>
                ))}
              </View>
            )}

            {/* AI审核结果 */}
            {deliverable.aiReviewStatus === 'approved' && (
              <View className="review-section ai-review">
                <View className="review-header">
                  <Text className="review-title">AI审核</Text>
                  <View className="review-badge approved">通过</View>
                </View>
                {deliverable.aiReviewScore && (
                  <Text className="review-score">评分：{deliverable.aiReviewScore}/100</Text>
                )}
                {deliverable.aiReviewFeedback && (
                  <Text className="review-feedback">{deliverable.aiReviewFeedback}</Text>
                )}
              </View>
            )}

            {deliverable.aiReviewStatus === 'rejected' && (
              <View className="review-section ai-review">
                <View className="review-header">
                  <Text className="review-title">AI审核</Text>
                  <View className="review-badge rejected">未通过</View>
                </View>
                <Text className="review-feedback">{deliverable.aiReviewFeedback}</Text>
              </View>
            )}

            {/* 企业验收结果 */}
            {deliverable.companyReviewStatus && (
              <View className="review-section company-review">
                <View className="review-header">
                  <Text className="review-title">企业验收</Text>
                  <View className={`review-badge ${deliverable.companyReviewStatus}`}>
                    {deliverable.companyReviewStatus === 'approved' ? '通过' : '未通过'}
                  </View>
                </View>
                {deliverable.companyReviewFeedback && (
                  <Text className="review-feedback">{deliverable.companyReviewFeedback}</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 快捷操作 */}
      <View className="quick-actions">
        {task.studentId && (
          <View
            className="quick-btn"
            onClick={() => {
              Taro.navigateTo({
                url: `/pages/student-profile/index?studentId=${task.studentId}`
              });
            }}
          >
            <View className="quick-icon-wrapper icon-student"></View>
            <Text className="quick-text">学生资料</Text>
          </View>
        )}

        <View
          className="quick-btn"
          onClick={() => {
            Taro.navigateTo({
              url: `/pages/task-progress/index?taskId=${id}`
            });
          }}
        >
          <View className="quick-icon-wrapper icon-progress"></View>
          <Text className="quick-text">任务进度</Text>
        </View>

        {task.status === 'in_progress' && task.studentId && (
          <View
            className="quick-btn"
            onClick={() => {
              Taro.navigateTo({
                url: `/pages/chat-detail/index?taskId=${id}&studentId=${task.studentId}`
              });
            }}
          >
            <View className="quick-icon-wrapper icon-chat"></View>
            <Text className="quick-text">联系学生</Text>
          </View>
        )}

        {task.status === 'in_progress' && (
          <View
            className="quick-btn"
            onClick={() => {
              Taro.navigateTo({
                url: `/pages/add-requirement/index?taskId=${id}`
              });
            }}
          >
            <View className="quick-icon-wrapper icon-requirement"></View>
            <Text className="quick-text">追加需求</Text>
          </View>
        )}
      </View>

      {/* 底部操作按钮 */}
      <View className="bottom-actions">
        {deliverable && deliverable.aiReviewStatus === 'approved' && !deliverable.companyReviewStatus && (
          <View className="action-buttons">
            <Button className="btn-reject" onClick={() => handleReview('reject')}>
              拒绝
            </Button>
            <Button className="btn-approve" onClick={() => handleReview('approve')}>
              验收通过
            </Button>
          </View>
        )}

        {deliverable && deliverable.companyReviewStatus === 'approved' && task.status === 'pending_payment' && (
          <Button className="btn-pay" onClick={handlePayFinal}>
            支付尾款 (¥{(task.price * 0.7).toFixed(2)})
          </Button>
        )}

        {task.status === 'completed' && (
          <Button className="btn-confirm" onClick={handleConfirm}>
            确认完成
          </Button>
        )}

        {/* 取消任务按钮 - 只在特定状态下显示 */}
        {(task.status === 'pending_match' || task.status === 'matching' || task.status === 'pending_accept' || task.status === 'in_progress') && (
          <Button className="btn-cancel" onClick={handleCancelTask}>
            取消任务
          </Button>
        )}
      </View>

      {/* 验收弹窗 */}
      {showReviewModal && (
        <View className="review-modal" onClick={() => setShowReviewModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">
                {reviewAction === 'approve' ? '验收通过' : '拒绝验收'}
              </Text>
              <Text className="modal-close" onClick={() => setShowReviewModal(false)}>×</Text>
            </View>

            <View className="modal-body">
              <View className="form-item">
                <Text className="form-label">
                  {reviewAction === 'approve' ? '验收意见（选填）' : '拒绝原因（必填）'}
                </Text>
                <textarea
                  className="form-textarea"
                  value={reviewFeedback}
                  onInput={(e) => setReviewFeedback(e.detail.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? '可以填写对学生的评价和建议...'
                      : '请说明拒绝的原因，以便学生改进...'
                  }
                  maxlength={500}
                />
                <Text className="char-count">{reviewFeedback.length}/500</Text>
              </View>
            </View>

            <View className="modal-footer">
              <Button className="modal-btn cancel" onClick={() => setShowReviewModal(false)}>
                取消
              </Button>
              <Button className="modal-btn confirm" onClick={handleSubmitReview}>
                确认{reviewAction === 'approve' ? '通过' : '拒绝'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
