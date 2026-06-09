import Taro from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { useNumberAnimation, useAnimationSequence } from '../../hooks/useAnimation';
import FirstOrderCelebration from '../../animations/FirstOrderCelebration';
import AIWaitingScreen from '../../animations/AIWaitingScreen';
import './index.scss';

interface AccountInfo {
  totalBalance: number;
  frozenBalance: number;
  availableBalance: number;
  pendingSettlement: number;
  totalIncome: number;
  totalWithdrawal: number;
}

interface TransactionLog {
  id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function Wallet() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 动画状态
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAmount, setCelebrationAmount] = useState(0);
  const [isFirstIncome, setIsFirstIncome] = useState(false);

  // 数字动画
  const availableBalance = useNumberAnimation(account?.availableBalance || 0, 1000);
  const totalIncome = useNumberAnimation(account?.totalIncome || 0, 1000);
  const totalWithdrawal = useNumberAnimation(account?.totalWithdrawal || 0, 1000);
  const pendingSettlement = useNumberAnimation(account?.pendingSettlement || 0, 1000);
  const frozenBalance = useNumberAnimation(account?.frozenBalance || 0, 1000);

  // 4步揭晓动画
  const { currentStep, startSequence } = useAnimationSequence([
    { duration: 500 },  // Step 1: 卡片弹出
    { duration: 300 },  // Step 2: 金额翻滚
    { duration: 400 },  // Step 3: 统计卡片入场
    { duration: 300 },  // Step 4: 交易列表渐显
  ]);

  useEffect(() => {
    loadAccountInfo();
    loadTransactions();
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
        const accountData = res.data.data;
        setAccount(accountData);

        // 检查是否首单到账（累计收入 > 0 但之前没显示过庆祝）
        const hasShownCelebration = Taro.getStorageSync('wallet_first_celebration_shown');
        if (accountData.totalIncome > 0 && !hasShownCelebration) {
          setIsFirstIncome(true);
          setCelebrationAmount(accountData.totalIncome);
          setShowCelebration(true);
          Taro.setStorageSync('wallet_first_celebration_shown', true);
        } else {
          // 正常加载动画
          startSequence();
        }
      }
    } catch (error) {
      console.error('加载账户信息失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/escrow/transactions',
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error) {
      console.error('加载交易流水失败:', error);
    }
  };

  const handleWithdraw = () => {
    if (!account || account.availableBalance < 10) {
      Taro.showToast({
        title: '可提现余额不足10元',
        icon: 'none',
      });
      return;
    }

    Taro.navigateTo({
      url: '/pages/wallet/withdraw/index',
    });
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    startSequence();
  };

  const getTransactionTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      payment: '企业支付',
      escrow: '进入托管',
      settlement: '进入待结算',
      release: '释放到可提现',
      withdrawal: '提现',
      refund: '退款',
      platform_fee: '平台费用',
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <View className="wallet-page">
        <AIWaitingScreen
          title="加载账户信息"
          subtitle="正在获取您的钱包数据..."
        />
      </View>
    );
  }

  // 首单庆祝动画
  if (showCelebration && isFirstIncome) {
    return (
      <View className="wallet-page">
        <FirstOrderCelebration
          amount={celebrationAmount}
          onComplete={handleCelebrationComplete}
        />
      </View>
    );
  }

  return (
    <View className="wallet-page">
      {/* 账户余额卡片 - Step 1 弹出 */}
      <View className={`balance-card ${currentStep >= 1 ? 'card-show' : ''}`}>
        <View className="balance-header">
          <Text className="balance-title">我的钱包</Text>
        </View>

        <View className="balance-main">
          <Text className="balance-label">可提现余额（元）</Text>
          <Text className="balance-amount">
            {availableBalance.toFixed(2)}
          </Text>
        </View>

        <View className={`balance-details ${currentStep >= 2 ? 'details-show' : ''}`}>
          <View className="balance-item">
            <Text className="item-label">待结算</Text>
            <Text className="item-value">
              ¥{pendingSettlement.toFixed(2)}
            </Text>
          </View>
          <View className="balance-item">
            <Text className="item-label">冻结中</Text>
            <Text className="item-value">
              ¥{frozenBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        <Button className="withdraw-btn" onClick={handleWithdraw}>
          提现
        </Button>
      </View>

      {/* 统计卡片 - Step 3 入场 */}
      <View className={`stats-card ${currentStep >= 3 ? 'stats-show' : ''}`}>
        <View className="stats-item">
          <Text className="stats-label">累计收入</Text>
          <Text className="stats-value">
            ¥{totalIncome.toFixed(2)}
          </Text>
        </View>
        <View className="stats-divider" />
        <View className="stats-item">
          <Text className="stats-label">累计提现</Text>
          <Text className="stats-value">
            ¥{totalWithdrawal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* 交易流水 - Step 4 渐显 */}
      <View className={`transactions-section ${currentStep >= 4 ? 'section-show' : ''}`}>
        <View className="section-header">
          <Text className="section-title">交易流水</Text>
        </View>

        {transactions.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">💰</Text>
            <Text className="empty-text">暂无交易记录</Text>
          </View>
        ) : (
          <View className="transactions-list">
            {transactions.map((transaction, index) => (
              <View
                key={transaction.id}
                className="transaction-item"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <View className="transaction-left">
                  <Text className="transaction-type">
                    {getTransactionTypeText(transaction.transaction_type)}
                  </Text>
                  <Text className="transaction-desc">{transaction.description}</Text>
                  <Text className="transaction-time">
                    {formatDate(transaction.created_at)}
                  </Text>
                </View>
                <View className="transaction-right">
                  <Text
                    className={`transaction-amount ${
                      transaction.transaction_type === 'withdrawal' ||
                      transaction.transaction_type === 'platform_fee'
                        ? 'negative'
                        : 'positive'
                    }`}
                  >
                    {transaction.transaction_type === 'withdrawal' ||
                    transaction.transaction_type === 'platform_fee'
                      ? '-'
                      : '+'}
                    ¥{Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 提现说明 */}
      <View className={`tips-section ${currentStep >= 4 ? 'section-show' : ''}`}>
        <Text className="tips-title">提现说明</Text>
        <Text className="tips-item">• 最低提现金额为10元</Text>
        <Text className="tips-item">• 任务完成后资金进入待结算，7天后自动转为可提现</Text>
        <Text className="tips-item">• 提现申请提交后，1-3个工作日到账</Text>
        <Text className="tips-item">• 支持微信和支付宝提现</Text>
      </View>
    </View>
  );
}
