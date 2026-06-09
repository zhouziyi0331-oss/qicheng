import { View, Text, ScrollView, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface ReportPreview {
  id: string;
  preview_content: string;
  table_of_contents: string[];
  is_paid: boolean;
  created_at: string;
}

interface FullReport {
  chapters: Array<{
    chapter_number: number;
    chapter_title: string;
    content: string;
    word_count: number;
  }>;
  total_word_count: number;
}

export default function GraduationReport() {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [fullReport, setFullReport] = useState<FullReport | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadReportPreview();
  }, []);

  const loadReportPreview = async () => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/growth/graduation-report/preview',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setPreview(res.data.data);

        // 如果已付费，加载完整报告
        if (res.data.data.is_paid) {
          loadFullReport(res.data.data.id);
        }
      } else {
        Taro.showToast({ title: res.data.message || '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载报告预览失败:', error);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const loadFullReport = async (reportId: string) => {
    try {
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/growth/graduation-report/${reportId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setFullReport(res.data.data);
      }
    } catch (error) {
      console.error('加载完整报告失败:', error);
    }
  };

  const handlePay = async () => {
    if (!preview) return;

    Taro.showModal({
      title: '解锁毕业报告',
      content: '解锁费用¥299，一次性付费，永久可查看和下载。确认支付？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          setPaying(true);
          try {
            // 模拟支付
            const paymentRes = await mockPayment(299);

            // 提交付费记录
            const res = await Taro.request({
              url: `http://localhost:3000/api/v1/growth/graduation-report/${preview.id}/pay`,
              method: 'POST',
              header: {
                'Authorization': `Bearer ${Taro.getStorageSync('token')}`
              },
              data: {
                paymentMethod: 'wechat',
                transactionId: paymentRes.transactionId,
                pointsUsed: 0
              }
            });

            if (res.data.success) {
              Taro.showToast({ title: '支付成功！', icon: 'success' });
              // 重新加载报告
              setTimeout(() => {
                loadReportPreview();
              }, 1500);
            } else {
              Taro.showToast({ title: res.data.message || '支付失败', icon: 'none' });
            }
          } catch (error) {
            console.error('支付失败:', error);
            Taro.showToast({ title: '支付失败', icon: 'none' });
          } finally {
            setPaying(false);
          }
        }
      }
    });
  };

  const mockPayment = (amount: number): Promise<{ transactionId: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ transactionId: `TX${Date.now()}` });
      }, 1000);
    });
  };

  const handleDownloadPDF = () => {
    Taro.showToast({ title: 'PDF下载功能开发中', icon: 'none' });
  };

  if (loading) {
    return (
      <View className="graduation-report-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!preview) {
    return (
      <View className="graduation-report-page">
        <View className="empty-state">
          <Text className="empty-icon">📄</Text>
          <Text className="empty-text">尚未生成毕业报告</Text>
          <Text className="empty-hint">达到Lv.6后会自动生成</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="graduation-report-page" scrollY>
      {/* 页面标题 */}
      <View className="page-header">
        <Text className="page-title">🎓 毕业报告</Text>
        <Text className="page-subtitle">你的万字成长报告</Text>
      </View>

      {/* 报告状态卡片 */}
      <View className="status-card">
        <View className="status-icon">
          {preview.is_paid ? '✅' : '🔒'}
        </View>
        <View className="status-info">
          <Text className="status-title">
            {preview.is_paid ? '已解锁' : '待解锁'}
          </Text>
          <Text className="status-desc">
            {preview.is_paid
              ? '你可以查看完整报告并下载PDF'
              : '解锁后可永久查看和下载'}
          </Text>
        </View>
        {preview.is_paid && (
          <Button className="download-btn" onClick={handleDownloadPDF}>
            下载PDF
          </Button>
        )}
      </View>

      {/* 报告目录 */}
      <View className="toc-card">
        <Text className="card-title">📑 报告目录</Text>
        <View className="toc-list">
          {preview.table_of_contents.map((chapter, index) => (
            <View key={index} className="toc-item">
              <Text className="toc-text">{chapter}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 预览内容 */}
      {!preview.is_paid && (
        <View className="preview-card">
          <Text className="card-title">👀 预览内容</Text>
          <Text className="preview-text">{preview.preview_content}</Text>
          <View className="preview-mask">
            <Text className="mask-text">解锁查看完整内容</Text>
          </View>
        </View>
      )}

      {/* 完整报告内容 */}
      {preview.is_paid && fullReport && (
        <View className="full-report">
          {fullReport.chapters.map((chapter) => (
            <View key={chapter.chapter_number} className="chapter-card">
              <Text className="chapter-title">
                第{chapter.chapter_number}章：{chapter.chapter_title}
              </Text>
              <Text className="chapter-content">{chapter.content}</Text>
              <Text className="word-count">
                字数：{chapter.word_count}
              </Text>
            </View>
          ))}

          {/* 总字数 */}
          <View className="report-footer">
            <Text className="total-words">
              总字数：{fullReport.total_word_count}
            </Text>
          </View>
        </View>
      )}

      {/* 解锁按钮 */}
      {!preview.is_paid && (
        <View className="unlock-section">
          <View className="price-card">
            <Text className="price-label">解锁价格</Text>
            <Text className="price-value">¥299</Text>
            <Text className="price-hint">一次性付费，永久可查看</Text>
          </View>

          <View className="benefits-card">
            <Text className="benefits-title">解锁后你将获得：</Text>
            <View className="benefits-list">
              <Text className="benefit-item">✅ 完整六章万字报告</Text>
              <Text className="benefit-item">✅ 永久查看权限</Text>
              <Text className="benefit-item">✅ PDF下载</Text>
              <Text className="benefit-item">✅ 免费更新（每完成3个新项目）</Text>
            </View>
          </View>

          <Button
            className="unlock-btn"
            onClick={handlePay}
            loading={paying}
          >
            解锁完整报告
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
