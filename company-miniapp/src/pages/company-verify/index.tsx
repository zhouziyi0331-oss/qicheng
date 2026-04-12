import { View, Text, Input, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface VerificationInfo {
  id: number;
  company_name: string;
  business_license: string;
  legal_person: string;
  credit_code: string;
  status: string;
  reject_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export default function CompanyVerify() {
  const [hasVerification, setHasVerification] = useState(false);
  const [verification, setVerification] = useState<VerificationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 表单数据
  const [companyName, setCompanyName] = useState('');
  const [legalPerson, setLegalPerson] = useState('');
  const [creditCode, setCreditCode] = useState('');
  const [licenseImage, setLicenseImage] = useState('');

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/company/verification',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200 && res.data.data) {
        setHasVerification(true);
        setVerification(res.data.data);
      }
    } catch (error) {
      console.error('加载认证状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];

        Taro.showLoading({ title: '上传中...' });

        try {
          const token = Taro.getStorageSync('token');

          const uploadRes = await Taro.uploadFile({
            url: 'http://localhost:3000/api/v1/upload/image',
            filePath: tempFilePath,
            name: 'file',
            header: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = JSON.parse(uploadRes.data);

          if (data.success) {
            setLicenseImage(data.data.url);
            Taro.showToast({ title: '上传成功', icon: 'success' });
          } else {
            throw new Error(data.message || '上传失败');
          }
        } catch (error: any) {
          console.error('上传失败:', error);
          Taro.showToast({ title: error.message || '上传失败', icon: 'none' });
        } finally {
          Taro.hideLoading();
        }
      }
    });
  };

  const handleSubmit = async () => {
    // 验证
    if (!companyName.trim()) {
      Taro.showToast({ title: '请输入企业名称', icon: 'none' });
      return;
    }

    if (!legalPerson.trim()) {
      Taro.showToast({ title: '请输入法人姓名', icon: 'none' });
      return;
    }

    if (!creditCode.trim()) {
      Taro.showToast({ title: '请输入统一社会信用代码', icon: 'none' });
      return;
    }

    if (!licenseImage) {
      Taro.showToast({ title: '请上传营业执照', icon: 'none' });
      return;
    }

    try {
      setSubmitting(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/company/verification',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          companyName: companyName.trim(),
          legalPerson: legalPerson.trim(),
          creditCode: creditCode.trim(),
          businessLicense: licenseImage
        }
      });

      if (res.statusCode === 200) {
        Taro.showToast({
          title: '提交成功，等待审核',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          loadVerificationStatus();
        }, 2000);
      } else {
        throw new Error(res.data.message || '提交失败');
      }
    } catch (error: any) {
      console.error('提交认证失败:', error);
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '审核中',
      'approved': '已认证',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'pending': 'pending',
      'approved': 'approved',
      'rejected': 'rejected'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="company-verify-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  // 已有认证记录
  if (hasVerification && verification) {
    return (
      <View className="company-verify-page">
        <View className="status-card">
          <View className="status-header">
            <Text className="status-title">认证状态</Text>
            <View className={`status-badge ${getStatusClass(verification.status)}`}>
              <Text className="status-text">{getStatusText(verification.status)}</Text>
            </View>
          </View>

          <View className="info-section">
            <View className="info-row">
              <Text className="info-label">企业名称</Text>
              <Text className="info-value">{verification.company_name}</Text>
            </View>
            <View className="info-row">
              <Text className="info-label">法人姓名</Text>
              <Text className="info-value">{verification.legal_person}</Text>
            </View>
            <View className="info-row">
              <Text className="info-label">信用代码</Text>
              <Text className="info-value">{verification.credit_code}</Text>
            </View>
            <View className="info-row">
              <Text className="info-label">提交时间</Text>
              <Text className="info-value">{formatDate(verification.submitted_at)}</Text>
            </View>
            {verification.reviewed_at && (
              <View className="info-row">
                <Text className="info-label">审核时间</Text>
                <Text className="info-value">{formatDate(verification.reviewed_at)}</Text>
              </View>
            )}
          </View>

          <View className="license-section">
            <Text className="section-label">营业执照</Text>
            <Image
              className="license-image"
              src={verification.business_license}
              mode="aspectFit"
              onClick={() => {
                Taro.previewImage({
                  urls: [verification.business_license],
                  current: verification.business_license
                });
              }}
            />
          </View>

          {verification.status === 'rejected' && verification.reject_reason && (
            <View className="reject-section">
              <Text className="reject-label">拒绝原因</Text>
              <Text className="reject-reason">{verification.reject_reason}</Text>
              <View
                className="resubmit-btn"
                onClick={() => {
                  setHasVerification(false);
                  setCompanyName(verification.company_name);
                  setLegalPerson(verification.legal_person);
                  setCreditCode(verification.credit_code);
                }}
              >
                <Text className="resubmit-text">重新提交</Text>
              </View>
            </View>
          )}

          {verification.status === 'approved' && (
            <View className="success-tip">
              <Text className="tip-icon">✓</Text>
              <Text className="tip-text">您的企业已通过认证</Text>
            </View>
          )}

          {verification.status === 'pending' && (
            <View className="pending-tip">
              <Text className="tip-icon">⏳</Text>
              <Text className="tip-text">认证审核中，请耐心等待</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // 认证表单
  return (
    <View className="company-verify-page">
      <View className="header">
        <Text className="title">企业认证</Text>
        <Text className="subtitle">完成认证后可享受更多权益</Text>
      </View>

      <View className="form-card">
        <View className="form-item">
          <Text className="form-label">企业名称 *</Text>
          <Input
            className="form-input"
            placeholder="请输入企业全称"
            value={companyName}
            onInput={(e) => setCompanyName(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">法人姓名 *</Text>
          <Input
            className="form-input"
            placeholder="请输入法人姓名"
            value={legalPerson}
            onInput={(e) => setLegalPerson(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">统一社会信用代码 *</Text>
          <Input
            className="form-input"
            placeholder="请输入18位信用代码"
            value={creditCode}
            maxlength={18}
            onInput={(e) => setCreditCode(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">营业执照 *</Text>
          {licenseImage ? (
            <View className="image-preview">
              <Image
                className="preview-image"
                src={licenseImage}
                mode="aspectFit"
                onClick={() => {
                  Taro.previewImage({
                    urls: [licenseImage],
                    current: licenseImage
                  });
                }}
              />
              <View className="image-actions">
                <View className="action-btn" onClick={handleChooseImage}>
                  <Text className="action-text">重新上传</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="upload-area" onClick={handleChooseImage}>
              <Text className="upload-icon">📷</Text>
              <Text className="upload-text">点击上传营业执照</Text>
              <Text className="upload-hint">支持JPG、PNG格式</Text>
            </View>
          )}
        </View>
      </View>

      <View className="tips-card">
        <Text className="tips-title">💡 认证说明</Text>
        <Text className="tips-item">• 请确保营业执照清晰可见</Text>
        <Text className="tips-item">• 信息需与营业执照一致</Text>
        <Text className="tips-item">• 审核时间约1-3个工作日</Text>
        <Text className="tips-item">• 认证后可发布更多任务</Text>
      </View>

      <View className="submit-section">
        <View
          className={`submit-btn ${submitting ? 'disabled' : ''}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text className="submit-text">
            {submitting ? '提交中...' : '提交认证'}
          </Text>
        </View>
      </View>
    </View>
  );
}
