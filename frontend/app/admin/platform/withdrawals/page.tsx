'use client';

import { useEffect, useState } from 'react';
import { withdrawalAdminApi } from '@/lib/platformAdminApi';

interface Withdrawal {
  id: string;
  user_id: string;
  user_name: string;
  user_type: string;
  amount: number;
  fee: number;
  actual_amount: number;
  account_type: string;
  account_info: any;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  reject_reason?: string;
}

interface WithdrawalStats {
  pending_count: number;
  pending_amount: number;
  today_completed: number;
  today_amount: number;
}

export default function WithdrawalAuditPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        withdrawalAdminApi.list({ status: filter === 'pending' ? 'pending' : undefined }),
        withdrawalAdminApi.getStats(),
      ]);

      setWithdrawals(listRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const note = prompt('审核通过备注（可选）：');

    try {
      await withdrawalAdminApi.approve(id, note || undefined);
      alert('审核通过');
      fetchData();
    } catch (err: any) {
      console.error('Failed to approve:', err);
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (!reason) return;

    try {
      await withdrawalAdminApi.reject(id, reason);
      alert('已拒绝');
      fetchData();
    } catch (err: any) {
      console.error('Failed to reject:', err);
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待审核',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#fb8500',
      processing: '#1f6feb',
      completed: '#238636',
      rejected: '#f85149',
    };
    return colors[status] || '#6e7681';
  };

  return (
    <div className="min-h-screen py-8" style={{ background: '#0d1117' }}>
      <div className="container max-w-7xl mx-auto px-4">
        {/* 头部 */}
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#e6edf3' }}>提现审核</h1>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="text-sm mb-2" style={{ color: '#8b949e' }}>待审核数量</div>
              <div className="text-3xl font-bold" style={{ color: '#fb8500' }}>
                {stats.pending_count}
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="text-sm mb-2" style={{ color: '#8b949e' }}>待审核金额</div>
              <div className="text-3xl font-bold" style={{ color: '#fb8500' }}>
                ¥{stats.pending_amount.toFixed(2)}
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="text-sm mb-2" style={{ color: '#8b949e' }}>今日已完成</div>
              <div className="text-3xl font-bold" style={{ color: '#238636' }}>
                {stats.today_completed}
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="text-sm mb-2" style={{ color: '#8b949e' }}>今日金额</div>
              <div className="text-3xl font-bold" style={{ color: '#238636' }}>
                ¥{stats.today_amount.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* 筛选 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              background: filter === 'pending' ? '#58a6ff' : '#21262d',
              color: filter === 'pending' ? '#ffffff' : '#8b949e',
              border: `1px solid ${filter === 'pending' ? '#58a6ff' : '#30363d'}`,
            }}
          >
            待审核
          </button>
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              background: filter === 'all' ? '#58a6ff' : '#21262d',
              color: filter === 'all' ? '#ffffff' : '#8b949e',
              border: `1px solid ${filter === 'all' ? '#58a6ff' : '#30363d'}`,
            }}
          >
            全部
          </button>
        </div>

        {/* 提现列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#58a6ff', borderTopColor: 'transparent' }} />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <p style={{ color: '#8b949e' }}>暂无提现申请</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((wd) => (
              <div
                key={wd.id}
                className="rounded-xl p-6"
                style={{ background: '#161b22', border: '1px solid #30363d' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold" style={{ color: '#e6edf3' }}>
                        {wd.user_name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: '#21262d', color: '#8b949e' }}>
                        {wd.user_type === 'student' ? '学生' : '企业'}
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: '#8b949e' }}>
                      用户ID: {wd.user_id}
                    </div>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded"
                    style={{ background: getStatusColor(wd.status), color: '#ffffff' }}
                  >
                    {getStatusLabel(wd.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#8b949e' }}>申请金额</div>
                    <div className="font-semibold" style={{ color: '#e6edf3' }}>¥{wd.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#8b949e' }}>手续费</div>
                    <div className="font-semibold" style={{ color: '#e6edf3' }}>¥{wd.fee.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#8b949e' }}>实际到账</div>
                    <div className="font-semibold" style={{ color: '#238636' }}>¥{wd.actual_amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#8b949e' }}>收款方式</div>
                    <div className="font-semibold" style={{ color: '#e6edf3' }}>
                      {wd.account_type === 'alipay' ? '支付宝' : wd.account_type === 'wechat' ? '微信' : '银行卡'}
                    </div>
                  </div>
                </div>

                {wd.account_info && (
                  <div className="p-3 rounded-lg mb-4" style={{ background: '#21262d' }}>
                    <div className="text-xs mb-1" style={{ color: '#8b949e' }}>收款账号</div>
                    <div className="text-sm font-mono" style={{ color: '#e6edf3' }}>
                      {wd.account_info.account || JSON.stringify(wd.account_info)}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #30363d' }}>
                  <div className="text-xs" style={{ color: '#484f58' }}>
                    申请时间：{formatDate(wd.created_at)}
                  </div>

                  {wd.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(wd.id)}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={{ background: '#21262d', border: '1px solid #30363d', color: '#f85149' }}
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => handleApprove(wd.id)}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={{ background: '#238636', color: '#ffffff' }}
                      >
                        通过
                      </button>
                    </div>
                  )}

                  {wd.status === 'rejected' && wd.reject_reason && (
                    <div className="text-sm" style={{ color: '#f85149' }}>
                      拒绝原因：{wd.reject_reason}
                    </div>
                  )}

                  {wd.status === 'completed' && wd.processed_at && (
                    <div className="text-xs" style={{ color: '#238636' }}>
                      完成时间：{formatDate(wd.processed_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
