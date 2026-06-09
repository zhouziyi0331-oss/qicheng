'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'student' | 'company'>('student');

  // 学生表单
  const [studentForm, setStudentForm] = useState({
    nickname: '',
    avatarUrl: '',
    bio: '',
    university: '',
    major: '',
    grade: '',
    city: ''
  });

  // 企业表单
  const [companyForm, setCompanyForm] = useState({
    nickname: '',
    avatarUrl: '',
    bio: '',
    companyName: '',
    contactName: '',
    industry: '',
    companySize: ''
  });

  useEffect(() => {
    // 检查登录状态和用户类型
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await api.get('/auth/profile-status');
        const { profileCompleted, userType: type } = response.data.data;

        setUserType(type);

        if (profileCompleted) {
          // 已完善资料，跳转到首页
          if (type === 'student') {
            router.push('/student/dashboard');
          } else {
            router.push('/company/dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentForm.nickname) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/complete-profile', studentForm);
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyForm.nickname || !companyForm.companyName || !companyForm.contactName) {
      setError('请填写必填项');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/complete-profile', companyForm);
      router.push('/company/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '8px',
          color: '#1a202c'
        }}>
          完善资料
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#718096',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          {userType === 'student' ? '请填写您的个人信息' : '请填写您的企业信息'}
        </p>

        {userType === 'student' ? (
          <form onSubmit={handleStudentSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                昵称 <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input
                type="text"
                value={studentForm.nickname}
                onChange={(e) => setStudentForm({ ...studentForm, nickname: e.target.value })}
                placeholder="请输入昵称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                头像URL
              </label>
              <input
                type="text"
                value={studentForm.avatarUrl}
                onChange={(e) => setStudentForm({ ...studentForm, avatarUrl: e.target.value })}
                placeholder="请输入头像URL"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                个人简介
              </label>
              <textarea
                value={studentForm.bio}
                onChange={(e) => setStudentForm({ ...studentForm, bio: e.target.value })}
                placeholder="请输入个人简介"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                学校
              </label>
              <input
                type="text"
                value={studentForm.university}
                onChange={(e) => setStudentForm({ ...studentForm, university: e.target.value })}
                placeholder="请输入学校名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                  专业
                </label>
                <input
                  type="text"
                  value={studentForm.major}
                  onChange={(e) => setStudentForm({ ...studentForm, major: e.target.value })}
                  placeholder="专业"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                  年级
                </label>
                <input
                  type="text"
                  value={studentForm.grade}
                  onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                  placeholder="年级"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                城市
              </label>
              <input
                type="text"
                value={studentForm.city}
                onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })}
                placeholder="请输入所在城市"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#fed7d7',
                color: '#c53030',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#cbd5e0' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '提交中...' : '完成'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompanySubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                昵称 <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input
                type="text"
                value={companyForm.nickname}
                onChange={(e) => setCompanyForm({ ...companyForm, nickname: e.target.value })}
                placeholder="请输入昵称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                企业名称 <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input
                type="text"
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                placeholder="请输入企业名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                联系人姓名 <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <input
                type="text"
                value={companyForm.contactName}
                onChange={(e) => setCompanyForm({ ...companyForm, contactName: e.target.value })}
                placeholder="请输入联系人姓名"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                  行业
                </label>
                <input
                  type="text"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  placeholder="行业"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                  规模
                </label>
                <input
                  type="text"
                  value={companyForm.companySize}
                  onChange={(e) => setCompanyForm({ ...companyForm, companySize: e.target.value })}
                  placeholder="规模"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                企业简介
              </label>
              <textarea
                value={companyForm.bio}
                onChange={(e) => setCompanyForm({ ...companyForm, bio: e.target.value })}
                placeholder="请输入企业简介"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#fed7d7',
                color: '#c53030',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#cbd5e0' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '提交中...' : '完成'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
