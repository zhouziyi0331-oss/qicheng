"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { taskApi } from "@/lib/api";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    taskApi.companyTasks().then(({ data }) => {
      setTasks(data.data || []);
    }).catch(() => {
      // 模拟数据
      setTasks([
        {
          id: 1,
          title: "前端开发任务",
          status: "active",
          budget_gross: 5000,
          created_at: "2025-01-10",
          description: "开发响应式网页界面",
          applicants: 3,
          assignee: null,
        },
        {
          id: 2,
          title: "后端API开发",
          status: "in_progress",
          budget_gross: 8000,
          created_at: "2025-01-09",
          description: "构建RESTful API接口",
          applicants: 5,
          assignee: { name: "张三", progress: 65 },
        },
        {
          id: 3,
          title: "UI设计优化",
          status: "completed",
          budget_gross: 3000,
          created_at: "2025-01-08",
          description: "优化用户界面设计",
          applicants: 2,
          assignee: { name: "李四", progress: 100 },
        },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f7" }}>
      {/* 左侧导航栏 - 复用 */}
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

        <div style={{ fontSize: "12px", color: "#86868b", fontWeight: 600, padding: "8px 12px", marginTop: "8px" }}>
          主菜单
        </div>

        <Link href="/enterprise" style={{
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
          <span style={{ fontSize: "18px" }}>📊</span>
          仪表盘
        </Link>

        <Link href="/enterprise/tasks" style={{
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
        {/* 顶部 */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#1d1d1f", marginBottom: "8px" }}>
            任务管理
          </h1>
          <p style={{ fontSize: "14px", color: "#86868b" }}>
            查看和管理所有任务进度
          </p>
        </div>

        {/* 筛选按钮 */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #e5e5e7",
              background: filter === "all" ? "#1d1d1f" : "#ffffff",
              color: filter === "all" ? "#ffffff" : "#1d1d1f",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            全部任务
          </button>
          <button
            onClick={() => setFilter("active")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #e5e5e7",
              background: filter === "active" ? "#1d1d1f" : "#ffffff",
              color: filter === "active" ? "#ffffff" : "#1d1d1f",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            招募中
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #e5e5e7",
              background: filter === "in_progress" ? "#1d1d1f" : "#ffffff",
              color: filter === "in_progress" ? "#ffffff" : "#1d1d1f",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            进行中
          </button>
          <button
            onClick={() => setFilter("completed")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #e5e5e7",
              background: filter === "completed" ? "#1d1d1f" : "#ffffff",
              color: filter === "completed" ? "#ffffff" : "#1d1d1f",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            已完成
          </button>
        </div>

        {/* 任务列表 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#86868b" }}>
              加载中...
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid #e5e5e7",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                      {task.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#86868b", marginBottom: "12px" }}>
                      {task.description}
                    </p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#86868b" }}>
                      <span>📅 {task.created_at}</span>
                      <span>💰 ¥{task.budget_gross?.toLocaleString()}</span>
                      <span>👥 {task.applicants} 人申请</span>
                    </div>
                  </div>

                  <span style={{
                    padding: "6px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: task.status === 'completed' ? '#d4f4dd' : task.status === 'in_progress' ? '#fff3cd' : '#e5e5e7',
                    color: task.status === 'completed' ? '#34c759' : task.status === 'in_progress' ? '#ff9500' : '#86868b',
                    whiteSpace: "nowrap",
                  }}>
                    {task.status === 'completed' ? '✓ 已完成' : task.status === 'in_progress' ? '● 进行中' : '○ 招募中'}
                  </span>
                </div>

                {/* 进度条 */}
                {task.assignee && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#86868b" }}>
                        执行者: {task.assignee.name}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1d1d1f" }}>
                        {task.assignee.progress}%
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "8px",
                      background: "#e5e5e7",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${task.assignee.progress}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "4px",
                      }} />
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <Link
                    href={`/enterprise/tasks/${task.id}`}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: "#1d1d1f",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 500,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    查看详情
                  </Link>
                  {task.status === 'active' && (
                    <button style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5e7",
                      background: "#ffffff",
                      color: "#1d1d1f",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}>
                      查看申请者
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: "#34c759",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}>
                      确认付款
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "60px",
              border: "1px solid #e5e5e7",
              textAlign: "center",
              color: "#86868b",
            }}>
              暂无任务
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
