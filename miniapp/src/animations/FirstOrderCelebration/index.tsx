import React, { useEffect, useState } from 'react';
import { View } from '@tarojs/components';
import { useNumberAnimation } from '../../hooks/useAnimation';
import './index.scss';

interface FirstOrderCelebrationProps {
  amount: number;
  onComplete: () => void;
  visible: boolean;
}

/**
 * 首单完成庆祝动画
 *
 * 动画序列：
 * 1. 信封裂开 (0.5s)
 * 2. 撒花爆炸 (1s)
 * 3. 金额翻滚 (0.8s)
 * 4. 按钮出现 (0.3s)
 *
 * 总时长：约2.6秒
 */
const FirstOrderCelebration: React.FC<FirstOrderCelebrationProps> = ({
  amount,
  onComplete,
  visible,
}) => {
  const [step, setStep] = useState<'idle' | 'envelope' | 'confetti' | 'amount' | 'button'>('idle');
  const { current: animatedAmount } = useNumberAnimation(step === 'amount' ? amount : 0, 800);

  useEffect(() => {
    if (!visible) return;

    const sequence = async () => {
      // Step 1: 信封出现并裂开
      setStep('envelope');
      await wait(500);

      // Step 2: 撒花
      setStep('confetti');
      await wait(1000);

      // Step 3: 金额翻滚
      setStep('amount');
      await wait(800);

      // Step 4: 按钮出现
      setStep('button');
      await wait(300);

      // 完成
      setTimeout(onComplete, 500);
    };

    sequence();
  }, [visible, amount, onComplete]);

  if (!visible) return null;

  return (
    <View className="first-order-celebration">
      {/* 遮罩 */}
      <View className="celebration-backdrop" />

      {/* 内容区 */}
      <View className="celebration-content">
        {/* 信封 */}
        {step === 'envelope' && (
          <View className="envelope-container">
            <View className="envelope">
              <View className="envelope-top" />
              <View className="envelope-body" />
            </View>
          </View>
        )}

        {/* 撒花特效 */}
        {(step === 'confetti' || step === 'amount' || step === 'button') && (
          <View className="confetti-container">
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={i}
                className={`confetti confetti-${i}`}
                style={{
                  '--delay': `${i * 0.05}s`,
                  '--rotation': `${Math.random() * 720}deg`,
                  '--x': `${(Math.random() - 0.5) * 200}px`,
                  '--y': `${Math.random() * 300 + 100}px`,
                } as any}
              />
            ))}
          </View>
        )}

        {/* 金额显示 */}
        {(step === 'amount' || step === 'button') && (
          <View className="amount-container">
            <View className="amount-label">你的第一笔收入</View>
            <View className="amount-value">
              ¥{animatedAmount.toFixed(2)}
            </View>
            <View className="amount-subtitle">24小时已到账</View>
          </View>
        )}

        {/* 按钮 */}
        {step === 'button' && (
          <View className="button-container">
            <View className="celebration-button" onClick={onComplete}>
              查看成长报告
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// 辅助函数
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default FirstOrderCelebration;
