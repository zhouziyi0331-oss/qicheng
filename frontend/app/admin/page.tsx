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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState("dashboard");

  useEffect(() => {
    adminApi.dashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const modules = [
    { id: "dashboard", href: "/admin", label: "数据看板", icon: "📊" },
    { id: "students", href: "/admin/students", label: "学生管理", icon: "👨‍🎓" },
    { id: "companies", href: "/admin/companies", label: "企业管理", icon: "🏢" },
    { id: "tasks", href: "/admin/tasks", label: "任务管理", icon: "📋" },
    { id: "orders", href: "/admin/orders", label: "订单管理", icon: "📦" },
    { id: "mentors", href: "/admin/mentors", label: "导师管理", icon: "👨‍🏫" },
    { id: "ai", href: "/admin/ai", label: "AI引擎", icon: "🤖" },
    { id: "content", href: "/admin/content", label: "内容管理", icon: "📝" },
    { id: "finance", href: "/admin/finance", label: "财务管理", icon: "💰" },
    { id: "support", href: "/admin/support", label: "客服工具", icon: "💬" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0C10 0%, #11141C 100%)",
      display: "flex",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* 侧边栏 */}
      <aside style={{
        width: sidebarCollapsed ? "80px" : "240px",
        background: "#1A1D24",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {!sidebarCollapsed && (
            <div style={{ color: "#F1F5F9", fontSize: "18px", fontWeight: "700" }}>
              启程管理
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#3B82F6",
              fontSize: "16px"
            }}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {modules.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              onClick={() => setActiveModule(m.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                marginBottom: "4px",
                borderRadius: "12px",
                background: activeModule === m.id ? "rgba(59,130,246,0.15)" : "transparent",
                border: activeModule === m.id ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                color: activeModule === m.id ? "#3B82F6" : "#8E96A5",
                textDecoration: "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeModule === m.id ? "600" : "500"
              }}
              onMouseEnter={(e) => {
                if (activeModule !== m.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeModule !== m.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>{m.icon}</span>
              {!sidebarCollapsed && <span>{m.label}</span>}
            </Link>
          ))}
        </nav>

        {/* 底部用户信息 */}
        <div style={{
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.03)"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "700"
            }}>
              A
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F1F5F9", fontSize: "13px", fontWeight: "600" }}>Admin</div>
                <div style={{ color: "#8E96A5", fontSize: "11px" }}>超级管理员</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
          {/* 顶部欢迎栏 */}
          <div style={{
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h1 style={{
                color: "#F1F5F9",
                fontSize: "28px",
                fontWeight: "700",
                marginBottom: "8px",
                letterSpacing: "-0.5px"
              }}>
                欢迎回来 👋
              </h1>
              <p style={{ color: "#8E96A5", fontSize: "14px" }}>
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F1F5F9",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                📥 导出报表
              </button>
              <button style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                border: "none",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(59,130,246,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
              }}
              >
                ⚡ 快捷操作
              </button>
            </div>
          </div>

          {/* 数据概览卡片 */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  height: "140px",
                  borderRadius: "16px",
                  background: "#1A1D24",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                }} />
              ))}
            </div>
          ) : stats && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "32px"
            }}>
              {[
                {
                  label: "总用户",
                  value: stats.users.total,
                  change: `+${stats.users.today}`,
                  changeLabel: "今日新增",
                  trend: "up",
                  color: "#3B82F6",
                  icon: "👥"
                },
                {
                  label: "活跃任务",
                  value: stats.tasks.active,
                  change: `${stats.tasks.pending_review}`,
                  changeLabel: "待审核",
                  trend: "neutral",
                  color: "#8B5CF6",
                  icon: "📋"
                },
                {
                  label: "待处理提现",
                  value: stats.finance.pending_withdrawals,
                  change: `${stats.finance.pending_advances}`,
                  changeLabel: "垫付申请",
                  trend: "neutral",
                  color: "#F59E0B",
                  icon: "💳"
                },
                {
                  label: "累计流水",
                  value: `¥${stats.finance.total_gross.toLocaleString()}`,
                  change: `¥${stats.finance.total_net.toLocaleString()}`,
                  changeLabel: "平台实得",
                  trend: "up",
                  color: "#10B981",
                  icon: "💰"
                },
              ].map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "24px",
                    borderRadius: "16px",
                    background: "#1A1D24",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.5)";
                    e.currentTarget.style.borderColor = `${s.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  }}
                >
                  {/* 左侧色块 */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    background: `linear-gradient(180deg, ${s.color} 0%, ${s.color}80 100%)`
                  }} />

                  {/* 图标 */}
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `${s.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "16px"
                  }}>
                    {s.icon}
                  </div>

                  {/* 数值 */}
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#F1F5F9",
                    marginBottom: "8px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums"
                  }}>
                    {s.value}
                  </div>

                  {/* 标签 */}
                  <div style={{
                    fontSize: "13px",
                    color: "#8E96A5",
                    marginBottom: "12px",
                    fontWeight: "500"
                  }}>
                    {s.label}
                  </div>

                  {/* 变化指示 */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: s.trend === "up" ? "#10B981" : s.trend === "down" ? "#F97316" : "#8E96A5",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {s.trend === "up" && "↗"} {s.change}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: "#8E96A5"
                    }}>
                      {s.changeLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 图表和列表区域 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "32px" }}>
            {/* 收入趋势图 */}
            <div style={{
              padding: "24px",
              borderRadius: "16px",
              background: "#1A1D24",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px"
              }}>
                <div>
                  <h3 style={{ color: "#F1F5F9", fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                    收入趋势
                  </h3>
                  <p style={{ color: "#8E96A5", fontSize: "13px" }}>最近7天数据</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["日", "周", "月"].map((t) => (
                    <button key={t} style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: t === "日" ? "rgba(59,130,246,0.15)" : "transparent",
                      border: t === "日" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
                      color: t === "日" ? "#3B82F6" : "#8E96A5",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 简单的柱状图模拟 */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "200px" }}>
                {[65, 80, 75, 90, 85, 95, 88].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "100%",
                      height: `${h}%`,
                      background: `linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)`,
                      borderRadius: "8px 8px 0 0",
                      position: "relative",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)";
                    }}
                    >
                      <div style={{
                        position: "absolute",
                        top: "-24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "11px",
                        color: "#8E96A5",
                        fontWeight: "600",
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {Math.round(h * 100)}
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#8E96A5" }}>
                      {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 待办事项 */}
            <div style={{
              padding: "24px",
              borderRadius: "16px",
              background: "#1A1D24",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
            }}>
              <h3 style={{ color: "#F1F5F9", fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}>
                待办事项
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "待审核企业", count: 3, color: "#F59E0B" },
                  { label: "待审核任务", count: stats?.tasks.pending_review || 0, color: "#8B5CF6" },
                  { label: "待处理纠纷", count: 1, color: "#EF4444" },
                  { label: "待审核提现", count: stats?.finance.pending_withdrawals || 0, color: "#10B981" },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = `${item.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  }}
                  >
                    <span style={{ color: "#F1F5F9", fontSize: "14px", fontWeight: "500" }}>
                      {item.label}
                    </span>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      background: `${item.color}20`,
                      color: item.color,
                      fontSize: "13px",
                      fontWeight: "700",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近活动 */}
          <div style={{
            padding: "24px",
            borderRadius: "16px",
            background: "#1A1D24",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
          }}>
            <h3 style={{ color: "#F1F5F9", fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}>
              最近活动
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { user: "张三", action: "完成了任务", target: "网站UI设计", time: "2分钟前", type: "success" },
                { user: "李四", action: "申请提现", target: "¥500", time: "15分钟前", type: "warning" },
                { user: "王五", action: "发布了任务", target: "APP开发需求", time: "1小时前", type: "info" },
                { user: "赵六", action: "提交了纠纷", target: "订单#1234", time: "2小时前", type: "error" },
              ].map((activity, i) => (
                <div key={i} style={{
                  padding: "16px 0",
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: activity.type === "success" ? "rgba(16,185,129,0.15)" :
                                activity.type === "warning" ? "rgba(245,158,11,0.15)" :
                                activity.type === "error" ? "rgba(239,68,68,0.15)" :
                                "rgba(59,130,246,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                  }}>
                    {activity.type === "success" ? "✓" :
                     activity.type === "warning" ? "⚠" :
                     activity.type === "error" ? "✕" : "ℹ"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#F1F5F9", fontSize: "14px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600" }}>{activity.user}</span>
                      {" "}<span style={{ color: "#8E96A5" }}>{activity.action}</span>
                      {" "}<span style={{ fontWeight: "600" }}>{activity.target}</span>
                    </div>
                    <div style={{ color: "#8E96A5", fontSize: "12px" }}>
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
