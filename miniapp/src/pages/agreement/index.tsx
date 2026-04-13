import { View, Text, Button, ScrollView, Checkbox } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import './index.scss';

interface Agreement {
  id: number;
  agreement_type: string;
  version: string;
  title: string;
  content: string;
}

export default function AgreementPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreements, setSelectedAgreements] = useState<number[]>([]);
  const [mandatoryTerms, setMandatoryTerms] = useState({
    age_confirmation: false,
    real_name_commitment: false,
    data_usage_notice: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    try {
      const res = await api.agreement.getActiveAgreements();
      if (res.success) {
        setAgreements(res.data);
      }
    } catch (error) {
      console.error('加载协议失败:', error);
    }
  };

  const handleAgreementCheck = (agreementId: number) => {
    setSelectedAgreements(prev => {
      if (prev.includes(agreementId)) {
        return prev.filter(id => id !== agreementId);
      } else {
        return [...prev, agreementId];
      }
    });
  };

  const handleTermCheck = (termType: string) => {
    setMandatoryTerms(prev => ({
      ...prev,
      [termType]: !prev[termType]
    }));
  };

  const handleViewAgreement = (agreement: Agreement) => {
    Taro.showModal({
      title: agreement.title,
      content: agreement.content,
      showCancel: false,
      confirmText: '我已阅读'
    });
  };

  const handleSubmit = async () => {
    // 检查是否全部勾选
    if (selectedAgreements.length !== agreements.length) {
      Taro.showToast({ title: '请阅读并同意所有协议', icon: 'none' });
      return;
    }

    if (!mandatoryTerms.age_confirmation || !mandatoryTerms.real_name_commitment || !mandatoryTerms.data_usage_notice) {
      Taro.showToast({ title: '请确认所有必读条款', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      // 签署所有协议
      for (const agreementId of selectedAgreements) {
        await api.agreement.signAgreement(agreementId);
      }

      // 确认所有必读条款
      await api.agreement.confirmTerm('age_confirmation');
      await api.agreement.confirmTerm('real_name_commitment');
      await api.agreement.confirmTerm('data_usage_notice');

      Taro.showToast({ title: '协议签署成功', icon: 'success' });

      // 跳转到下一步（根据实际流程调整）
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' });
      }, 1500);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '签署失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const getAgreementTypeText = (type: string) => {
    const typeMap = {
      service_terms: '服务协议',
      privacy_policy: '隐私政策',
      data_authorization: '数据授权协议'
    };
    return typeMap[type] || type;
  };

  return (
    <View className="agreement-page">
      <View className="header">
        <Text className="title">用户协议</Text>
        <Text className="subtitle">请仔细阅读并同意以下协议</Text>
      </View>

      <ScrollView className="content" scrollY>
        {/* 协议列表 */}
        <View className="section">
          <Text className="section-title">服务协议</Text>
          {agreements.map(agreement => (
            <View key={agreement.id} className="agreement-item">
              <Checkbox
                checked={selectedAgreements.includes(agreement.id)}
                onClick={() => handleAgreementCheck(agreement.id)}
              />
              <View className="agreement-info" onClick={() => handleViewAgreement(agreement)}>
                <Text className="agreement-title">
                  {getAgreementTypeText(agreement.agreement_type)}
                </Text>
                <Text className="agreement-version">v{agreement.version}</Text>
              </View>
              <Text className="view-btn" onClick={() => handleViewAgreement(agreement)}>
                查看
              </Text>
            </View>
          ))}
        </View>

        {/* 必读条款 */}
        <View className="section">
          <Text className="section-title">必读条款</Text>

          <View className="term-item">
            <Checkbox
              checked={mandatoryTerms.age_confirmation}
              onClick={() => handleTermCheck('age_confirmation')}
            />
            <Text className="term-text">
              我确认本人已年满18周岁，具有完全民事行为能力
            </Text>
          </View>

          <View className="term-item">
            <Checkbox
              checked={mandatoryTerms.real_name_commitment}
              onClick={() => handleTermCheck('real_name_commitment')}
            />
            <Text className="term-text">
              我承诺提供的个人信息真实有效，并对信息的真实性负责
            </Text>
          </View>

          <View className="term-item">
            <Checkbox
              checked={mandatoryTerms.data_usage_notice}
              onClick={() => handleTermCheck('data_usage_notice')}
            />
            <Text className="term-text">
              我已知晓平台将收集和使用我的个人信息用于提供服务
            </Text>
          </View>
        </View>

        {/* 重要提示 */}
        <View className="notice">
          <Text className="notice-title">重要提示</Text>
          <Text className="notice-text">
            1. 请仔细阅读所有协议内容，特别是免责条款和争议解决条款
          </Text>
          <Text className="notice-text">
            2. 您的数据将被严格保护，不会在未经授权的情况下共享给第三方
          </Text>
          <Text className="notice-text">
            3. 您可以随时在设置中修改数据授权选项
          </Text>
          <Text className="notice-text">
            4. 如有疑问，请联系客服：support@qicheng.com
          </Text>
        </View>
      </ScrollView>

      <View className="footer">
        <Button
          className="submit-btn"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        >
          同意并继续
        </Button>
      </View>
    </View>
  );
}
