'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'student' | 'company'>('student');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'company') {
      setUserType('company');
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    try {
      setError('');
      await api.post('/auth/send-code', { phone, type: 'login' });
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { phone, code });
      const { accessToken, refreshToken, profileCompleted, userType: returnedUserType } = response.data.data;

      // 保存token
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // 根据资料完善状态跳转
      if (!profileCompleted) {
        router.push('/auth/complete-profile');
      } else {
        // 跳转到对应的首页
        if (returnedUserType === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/company/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败');
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
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '8px',
          color: '#1a202c'
        }}>
          {userType === 'student' ? '学生登录' : '企业登录'}
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#718096',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          使用手机验证码登录
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2d3748'
            }}>
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2d3748'
            }}>
              验证码
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                style={{
                  padding: '12px 20px',
                  background: countdown > 0 ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (countdown === 0) e.currentTarget.style.background = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  if (countdown === 0) e.currentTarget.style.background = '#667eea';
                }}
              >
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </button>
            </div>
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
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#5568d3';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#667eea';
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#718096'
        }}>
          还没有账号？
          <a
            href={`/auth/register?type=${userType}`}
            style={{
              color: '#667eea',
              fontWeight: '500',
              marginLeft: '4px',
              textDecoration: 'none'
            }}
          >
            立即注册
          </a>
        </div>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          <a
            href={`/auth/login?type=${userType === 'student' ? 'company' : 'student'}`}
            style={{
              color: '#667eea',
              textDecoration: 'none'
            }}
          >
            切换到{userType === 'student' ? '企业' : '学生'}登录
          </a>
        </div>
      </div>
    </div>
  );
}
