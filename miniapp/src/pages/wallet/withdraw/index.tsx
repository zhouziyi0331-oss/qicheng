import Taro from '@tarojs/taro';
import { View, Text, Input, Button, Radio, RadioGroup, Label } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './index.scss';

export default function Withdraw() {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/escrow/account',
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setAvailableBalance(res.data.data.availableBalance);
      }
    } catch (error) {
      console.error('加载账户信息失败:', error);
    }
  };

  const handleWithdrawAll = () => {
    setAmount(availableBalance.toFixed(2));
  };

  const handleSubmit = async () => {
    // 验证
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      Taro.showToast({
        title: '请输入提现金额',
        icon: 'none',
      });
      return;
    }

    if (amountNum < 10) {
      Taro.showToast({
        title: '最低提现金额为10元',
        icon: 'none',
      });
      return;
    }

    if (amountNum > availableBalance) {
      Taro.showToast({
        title: '提现金额超过可用余额',
        icon: 'none',
      });
      return;
    }

    if (!accountName.trim()) {
      Taro.showToast({
        title: '请输入真实姓名',
        icon: 'none',
      });
      return;
    }

    if (!accountNumber.trim()) {
      Taro.showToast({
        title: `请输入${withdrawalMethod === 'wechat' ? '微信' : '支付宝'}账号`,
        icon: 'none',
      });
      return;
    }

    // 确认提现
    const confirmRes = await Taro.showModal({
      title: '确认提现',
      content: `提现金额：¥${amountNum.toFixed(2)}\n提现方式：${
        withdrawalMethod === 'wechat' ? '微信' : '支付宝'
      }\n到账时间：1-3个工作日`,
    });

    if (!confirmRes.confirm) {
      return;
    }

    setLoading(true);

    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/escrow/withdrawal',
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          amount: amountNum,
          withdrawalMethod,
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
        },
      });

      if (res.data.success) {
        Taro.showToast({
          title: '提现申请已提交',
          icon: 'success',
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        Taro.showToast({
          title: res.data.message || '提现申请失败',
          icon: 'none',
        });
      }
    } catch (error: any) {
      console.error('提现申请失败:', error);
      Taro.showToast({
        title: error.data?.message || '提现申请失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="withdraw-page">
      {/* 可用余额 */}
      <View className="balance-section">
        <Text className="balance-label">可提现余额（元）</Text>
        <Text className="balance-amount">¥{availableBalance.toFixed(2)}</Text>
      </View>

      {/* 提现金额 */}
      <View className="form-section">
        <View className="form-item">
          <Text className="form-label">提现金额</Text>
          <View className="amount-input-wrapper">
            <Text className="currency-symbol">¥</Text>
            <Input
              className="amount-input"
              type="digit"
              placeholder="最低10元"
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
            <Button className="all-btn" onClick={handleWithdrawAll}>
              全部
            </Button>
          </View>
        </View>

        {/* 提现方式 */}
        <View className="form-item">
          <Text className="form-label">提现方式</Text>
          <RadioGroup onChange={(e) => setWithdrawalMethod(e.detail.value as any)}>
            <Label className="radio-item">
              <Radio value="wechat" checked={withdrawalMethod === 'wechat'} />
              <Text className="radio-label">微信</Text>
            </Label>
            <Label className="radio-item">
              <Radio value="alipay" checked={withdrawalMethod === 'alipay'} />
              <Text className="radio-label">支付宝</Text>
            </Label>
          </RadioGroup>
        </View>

        {/* 真实姓名 */}
        <View className="form-item">
          <Text className="form-label">真实姓名</Text>
          <Input
            className="form-input"
            placeholder="请输入真实姓名"
            value={accountName}
            onInput={(e) => setAccountName(e.detail.value)}
          />
        </View>

        {/* 账号 */}
        <View className="form-item">
          <Text className="form-label">
            {withdrawalMethod === 'wechat' ? '微信账号' : '支付宝账号'}
          </Text>
          <Input
            className="form-input"
            placeholder={`请输入${withdrawalMethod === 'wechat' ? '微信' : '支付宝'}账号`}
            value={accountNumber}
            onInput={(e) => setAccountNumber(e.detail.value)}
          />
        </View>
      </View>

      {/* 提现说明 */}
      <View className="tips-section">
        <Text className="tips-title">提现说明</Text>
        <Text className="tips-item">• 最低提现金额为10元</Text>
        <Text className="tips-item">• 提现申请提交后，1-3个工作日到账</Text>
        <Text className="tips-item">• 请确保账号信息准确，否则可能导致提现失败</Text>
        <Text className="tips-item">• 提现手续费由平台承担</Text>
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <Button className="submit-btn" onClick={handleSubmit} loading={loading}>
          提交申请
        </Button>
      </View>
    </View>
  );
}
