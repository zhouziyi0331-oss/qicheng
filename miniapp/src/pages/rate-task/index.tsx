import { View, Text, Textarea, ScrollView } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

interface RatingTag {
  id: number;
  tag_name: string;
  tag_type: string;
}

export default function RateTask() {
  const router = useRouter();
  const taskId = router.params.taskId;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 评分
  const [overallRating, setOverallRating] = useState(0);
  const [requirementClarity, setRequirementClarity] = useState(0);
  const [communicationQuality, setCommunicationQuality] = useState(0);
  const [paymentTimeliness, setPaymentTimeliness] = useState(0);

  // 评价内容
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 标签预设
  const [positiveTags, setPositiveTags] = useState<RatingTag[]>([]);
  const [negativeTags, setNegativeTags] = useState<RatingTag[]>([]);

  useEffect(() => {
    loadTaskInfo();
    loadTagPresets();
  }, []);

  const loadTaskInfo = async () => {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/rating/check/${taskId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200 && res.data.canRate) {
        setTask(res.data.task);
      } else {
        Taro.showToast({
          title: res.data.reason || '无法评价此任务',
          icon: 'none'
        });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
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

  const loadTagPresets = async () => {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/rating/tags/presets',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        const tags = res.data.tags || [];
        setPositiveTags(tags.filter(t => t.tag_type === 'company_positive'));
        setNegativeTags(tags.filter(t => t.tag_type === 'company_negative'));
      }
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleStarClick = (type: string, rating: number) => {
    switch (type) {
      case 'overall':
        setOverallRating(rating);
        break;
      case 'requirement':
        setRequirementClarity(rating);
        break;
      case 'communication':
        setCommunicationQuality(rating);
        break;
      case 'payment':
        setPaymentTimeliness(rating);
        break;
    }
  };

  const handleTagClick = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSubmit = async () => {
    // 验证必填项
    if (overallRating === 0) {
      Taro.showToast({
        title: '请选择总体评分',
        icon: 'none'
      });
      return;
    }

    if (requirementClarity === 0 || communicationQuality === 0 || paymentTimeliness === 0) {
      Taro.showToast({
        title: '请完成所有维度评分',
        icon: 'none'
      });
      return;
    }

    if (!comment.trim()) {
      Taro.showToast({
        title: '请填写评价内容',
        icon: 'none'
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/rating/submit',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          taskId: parseInt(taskId!),
          overallRating,
          requirementClarity,
          communicationQuality,
          paymentTimeliness,
          comment: comment.trim(),
          tags: selectedTags,
          isAnonymous
        }
      });

      if (res.statusCode === 200) {
        Taro.showToast({
          title: '评价成功',
          icon: 'success'
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        throw new Error(res.data.error || '提交失败');
      }
    } catch (error: any) {
      console.error('提交评价失败:', error);
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (type: string, currentRating: number) => {
    return (
      <View className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <Text
            key={star}
            className={`star ${star <= currentRating ? 'active' : ''}`}
            onClick={() => handleStarClick(type, star)}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="rate-task-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="rate-task-page">
      <ScrollView className="content" scrollY>
        {/* 任务信息 */}
        <View className="task-card">
          <Text className="task-title">{task?.title}</Text>
          <Text className="task-hint">为企业评分，帮助其他学生做出更好的选择</Text>
        </View>

        {/* 总体评分 */}
        <View className="rating-section">
          <View className="section-header">
            <Text className="section-title">总体评分</Text>
            <Text className="required">*</Text>
          </View>
          <View className="rating-row">
            {renderStars('overall', overallRating)}
            <Text className="rating-text">
              {overallRating === 0 ? '请评分' : ['很差', '较差', '一般', '满意', '非常满意'][overallRating - 1]}
            </Text>
          </View>
        </View>

        {/* 详细评分 */}
        <View className="rating-section">
          <View className="section-header">
            <Text className="section-title">详细评分</Text>
            <Text className="required">*</Text>
          </View>

          <View className="rating-item">
            <Text className="item-label">需求清晰度</Text>
            {renderStars('requirement', requirementClarity)}
          </View>

          <View className="rating-item">
            <Text className="item-label">沟通质量</Text>
            {renderStars('communication', communicationQuality)}
          </View>

          <View className="rating-item">
            <Text className="item-label">付款及时性</Text>
            {renderStars('payment', paymentTimeliness)}
          </View>
        </View>

        {/* 标签选择 */}
        <View className="rating-section">
          <View className="section-header">
            <Text className="section-title">选择标签</Text>
            <Text className="optional">（可选）</Text>
          </View>

          <View className="tags-group">
            <Text className="tags-label">优点</Text>
            <View className="tags">
              {positiveTags.map(tag => (
                <View
                  key={tag.id}
                  className={`tag positive ${selectedTags.includes(tag.tag_name) ? 'selected' : ''}`}
                  onClick={() => handleTagClick(tag.tag_name)}
                >
                  <Text className="tag-text">{tag.tag_name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="tags-group">
            <Text className="tags-label">不足</Text>
            <View className="tags">
              {negativeTags.map(tag => (
                <View
                  key={tag.id}
                  className={`tag negative ${selectedTags.includes(tag.tag_name) ? 'selected' : ''}`}
                  onClick={() => handleTagClick(tag.tag_name)}
                >
                  <Text className="tag-text">{tag.tag_name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 文字评价 */}
        <View className="rating-section">
          <View className="section-header">
            <Text className="section-title">评价内容</Text>
            <Text className="required">*</Text>
          </View>
          <Textarea
            className="comment-input"
            placeholder="请详细描述您的合作体验，帮助其他学生了解这家企业..."
            value={comment}
            onInput={(e) => setComment(e.detail.value)}
            maxlength={500}
          />
          <Text className="char-count">{comment.length}/500</Text>
        </View>

        {/* 匿名选项 */}
        <View className="rating-section">
          <View
            className="anonymous-option"
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <View className={`checkbox ${isAnonymous ? 'checked' : ''}`}>
              {isAnonymous && <Text className="check-icon">✓</Text>}
            </View>
            <Text className="option-text">匿名评价</Text>
            <Text className="option-hint">（企业将看不到您的昵称和头像）</Text>
          </View>
        </View>

        {/* 提交按钮 */}
        <View className="submit-section">
          <View
            className={`submit-btn ${submitting ? 'disabled' : ''}`}
            onClick={submitting ? undefined : handleSubmit}
          >
            <Text className="submit-text">
              {submitting ? '提交中...' : '提交评价'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
