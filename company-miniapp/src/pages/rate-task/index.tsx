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
  const [workQuality, setWorkQuality] = useState(0);
  const [deliveryTimeliness, setDeliveryTimeliness] = useState(0);
  const [professionalAttitude, setProfessionalAttitude] = useState(0);

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
        setPositiveTags(tags.filter(t => t.tag_type === 'student_positive'));
        setNegativeTags(tags.filter(t => t.tag_type === 'student_negative'));
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
      case 'work':
        setWorkQuality(rating);
        break;
      case 'delivery':
        setDeliveryTimeliness(rating);
        break;
      case 'attitude':
        setProfessionalAttitude(rating);
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

    if (workQuality === 0 || deliveryTimeliness === 0 || professionalAttitude === 0) {
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
          workQuality,
          deliveryTimeliness,
          professionalAttitude,
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
          <Text className="task-hint">为学生评分，帮助其他企业做出更好的选择</Text>
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
            <Text className="item-label">作品质量</Text>
            {renderStars('work', workQuality)}
          </View>

          <View className="rating-item">
            <Text className="item-label">交付及时性</Text>
            {renderStars('delivery', deliveryTimeliness)}
          </View>

          <View className="rating-item">
            <Text className="item-label">专业态度</Text>
            {renderStars('attitude', professionalAttitude)}
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
            placeholder="请详细描述学生的工作表现，帮助其他企业了解这位学生..."
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
            <Text className="option-hint">（学生将看不到您的企业名称）</Text>
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
