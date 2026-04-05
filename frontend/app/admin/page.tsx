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
    { href: "/admin/tasks", icon: "📋", label: "需求管理", desc: "审核、下架企业任务" },
    { href: "/admin/students", icon: "🎓", label: "学生数据", desc: "查看学生档案与OPC标签" },
    { href: "/admin/support", icon: "🛟", label: "客服工具", desc: "介入任务、发送通知" },
    { href: "/admin/finance", icon: "💰", label: "财务管理", desc: "审核提现、首单垫付" },
    { href: "/admin/broadcast", icon: "📢", label: "通知推送", desc: "全平台广播消息" },
    { href: "/admin/logs", icon: "📜", label: "操作日志", desc: "不可删除的管理员记录" },
    { href: "/admin/config", icon: "⚙️", label: "系统配置", desc: "超管专属参数调整" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>后台管理</h1>
        <p className="text-sm mt-1" style={{ color: "#8b949e" }}>启程平台管理中心</p>
      </div>

      {/* 数据概览 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "总用户", value: stats.users.total, sub: `今日新增 ${stats.users.today}`, color: "#58a6ff" },
            { label: "活跃任务", value: stats.tasks.active, sub: `待审核 ${stats.tasks.pending_review}`, color: "#3fb950" },
            { label: "待处理提现", value: stats.finance.pending_withdrawals, sub: `首单垫付 ${stats.finance.pending_advances}`, color: "#d29922" },
            { label: "累计流水", value: `¥${stats.finance.total_gross}`, sub: `学生实得 ¥${stats.finance.total_net}`, color: "#a371f7" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-medium mb-0.5" style={{ color: "#e6edf3" }}>{s.label}</div>
              <div className="text-xs" style={{ color: "#484f58" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* 模块导航 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="p-5 rounded-lg no-underline group transition-colors"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span className="font-semibold" style={{ color: "#e6edf3" }}>{m.label}</span>
            </div>
            <p className="text-sm" style={{ color: "#8b949e" }}>{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
