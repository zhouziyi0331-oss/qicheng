"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// 模拟数据
const mockStats = {
  users: { total_students: 1234, total_companies: 89, dau_students: 456, wau_students: 890, new_today: 23 },
  tasks: { total_tasks: 567, completed_tasks: 234, completion_rate: 41.3, avg_hours: 12.5 },
  finance: { total_gross: 1234567, total_platform_fee: 123456, total_settled: 1111111 },
  onboarding: { total: 1234, j1_done: 890, j8_done: 678, first_task_completion_rate: 75.2 },
  emotion: [
    { signal_type: "积极", count: 234 },
    { signal_type: "中性", count: 456 },
    { signal_type: "消极", count: 89 }
  ],
  charts: {
    userGrowth: [
      { date: "2024-01", students: 100, companies: 10 },
      { date: "2024-02", students: 250, companies: 15 },
      { date: "2024-03", students: 450, companies: 25 },
      { date: "2024-04", students: 680, companies: 35 },
      { date: "2024-05", students: 920, companies: 50 },
      { date: "2024-06", students: 1234, companies: 89 },
    ],
    taskStatus: [
      { status: "进行中", count: 234 },
      { status: "已完成", count: 234 },
      { status: "待审核", count: 99 },
    ],
    monthlyRevenue: [
      { month: "1月", revenue: 150000 },
      { month: "2月", revenue: 180000 },
      { month: "3月", revenue: 220000 },
      { month: "4月", revenue: 280000 },
      { month: "5月", revenue: 350000 },
      { month: "6月", revenue: 420000 },
    ]
  }
};

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#feca57', '#ff6b6b'];

export default function AdminDemoPage() {
  const [stats] = useState(mockStats);
  const [loading] = useState(false);

  const modules = [
    { href: "/admin/tasks", label: "需求管理", icon: "📋", desc: "审核、下架企业任务" },
    { href: "/admin/students", label: "学生数据", icon: "👨‍🎓", desc: "查看学生档案与OPC标签" },
    { href: "/admin/support", label: "客服工具", icon: "💬", desc: "介入任务、发送通知" },
    { href: "/admin/finance", label: "财务管理", icon: "💰", desc: "审核提现、首单垫付" },
    { href: "/admin/broadcast", label: "通知推送", icon: "📢", desc: "全平台广播消息" },
    { href: "/admin/logs", label: "操作日志", icon: "📝", desc: "不可删除的管理员记录" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* 侧边栏 */}
      <div style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "80px",
        background: "#1a1d29",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "24px",
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{
          width: "48px",
          height: "48px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          marginBottom: "40px"
        }}>
          🚀
        </div>

        {/* 导航图标 */}
        {[
          { icon: "📊", active: true },
          { icon: "💼", active: false },
          { icon: "📈", active: false },
          { icon: "📦", active: false },
          { icon: "👤", active: false },
        ].map((item, i) => (
          <div key={i} style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            marginBottom: "16px",
            background: item.active ? "rgba(102, 126, 234, 0.2)" : "transparent",
            cursor: "pointer",
            transition: "all 0.3s"
          }}>
            {item.icon}
          </div>
        ))}
      </div>

      {/* 主内容区 */}
      <div style={{ marginLeft: "80px", padding: "32px" }}>
        {/* 顶部栏 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px"
        }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1a1d29", margin: 0, marginBottom: "8px" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: "14px", color: "#8b92a7", margin: 0 }}>
              欢迎回来，管理员 👋
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              🔔
            </div>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontWeight: "600"
            }}>
              A
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
          marginBottom: "32px"
        }}>
          {[
            { label: "总学生数", value: stats.users.total_students, change: "+12.5%", icon: "👨‍🎓", color: "#667eea" },
            { label: "总企业数", value: stats.users.total_companies, change: "+8.2%", icon: "🏢", color: "#f093fb" },
            { label: "活跃任务", value: stats.tasks.total_tasks - stats.tasks.completed_tasks, change: "+23.1%", icon: "📋", color: "#4facfe" },
            { label: "平台收入", value: `¥${(stats.finance.total_platform_fee / 10000).toFixed(1)}万`, change: "+15.3%", icon: "💰", color: "#43e97b" },
          ].map((card, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: card.color,
                opacity: 0.1
              }} />
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>{card.icon}</div>
              <div style={{ fontSize: "14px", color: "#8b92a7", marginBottom: "8px" }}>{card.label}</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#1a1d29", marginBottom: "8px" }}>
                {card.value}
              </div>
              <div style={{ fontSize: "12px", color: "#43e97b", fontWeight: "600" }}>
                {card.change} vs 上月
              </div>
            </div>
          ))}
        </div>

        {/* 图表区域 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "32px"
        }}>
          {/* 用户增长趋势 */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1a1d29", marginBottom: "24px" }}>
              用户增长趋势
            </h3>
            {stats.charts?.userGrowth && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#8b92a7" />
                  <YAxis stroke="#8b92a7" />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="students"
                    stroke="#667eea"
                    strokeWidth={3}
                    name="学生"
                    dot={{ fill: "#667eea", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="companies"
                    stroke="#f093fb"
                    strokeWidth={3}
                    name="企业"
                    dot={{ fill: "#f093fb", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 任务状态分布 */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1a1d29", marginBottom: "24px" }}>
              任务状态分布
            </h3>
            {stats.charts?.taskStatus && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.charts.taskStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.charts.taskStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 月度收入 */}
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "32px"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1a1d29", marginBottom: "24px" }}>
            月度收入统计
          </h3>
          {stats.charts?.monthlyRevenue && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.charts.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#8b92a7" />
                <YAxis stroke="#8b92a7" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                  formatter={(value: number) => `¥${value.toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 快捷功能模块 */}
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1a1d29", marginBottom: "24px" }}>
            快捷功能
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px"
          }}>
            {modules.map((mod, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "all 0.3s",
                border: "2px solid transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>{mod.icon}</div>
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#1a1d29", marginBottom: "8px" }}>
                  {mod.label}
                </h4>
                <p style={{ fontSize: "14px", color: "#8b92a7", margin: 0 }}>
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
