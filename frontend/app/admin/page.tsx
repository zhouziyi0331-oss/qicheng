"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

interface Dashboard {
  users: { total: number; students: number; companies: number; today: number };
  tasks: { total: number; active: number; pending_review: number; completed: number };
  finance: { total_gross: number; total_net: number; pending_withdrawals: number; pending_advances: number };
  story: { total_posts: number };
}

export default function AdminPage() {
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const modules = [
    { href: "/admin/tasks", label: "需求管理", desc: "审核、下架企业任务", color: "#FF6B35" },
    { href: "/admin/students", label: "学生数据", desc: "查看学生档案与OPC标签", color: "#4ECDC4" },
    { href: "/admin/support", label: "客服工具", desc: "介入任务、发送通知", color: "#95E1D3" },
    { href: "/admin/finance", label: "财务管理", desc: "审核提现、首单垫付", color: "#FFE66D" },
    { href: "/admin/broadcast", label: "通知推送", desc: "全平台广播消息", color: "#C7CEEA" },
    { href: "/admin/logs", label: "操作日志", desc: "不可删除的管理员记录", color: "#FFDAB9" },
    { href: "/admin/config", label: "系统配置", desc: "超管专属参数调整", color: "#B4A7D6" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F9F7F5" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 顶部标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#2D3436" }}>管理后台</h1>
          <p className="text-sm" style={{ color: "#636E72" }}>启程平台数据中心</p>
        </div>

        {/* 数据概览卡片 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-3xl animate-pulse" style={{ background: "#FFFFFF" }} />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: "总用户", value: stats.users.total, sub: `今日 +${stats.users.today}`, gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
              { label: "活跃任务", value: stats.tasks.active, sub: `待审 ${stats.tasks.pending_review}`, gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
              { label: "待处理提现", value: stats.finance.pending_withdrawals, sub: `垫付 ${stats.finance.pending_advances}`, gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
              { label: "累计流水", value: `¥${stats.finance.total_gross}`, sub: `实得 ¥${stats.finance.total_net}`, gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                style={{ background: "#FFFFFF" }}
              >
                <div className="text-3xl font-bold mb-2" style={{
                  background: s.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>
                  {s.value}
                </div>
                <div className="text-sm font-medium mb-1" style={{ color: "#2D3436" }}>{s.label}</div>
                <div className="text-xs" style={{ color: "#B2BEC3" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* 功能模块网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="no-underline group"
            >
              <div
                className="p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300"
                style={{ background: "#FFFFFF" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: m.color, opacity: 0.15 }}
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ background: m.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold mb-1" style={{ color: "#2D3436" }}>
                      {m.label}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#636E72" }}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
