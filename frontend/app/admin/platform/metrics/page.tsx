'use client';

import { useEffect, useState } from 'react';
import { platformMetricsApi } from '@/lib/platformAdminApi';

interface MetricsOverview {
  total_users: number;
  active_users: number;
  total_tasks: number;
  active_tasks: number;
  total_revenue: number;
  platform_revenue: number;
  completion_rate: number;
  avg_rating: number;
}

interface RiskMetrics {
  high_risk_tasks: number;
  disputed_tasks: number;
  flagged_users: number;
  pending_reports: number;
}

export default function PlatformMetricsPage() {
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [risks, setRisks] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, risksRes] = await Promise.all([
        platformMetricsApi.getOverview(),
        platformMetricsApi.getRiskMetrics(),
      ]);

      setOverview(overviewRes.data.data);
      setRisks(risksRes.data.data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#58a6ff', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ background: '#0d1117' }}>
      <div className="container max-w-7xl mx-auto px-4">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#e6edf3' }}>平台数据看板</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}
          >
            🔄 刷新
          </button>
        </div>

        {/* 核心指标 */}
        {overview && (
          <>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#e6edf3' }}>核心指标</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👥</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>总用户数</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#e6edf3' }}>
                  {overview.total_users.toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: '#8b949e' }}>
                  活跃: {overview.active_users.toLocaleString()}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📋</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>总任务数</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#e6edf3' }}>
                  {overview.total_tasks.toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: '#8b949e' }}>
                  进行中: {overview.active_tasks.toLocaleString()}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>总交易额</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#238636' }}>
                  ¥{overview.total_revenue.toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: '#8b949e' }}>
                  平台收入: ¥{overview.platform_revenue.toLocaleString()}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⭐</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>平均评分</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#fb8500' }}>
                  {overview.avg_rating.toFixed(1)}
                </div>
                <div className="text-xs mt-1" style={{ color: '#8b949e' }}>
                  完成率: {(overview.completion_rate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </>
        )}

        {/* 风险预警 */}
        {risks && (
          <>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#e6edf3' }}>风险预警</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #f85149' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>高风险任务</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#f85149' }}>
                  {risks.high_risk_tasks}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #fb8500' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔥</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>争议任务</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#fb8500' }}>
                  {risks.disputed_tasks}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #fb8500' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚫</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>标记用户</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#fb8500' }}>
                  {risks.flagged_users}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #1f6feb' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📢</span>
                  <div className="text-sm" style={{ color: '#8b949e' }}>待处理举报</div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#1f6feb' }}>
                  {risks.pending_reports}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 快捷入口 */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#e6edf3' }}>快捷入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/platform/withdrawals"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">💳</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>提现审核</div>
          </a>

          <a
            href="/admin/platform/verifications"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>认证审核</div>
          </a>

          <a
            href="/admin/platform/task-audits"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>任务审核</div>
          </a>

          <a
            href="/admin/platform/ratings"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>评价管理</div>
          </a>

          <a
            href="/admin/platform/config"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>系统配置</div>
          </a>

          <a
            href="/admin/students"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">🎓</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>学生管理</div>
          </a>

          <a
            href="/admin/tasks"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>任务管理</div>
          </a>

          <a
            href="/admin/finance"
            className="p-6 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: '#161b22', border: '1px solid #30363d', textDecoration: 'none' }}
          >
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold" style={{ color: '#e6edf3' }}>财务管理</div>
          </a>
        </div>
      </div>
    </div>
  );
}
