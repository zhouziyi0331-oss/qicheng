import { View, Text, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

interface PaymentInfo {
  taskId: string;
  taskTitle: string;
  amount: number;
  paymentType: 'deposit' | 'final';
  description: string;
}

export default function Payment() {
  const router = useRouter();
  const { taskId, type } = router.params;
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadPaymentInfo();
  }, [taskId, type]);

  const loadPaymentInfo = async () => {
    setLoading(true);
    try {
      // 加载任务信息
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${taskId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        const task = res.data.data;
        const isDeposit = type === 'deposit';
        const amount = isDeposit ? task.price * 0.3 : task.price * 0.7;

        setPaymentInfo({
          taskId: task.id,
          taskTitle: task.title,
          amount: Number(amount.toFixed(2)),
          paymentType: isDeposit ? 'deposit' : 'final',
          description: isDeposit
            ? '支付30%定金后，AI将为您匹配合适的学生'
            : '支付70%尾款后，任务将进入7天确认期'
        });
      }
    } catch (err) {
      console.error('加载支付信息失败:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!paymentInfo) return;

    setPaying(true);
    try {
      // 调用后端创建支付订单
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/payments/create`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json'
        },
        data: {
          taskId: taskId,
          paymentType: paymentInfo.paymentType,
          amount: paymentInfo.amount
        }
      });

      if (res.data.success) {
        const paymentData = res.data.data;

        // 判断是否在微信环境
        if (process.env.TARO_ENV === 'weapp') {
          // 调用微信支付
          await requestWechatPayment(paymentData);
        } else {
          // 非微信环境，使用模拟支付
          await simulatePayment();
        }
      } else {
        throw new Error(res.data.message || '创建支付订单失败');
      }
    } catch (err: any) {
      setPaying(false);
      console.error('支付失败:', err);
      Taro.showToast({ title: err.message || '支付失败', icon: 'none' });
    }
  };

  const requestWechatPayment = async (paymentData: any) => {
    try {
      // 调用微信支付
      await Taro.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType || 'RSA',
        paySign: paymentData.paySign
      });

      // 支付成功
      Taro.showToast({ title: '支付成功', icon: 'success' });

      setTimeout(() => {
        handlePaymentSuccess();
      }, 1500);
    } catch (err: any) {
      setPaying(false);

      if (err.errMsg === 'requestPayment:fail cancel') {
        Taro.showToast({ title: '支付已取消', icon: 'none' });
      } else {
        console.error('微信支付失败:', err);
        Taro.showToast({ title: '支付失败', icon: 'none' });
      }
    }
  };

  const handlePaymentSuccess = () => {
    if (paymentInfo?.paymentType === 'deposit') {
      // 定金支付成功，跳转到选择学生页面
      Taro.redirectTo({
        url: `/pages/select-students/index?taskId=${taskId}`
      });
    } else {
      // 尾款支付成功，返回任务详情
      Taro.navigateBack();
    }
  };

  const simulatePayment = async () => {
    try {
      Taro.showLoading({ title: '支付中...' });

      // 模拟支付延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 确认支付
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/flow/${taskId}/pay-confirm`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          paymentType: paymentInfo?.paymentType,
          transactionId: `MOCK_${Date.now()}`
        }
      });

      Taro.hideLoading();

      if (res.data.success) {
        Taro.showToast({ title: '支付成功', icon: 'success' });

        setTimeout(() => {
          if (paymentInfo?.paymentType === 'deposit') {
            // 定金支付成功，跳转到选择学生页面
            Taro.redirectTo({
              url: `/pages/select-students/index?taskId=${taskId}`
            });
          } else {
            // 尾款支付成功，返回任务详情
            Taro.navigateBack();
          }
        }, 1500);
      } else {
        throw new Error(res.data.message || '支付确认失败');
      }
    } catch (err: any) {
      Taro.hideLoading();
      console.error('支付确认失败:', err);
      Taro.showToast({ title: err.message || '支付失败', icon: 'none' });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View className="payment-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!paymentInfo) {
    return (
      <View className="payment-page">
        <View className="empty">支付信息不存在</View>
      </View>
    );
  }

  return (
    <View className="payment-page">
      <View className="payment-header">
        <Text className="payment-title">确认支付</Text>
        <Text className="payment-type">
          {paymentInfo.paymentType === 'deposit' ? '定金支付' : '尾款支付'}
        </Text>
      </View>

      <View className="payment-info">
        <View className="info-card">
          <View className="info-row">
            <Text className="info-label">任务名称</Text>
            <Text className="info-value">{paymentInfo.taskTitle}</Text>
          </View>

          <View className="info-row">
            <Text className="info-label">支付类型</Text>
            <Text className="info-value">
              {paymentInfo.paymentType === 'deposit' ? '定金 (30%)' : '尾款 (70%)'}
            </Text>
          </View>

          <View className="info-row highlight">
            <Text className="info-label">支付金额</Text>
            <Text className="info-value amount">¥{paymentInfo.amount}</Text>
          </View>
        </View>

        <View className="description-card">
          <Text className="description-icon">ℹ️</Text>
          <Text className="description-text">{paymentInfo.description}</Text>
        </View>

        {paymentInfo.paymentType === 'deposit' && (
          <View className="tips-card">
            <Text className="tips-title">温馨提示</Text>
            <View className="tips-list">
              <Text className="tip-item">• 支付定金后，AI将为您匹配10名合适的学生</Text>
              <Text className="tip-item">• 您可以从中选择5名学生邀请接单</Text>
              <Text className="tip-item">• 第一个接受的学生将获得任务</Text>
              <Text className="tip-item">• 如无人接单，定金将全额退还</Text>
            </View>
          </View>
        )}

        {paymentInfo.paymentType === 'final' && (
          <View className="tips-card">
            <Text className="tips-title">温馨提示</Text>
            <View className="tips-list">
              <Text className="tip-item">• 支付尾款后，任务进入7天确认期</Text>
              <Text className="tip-item">• 7天内可以补充需求或提出修改意见</Text>
              <Text className="tip-item">• 7天后系统将自动确认任务完成</Text>
              <Text className="tip-item">• 确认后学生将收到全额报酬</Text>
            </View>
          </View>
        )}
      </View>

      <View className="payment-footer">
        <View className="amount-display">
          <Text className="amount-label">实付金额</Text>
          <Text className="amount-value">¥{paymentInfo.amount}</Text>
        </View>
        <Button
          className="pay-btn"
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? '支付中...' : '确认支付'}
        </Button>
      </View>
    </View>
  );
}
