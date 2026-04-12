import { View, Text, Textarea, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

interface Task {
  id: number;
  title: string;
  status: string;
  student_name: string;
}

export default function Dispute() {
  const router = useRouter();
  const taskId = router.params.taskId;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 申诉类型
  const [disputeType, setDisputeType] = useState('quality_issue');
  const disputeTypes = [
    { label: '质量问题', value: 'quality_issue' },
    { label: '延期交付', value: 'delayed_delivery' },
    { label: '沟通问题', value: 'communication_issue' },
    { label: '其他问题', value: 'other' }
  ];

  // 表单数据
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);

  useEffect(() => {
    if (taskId) {
      loadTaskInfo();
    }
  }, [taskId]);

  const loadTaskInfo = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${taskId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setTask(res.data.data);
      }
    } catch (error) {
      console.error('加载任务信息失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 5 - evidence.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePaths = res.tempFilePaths;

        Taro.showLoading({ title: '上传中...' });

        try {
          const token = Taro.getStorageSync('token');
          const uploadedUrls: string[] = [];

          for (const filePath of tempFilePaths) {
            const uploadRes = await Taro.uploadFile({
              url: 'http://localhost:3000/api/v1/upload/image',
              filePath,
              name: 'file',
              header: {
                'Authorization': `Bearer ${token}`
              }
            });

            const data = JSON.parse(uploadRes.data);
            if (data.success) {
              uploadedUrls.push(data.data.url);
            }
          }

          setEvidence([...evidence, ...uploadedUrls]);
          Taro.showToast({ title: '上传成功', icon: 'success' });
        } catch (error: any) {
          console.error('上传失败:', error);
          Taro.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          Taro.hideLoading();
        }
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    const newEvidence = [...evidence];
    newEvidence.splice(index, 1);
    setEvidence(newEvidence);
  };

  const handleSubmit = async () => {
    // 验证
    if (!description.trim()) {
      Taro.showToast({
        title: '请填写申诉说明',
        icon: 'none'
      });
      return;
    }

    if (description.trim().length < 20) {
      Taro.showToast({
        title: '申诉说明至少20字',
        icon: 'none'
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/disputes',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          taskId: parseInt(taskId!),
          disputeType,
          description: description.trim(),
          evidence
        }
      });

      if (res.statusCode === 200) {
        Taro.showToast({
          title: '申诉已提交',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 2000);
      } else {
        throw new Error(res.data.message || '提交失败');
      }
    } catch (error: any) {
      console.error('提交申诉失败:', error);
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="dispute-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="dispute-page">
      <ScrollView className="content" scrollY>
        {/* 任务信息 */}
        {task && (
          <View className="task-card">
            <Text className="task-title">{task.title}</Text>
            <View className="task-meta">
              <Text className="meta-item">执行学生: {task.student_name}</Text>
            </View>
          </View>
        )}

        {/* 申诉类型 */}
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">申诉类型</Text>
            <Text className="required">*</Text>
          </View>
          <View className="type-grid">
            {disputeTypes.map((type) => (
              <View
                key={type.value}
                className={`type-item ${disputeType === type.value ? 'active' : ''}`}
                onClick={() => setDisputeType(type.value)}
              >
                <Text className="type-text">{type.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 申诉说明 */}
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">申诉说明</Text>
            <Text className="required">*</Text>
          </View>
          <Textarea
            className="textarea"
            placeholder="请详细描述问题，包括具体情况、时间、影响等（至少20字）..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={1000}
          />
          <Text className="char-count">{description.length}/1000</Text>
        </View>

        {/* 证据上传 */}
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">证据材料</Text>
            <Text className="optional">（选填，最多5张）</Text>
          </View>
          <View className="evidence-grid">
            {evidence.map((url, index) => (
              <View key={index} className="evidence-item">
                <image className="evidence-image" src={url} mode="aspectFill" />
                <View
                  className="remove-btn"
                  onClick={() => handleRemoveImage(index)}
                >
                  <Text className="remove-icon">×</Text>
                </View>
              </View>
            ))}
            {evidence.length < 5 && (
              <View className="upload-btn" onClick={handleChooseImage}>
                <Text className="upload-icon">+</Text>
                <Text className="upload-text">上传图片</Text>
              </View>
            )}
          </View>
        </View>

        {/* 温馨提示 */}
        <View className="tips-card">
          <Text className="tips-title">⚠️ 申诉须知</Text>
          <Text className="tips-item">• 请如实描述问题，提供充分证据</Text>
          <Text className="tips-item">• 平台将在3个工作日内处理</Text>
          <Text className="tips-item">• 恶意申诉将影响信用评级</Text>
          <Text className="tips-item">• 申诉期间任务状态保持不变</Text>
        </View>
      </ScrollView>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View
          className={`submit-btn ${submitting ? 'disabled' : ''}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text className="submit-text">
            {submitting ? '提交中...' : '提交申诉'}
          </Text>
        </View>
      </View>
    </View>
  );
}
