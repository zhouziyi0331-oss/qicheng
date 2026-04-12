import { View, Text, Input, Textarea, Picker, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

export default function Publish() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: '',
    estimatedMinutes: '',
    acceptanceCriteria: '',
    deadline: ''
  });

  const [step, setStep] = useState(1); // 1: 填写信息, 2: AI价格建议, 3: 确认支付
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<any>(null);
  const [companyPrice, setCompanyPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const taskTypes = ['软件开发', 'UI设计', '文案撰写', '视频剪辑', '数据分析', '其他'];
  const [taskTypeIndex, setTaskTypeIndex] = useState(0);

  // 步骤1: 提交基本信息，获取AI价格建议
  const handleGetPriceSuggestion = async () => {
    if (!formData.title || !formData.description) {
      Taro.showToast({ title: '请填写标题和描述', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/tasks/flow/ai-price-suggestion',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          title: formData.title,
          description: formData.description,
          taskType: taskTypes[taskTypeIndex],
          estimatedMinutes: parseInt(formData.estimatedMinutes) || 0
        }
      });

      if (res.data.success) {
        setAiPriceSuggestion(res.data.data);
        setCompanyPrice(res.data.data.aiPriceMin.toString());
        setStep(2);
      } else {
        Taro.showToast({ title: res.data.message || '获取价格建议失败', icon: 'none' });
      }
    } catch (err) {
      console.error('获取AI价格建议失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 步骤2: 确认价格，进入支付
  const handleConfirmPrice = () => {
    const price = parseFloat(companyPrice);
    if (!price || price < aiPriceSuggestion.aiPriceMin || price > aiPriceSuggestion.aiPriceMax) {
      Taro.showToast({
        title: `请在¥${aiPriceSuggestion.aiPriceMin}-¥${aiPriceSuggestion.aiPriceMax}区间内定价`,
        icon: 'none'
      });
      return;
    }
    setStep(3);
  };

  // 步骤3: 支付定金并发布任务
  const handlePublishWithDeposit = async () => {
    const price = parseFloat(companyPrice);
    const depositAmount = (price * 0.3).toFixed(2);

    Taro.showModal({
      title: '确认发布',
      content: `您需要支付定金¥${depositAmount}（30%），确认后将开始AI匹配学生`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          setLoading(true);
          try {
            // 模拟支付
            const paymentRes = await mockPayment(depositAmount);

            // 发布任务
            const res = await Taro.request({
              url: 'http://localhost:3000/api/v1/tasks/flow/publish-with-deposit',
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              },
              data: {
                title: formData.title,
                description: formData.description,
                taskType: taskTypes[taskTypeIndex],
                track: 'A',
                levelRequired: 0,
                acceptanceCriteria: formData.acceptanceCriteria,
                deadline: formData.deadline,
                estimatedMinutes: parseInt(formData.estimatedMinutes) || 0,
                aiPriceMin: aiPriceSuggestion.aiPriceMin,
                aiPriceMax: aiPriceSuggestion.aiPriceMax,
                companyPrice: price,
                paymentMethod: 'wechat',
                transactionId: paymentRes.transactionId
              }
            });

            if (res.data.success) {
              Taro.showToast({ title: '发布成功！', icon: 'success' });
              setTimeout(() => {
                Taro.navigateTo({ url: `/pages/tasks/index?taskId=${res.data.data.taskId}` });
              }, 1500);
            } else {
              Taro.showToast({ title: res.data.message || '发布失败', icon: 'none' });
            }
          } catch (err) {
            console.error('发布任务失败:', err);
            Taro.showToast({ title: '网络错误', icon: 'none' });
          } finally {
            setLoading(false);
          }
        }
      }
    });
  };

  // 模拟支付
  const mockPayment = (_amount: string): Promise<{ transactionId: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ transactionId: `TX${Date.now()}` });
      }, 1000);
    });
  };

  return (
    <View className="publish-page">
      {/* 步骤指示器 */}
      <View className="steps">
        <View className={`step ${step >= 1 ? 'active' : ''}`}>
          <View className="step-number">1</View>
          <Text className="step-text">填写信息</Text>
        </View>
        <View className="step-line"></View>
        <View className={`step ${step >= 2 ? 'active' : ''}`}>
          <View className="step-number">2</View>
          <Text className="step-text">AI定价</Text>
        </View>
        <View className="step-line"></View>
        <View className={`step ${step >= 3 ? 'active' : ''}`}>
          <View className="step-number">3</View>
          <Text className="step-text">支付定金</Text>
        </View>
      </View>

      {/* 步骤1: 填写任务信息 */}
      {step === 1 && (
        <View className="form-container">
          <View className="form-section">
            <Text className="section-title">基本信息</Text>

            <View className="form-item">
              <Text className="label">任务标题 *</Text>
              <Input
                className="input"
                placeholder="请输入任务标题"
                value={formData.title}
                onInput={(e) => setFormData({ ...formData, title: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="label">任务描述 *</Text>
              <Textarea
                className="textarea"
                placeholder="详细描述任务需求、目标和要求（最多500字）"
                maxlength={500}
                value={formData.description}
                onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
              />
              <Text className="char-count">{formData.description.length}/500</Text>
            </View>

            <View className="form-item">
              <Text className="label">任务类别</Text>
              <Picker
                mode="selector"
                range={taskTypes}
                value={taskTypeIndex}
                onChange={(e) => setTaskTypeIndex(Number(e.detail.value))}
              >
                <View className="picker">
                  {taskTypes[taskTypeIndex]}
                </View>
              </Picker>
            </View>

            <View className="form-item">
              <Text className="label">预计时长（分钟）</Text>
              <Input
                className="input"
                type="number"
                placeholder="预计完成时长"
                value={formData.estimatedMinutes}
                onInput={(e) => setFormData({ ...formData, estimatedMinutes: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="label">验收标准 *</Text>
              <Textarea
                className="textarea"
                placeholder="请描述验收标准"
                value={formData.acceptanceCriteria}
                onInput={(e) => setFormData({ ...formData, acceptanceCriteria: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="label">截止日期</Text>
              <Picker
                mode="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.detail.value })}
              >
                <View className="picker">
                  {formData.deadline || '请选择截止日期'}
                </View>
              </Picker>
            </View>
          </View>

          <Button
            className="submit-btn"
            onClick={handleGetPriceSuggestion}
            loading={loading}
          >
            下一步：获取AI价格建议
          </Button>
        </View>
      )}

      {/* 步骤2: AI价格建议 */}
      {step === 2 && aiPriceSuggestion && (
        <View className="price-suggestion">
          <View className="suggestion-card">
            <Text className="card-title">AI价格建议</Text>
            <View className="price-range">
              <Text className="price-label">建议价格区间</Text>
              <Text className="price-value">
                ¥{aiPriceSuggestion.aiPriceMin} - ¥{aiPriceSuggestion.aiPriceMax}
              </Text>
            </View>
            <Text className="suggestion-text">{aiPriceSuggestion.suggestion}</Text>

            <View className="factors">
              <Text className="factors-title">定价依据：</Text>
              {aiPriceSuggestion.factors.map((factor: string, index: number) => (
                <Text key={index} className="factor-item">• {factor}</Text>
              ))}
            </View>
          </View>

          <View className="price-input-section">
            <Text className="section-title">您的定价</Text>
            <View className="price-input-wrapper">
              <Text className="currency">¥</Text>
              <Input
                className="price-input"
                type="digit"
                placeholder="请输入价格"
                value={companyPrice}
                onInput={(e) => setCompanyPrice(e.detail.value)}
              />
            </View>
            <Text className="price-hint">
              学生将看到 ¥{(parseFloat(companyPrice) * 0.85).toFixed(2)}（平台抽成15%）
            </Text>
          </View>

          <View className="button-group">
            <Button className="back-btn" onClick={() => setStep(1)}>返回修改</Button>
            <Button className="next-btn" onClick={handleConfirmPrice}>确认价格</Button>
          </View>
        </View>
      )}

      {/* 步骤3: 支付定金 */}
      {step === 3 && (
        <View className="payment-section">
          <View className="payment-card">
            <Text className="card-title">支付定金</Text>

            <View className="payment-detail">
              <View className="detail-row">
                <Text className="detail-label">任务总价</Text>
                <Text className="detail-value">¥{companyPrice}</Text>
              </View>
              <View className="detail-row">
                <Text className="detail-label">定金（30%）</Text>
                <Text className="detail-value highlight">
                  ¥{(parseFloat(companyPrice) * 0.3).toFixed(2)}
                </Text>
              </View>
              <View className="detail-row">
                <Text className="detail-label">尾款（70%）</Text>
                <Text className="detail-value">
                  ¥{(parseFloat(companyPrice) * 0.7).toFixed(2)}
                </Text>
              </View>
            </View>

            <View className="payment-info">
              <Text className="info-title">支付说明：</Text>
              <Text className="info-item">• 支付定金后，AI将为您匹配10位最合适的学生</Text>
              <Text className="info-item">• 您可以从中选择5位发送任务邀请</Text>
              <Text className="info-item">• 学生完成任务并验收通过后，再支付尾款</Text>
              <Text className="info-item">• 定金和尾款均由平台托管，保障双方权益</Text>
            </View>
          </View>

          <View className="button-group">
            <Button className="back-btn" onClick={() => setStep(2)}>返回修改</Button>
            <Button
              className="pay-btn"
              onClick={handlePublishWithDeposit}
              loading={loading}
            >
              支付定金并发布
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
