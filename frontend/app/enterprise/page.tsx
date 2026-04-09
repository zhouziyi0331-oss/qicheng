"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { taskApi } from "@/lib/api";

export default function CompanyDashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    completionRate: 0,
    totalSpent: 0,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.companyTasks().then(({ data }) => {
      const taskList = data.data || [];
      setTasks(taskList);

      const total = taskList.length;
      const active = taskList.filter((t: any) => t.status === 'active' || t.status === 'in_progress').length;
      const completed = taskList.filter((t: any) => t.status === 'completed').length;
      const spent = taskList.reduce((sum: number, t: any) => sum + (t.budget_gross || 0), 0);

      setStats({
        totalTasks: total,
        activeTasks: active,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalSpent: spent,
      });
    }).catch(() => {
      // 使用模拟数据
      setStats({
        totalTasks: 12,
        activeTasks: 5,
        completionRate: 85,
        totalSpent: 28500,
      });
      setTasks([
        { id: 1, title: "前端开发任务", status: "active", budget_gross: 5000, created_at: "2025-01-10" },
        { id: 2, title: "后端API开发", status: "in_progress", budget_gross: 8000, created_at: "2025-01-09" },
        { id: 3, title: "UI设计优化", status: "completed", budget_gross: 3000, created_at: "2025-01-08" },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f7" }}>
      {/* 左侧导航栏 */}
      <aside style={{
        width: "240px",
        background: "#ffffff",
        borderRight: "1px solid #e5e5e7",
        padding: "24px 16px",
        position: "fixed",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          marginBottom: "24px",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}>
            🚀
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1d1d1f" }}>启程企业版</span>
        </div>

        {/* Main 菜单 */}
        <div style={{ fontSize: "12px", color: "#86868b", fontWeight: 600, padding: "8px 12px", marginTop: "8px" }}>
          主菜单
        </div>

        <Link href="/enterprise" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#1d1d1f",
          color: "#ffffff",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>📊</span>
          仪表盘
        </Link>

        <Link href="/enterprise/tasks" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>📋</span>
          任务管理
        </Link>

        <Link href="/enterprise/publish" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>➕</span>
          发布任务
        </Link>

        <Link href="/enterprise/payments" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>💰</span>
          付款管理
        </Link>

        {/* Tools 菜单 */}
        <div style={{ fontSize: "12px", color: "#86868b", fontWeight: 600, padding: "8px 12px", marginTop: "24px" }}>
          工具
        </div>

        <Link href="/enterprise/analytics" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>📈</span>
          数据分析
        </Link>

        <Link href="/enterprise/settings" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>⚙️</span>
          设置
        </Link>
      </aside>

      {/* 主内容区 */}
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px" }}>
        {/* 顶部搜索栏 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#ffffff",
            border: "1px solid #e5e5e7",
            borderRadius: "12px",
            padding: "10px 16px",
            width: "400px",
          }}>
            <span style={{ fontSize: "16px", color: "#86868b" }}>🔍</span>
            <input
              type="text"
              placeholder="搜索或输入命令"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "14px",
                color: "#1d1d1f",
                width: "100%",
              }}
            />
            <span style={{ fontSize: "12px", color: "#86868b", fontWeight: 500 }}>⌘F</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "1px solid #e5e5e7",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "18px",
            }}>
              ⚙️
            </button>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
            }}>
              M
            </div>
          </div>
        </div>

        {/* 欢迎标题 */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#1d1d1f", marginBottom: "8px" }}>
            你好，企业用户
          </h1>
          <p style={{ fontSize: "14px", color: "#86868b" }}>
            实时监控任务进度和AI智能分析
          </p>
        </div>

        {/* 统计卡片 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "32px",
        }}>
          <div style={{
            background: "#fff9e6",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
          }}>
            <div style={{ fontSize: "14px", color: "#86868b", marginBottom: "8px" }}>总任务数</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#1d1d1f", marginBottom: "8px" }}>
              {stats.totalTasks}
            </div>
            <button style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#1d1d1f",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
            }}>
              →
            </button>
          </div>

          <div style={{
            background: "#e6f2ff",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
          }}>
            <div style={{ fontSize: "14px", color: "#86868b", marginBottom: "8px" }}>进行中任务</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#1d1d1f", marginBottom: "8px" }}>
              {stats.activeTasks}
            </div>
            <button style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#1d1d1f",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
            }}>
              →
            </button>
          </div>

          <div style={{
            background: "#f0f0f0",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
          }}>
            <div style={{ fontSize: "14px", color: "#86868b", marginBottom: "8px" }}>完成率</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#1d1d1f", marginBottom: "8px" }}>
              {stats.completionRate}%
            </div>
            <button style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#1d1d1f",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
            }}>
              →
            </button>
          </div>
        </div>

        {/* 任务进度趋势 */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "32px",
          border: "1px solid #e5e5e7",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1d1d1f", marginBottom: "4px" }}>
                任务进度趋势
              </h2>
              <p style={{ fontSize: "12px", color: "#86868b" }}>本周任务完成情况</p>
            </div>
            <select style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e5e7",
              background: "#ffffff",
              fontSize: "14px",
              color: "#1d1d1f",
              cursor: "pointer",
            }}>
              <option>本周</option>
              <option>本月</option>
              <option>本年</option>
            </select>
          </div>

          {/* 简单的柱状图 */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", height: "200px" }}>
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
              const heights = [120, 100, 180, 90, 200, 110, 150];
              return (
                <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "100%",
                    height: `${heights[i]}px`,
                    background: i === 4 ? "linear-gradient(180deg, #667eea 0%, #764ba2 100%)" : "#e5e5e7",
                    borderRadius: "8px",
                    position: "relative",
                  }}>
                    {i === 4 && (
                      <div style={{
                        position: "absolute",
                        top: "-32px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#1d1d1f",
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        4 小时
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "#86868b" }}>{day}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#1d1d1f" }}>14 小时</div>
            <span style={{ fontSize: "12px", color: "#86868b" }}>本周总计</span>
            <span style={{ fontSize: "12px", color: "#34c759", fontWeight: 600, marginLeft: "8px" }}>+15% 较上周</span>
          </div>
        </div>

        {/* 任务列表 */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e5e5e7",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1d1d1f", marginBottom: "20px" }}>
            最近任务
          </h2>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e5e7" }}>
                <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>任务名称</th>
                <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>日期</th>
                <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>预算</th>
                <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#86868b" }}>
                    加载中...
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <tr key={task.id} style={{ borderBottom: "1px solid #f5f5f7" }}>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#1d1d1f", fontWeight: 500 }}>
                      {task.title}
                    </td>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#86868b" }}>
                      {task.created_at || '2025-01-10'}
                    </td>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#1d1d1f", fontWeight: 600 }}>
                      ¥{task.budget_gross?.toLocaleString() || 0}
                    </td>
                    <td style={{ padding: "16px 0" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: task.status === 'completed' ? '#d4f4dd' : task.status === 'in_progress' ? '#fff3cd' : '#e5e5e7',
                        color: task.status === 'completed' ? '#34c759' : task.status === 'in_progress' ? '#ff9500' : '#86868b',
                      }}>
                        {task.status === 'completed' ? '✓ 已完成' : task.status === 'in_progress' ? '● 进行中' : '○ 招募中'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#86868b" }}>
                    暂无任务
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
