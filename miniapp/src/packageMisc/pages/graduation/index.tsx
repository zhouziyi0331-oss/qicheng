import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../../services/api';
import './index.scss';

interface Eligibility {
  eligible: boolean;
  reason?: string;
  track?: string;
  tasksCompleted?: number;
  totalEarnings?: number;
}

interface Benefits {
  opc_report_unlocked: boolean;
  company_contact_unlocked: boolean;
  certification_issued: boolean;
  investment_resources_unlocked: boolean;
  mentor_network_unlocked: boolean;
  priority_tasks_unlocked: boolean;
  certification_number?: string;
  issued_at?: string;
}

export default function Graduation() {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [benefits, setBenefits] = useState<Benefits | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eligibilityRes, benefitsRes] = await Promise.all([
        api.challengeGraduation.checkEligibility(),
        api.challengeGraduation.getGraduateBenefits()
      ]);

      if (eligibilityRes.success) {
        setEligibility(eligibilityRes.data);
      }

      if (benefitsRes.success) {
        setBenefits(benefitsRes.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!eligibility?.eligible) {
      Taro.showToast({ title: eligibility?.reason || '不满足毕业条件', icon: 'none' });
      return;
    }

    Taro.navigateTo({
      url: '/pages/graduation-apply/index'
    });
  };

  const renderBenefitItem = (unlocked: boolean, title: string, desc: string) => (
    <View className={`benefit-item ${unlocked ? 'unlocked' : 'locked'}`}>
      <View className="benefit-icon">{unlocked ? '✓' : '○'}</View>
      <View className="benefit-content">
        <Text className="benefit-title">{title}</Text>
        <Text className="benefit-desc">{desc}</Text>
      </View>
    </View>
  );

  return (
    <View className="graduation">
      {/* Header */}
      <View className="header">
        <Text className="title">毕业系统</Text>
        <Text className="subtitle">达到Lv.4，解锁全部权益</Text>
      </View>

      <ScrollView className="content" scrollY>
        {loading ? (
          <View className="loading">加载中...</View>
        ) : (
          <>
            {/* 毕业资格 */}
            <View className="section">
              <Text className="section-title">毕业资格</Text>
              <View className={`eligibility-card ${eligibility?.eligible ? 'eligible' : 'not-eligible'}`}>
                {eligibility?.eligible ? (
                  <>
                    <View className="status-icon">◆</View>
                    <Text className="status-text">恭喜！您已满足毕业条件</Text>
                    <View className="stats">
                      <View className="stat-item">
                        <Text className="stat-label">赛道</Text>
                        <Text className="stat-value">
                          {eligibility.track === 'content' ? 'AI内容创作' : 'AI工具开发'}
                        </Text>
                      </View>
                      <View className="stat-item">
                        <Text className="stat-label">完成任务</Text>
                        <Text className="stat-value">{eligibility.tasksCompleted}个</Text>
                      </View>
                      <View className="stat-item">
                        <Text className="stat-label">累计收入</Text>
                        <Text className="stat-value">¥{eligibility.totalEarnings?.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Button className="apply-btn" onClick={handleApply}>
                      申请毕业
                    </Button>
                  </>
                ) : (
                  <>
                    <View className="status-icon">●</View>
                    <Text className="status-text">继续努力</Text>
                    <Text className="reason">{eligibility?.reason}</Text>
                  </>
                )}
              </View>
            </View>

            {/* 毕业生权益 */}
            <View className="section">
              <Text className="section-title">毕业生权益</Text>
              <View className="benefits-card">
                {benefits ? (
                  <>
                    {renderBenefitItem(
                      benefits.opc_report_unlocked,
                      'OPC完整报告',
                      '解锁完整的能力评估和成长报告'
                    )}
                    {renderBenefitItem(
                      benefits.company_contact_unlocked,
                      '企业联系方式',
                      '直接获取企业联系方式，无需中转'
                    )}
                    {renderBenefitItem(
                      benefits.certification_issued,
                      '认证标识',
                      '获得平台认证标识和证书'
                    )}
                    {renderBenefitItem(
                      benefits.investment_resources_unlocked,
                      '创投资源',
                      '对接天使投资人和孵化器资源'
                    )}
                    {renderBenefitItem(
                      benefits.mentor_network_unlocked,
                      '导师网络',
                      '加入导师网络，获得长期指导'
                    )}
                    {renderBenefitItem(
                      benefits.priority_tasks_unlocked,
                      '优先任务推送',
                      '优先获得高质量任务推荐'
                    )}

                    {benefits.certification_number && (
                      <View className="certification">
                        <Text className="cert-label">认证编号</Text>
                        <Text className="cert-number">{benefits.certification_number}</Text>
                        <Text className="cert-date">
                          颁发时间: {new Date(benefits.issued_at!).toLocaleDateString('zh-CN')}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {renderBenefitItem(false, 'OPC完整报告', '解锁完整的能力评估和成长报告')}
                    {renderBenefitItem(false, '企业联系方式', '直接获取企业联系方式，无需中转')}
                    {renderBenefitItem(false, '认证标识', '获得平台认证标识和证书')}
                    {renderBenefitItem(false, '创投资源', '对接天使投资人和孵化器资源')}
                    {renderBenefitItem(false, '导师网络', '加入导师网络，获得长期指导')}
                    {renderBenefitItem(false, '优先任务推送', '优先获得高质量任务推荐')}
                  </>
                )}
              </View>
            </View>

            {/* 毕业要求说明 */}
            <View className="section">
              <Text className="section-title">毕业要求</Text>
              <View className="requirements-card">
                <View className="req-item">
                  <Text className="req-icon">1️⃣</Text>
                  <Text className="req-text">达到Lv.4等级</Text>
                </View>
                <View className="req-item">
                  <Text className="req-icon">2️⃣</Text>
                  <Text className="req-text">完成至少10个任务</Text>
                </View>
                <View className="req-item">
                  <Text className="req-icon">3️⃣</Text>
                  <Text className="req-text">累计收入达到5000元</Text>
                </View>
                <View className="req-item">
                  <Text className="req-icon">4️⃣</Text>
                  <Text className="req-text">提交作品集和职业规划</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
