"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载付款数据
    setTimeout(() => {
      setPayments([
        {
          id: 1,
          taskTitle: "UI设计优化",
          studentName: "李四",
          amount: 3000,
          status: "pending",
          completedDate: "2025-01-15",
          taskId: 3,
        },
        {
          id: 2,
          taskTitle: "数据分析报告",
          studentName: "王五",
          amount: 4500,
          status: "paid",
          completedDate: "2025-01-12",
          paidDate: "2025-01-13",
          taskId: 4,
        },
        {
          id: 3,
          taskTitle: "移动端适配",
          studentName: "赵六",
          amount: 6000,
          status: "pending",
          completedDate: "2025-01-14",
          taskId: 5,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handlePayment = (paymentId: number) => {
    if (confirm("确认付款？")) {
      setPayments(payments.map(p =>
        p.id === paymentId
          ? { ...p, status: "paid", paidDate: new Date().toISOString().split('T')[0] }
          : p
      ));
      alert("付款成功！");
    }
  };

  const pendingPayments = payments.filter(p => p.status === "pending");
  const paidPayments = payments.filter(p => p.status === "paid");
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

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
          background: "#1d1d1f",
          color: "#ffffff",
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
            付款管理
          </h1>
          <p style={{ fontSize: "14px", color: "#86868b" }}>
            管理任务付款和财务记录
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
            background: "#fff3cd",
            borderRadius: "16px",
            padding: "24px",
          }}>
            <div style={{ fontSize: "14px", color: "#86868b", marginBottom: "8px" }}>待付款</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#1d1d1f" }}>
              ¥{totalPending.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#86868b", marginTop: "4px" }}>
              {pendingPayments.length} 笔待处理
            </div>
          </div>

          <div style={{
            background: "#d4f4dd",
            borderRadius: "16px",
            padding: "24px",
          }}>
            <div style={{ fontSize: "14px", color: "#86868b", marginBottom: "8px" }}>已付款</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#1d1d1f" }}>
              ¥{totalPaid.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#86868b", marginTop: "4px" }}>
              {paidPayments.length} 笔已完成
            </div>
          </div>

          <div style={{
            background: "#e6f2ff",
            borderRadius: "16px",
            padding: "24px",
          }}>
            <div style={{ fontSize: "14px", color: "#86868b", marginBottom: "8px" }}>总支出</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#1d1d1f" }}>
              ¥{(totalPending + totalPaid).toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#86868b", marginTop: "4px" }}>
              本月累计
            </div>
          </div>
        </div>

        {/* 待付款列表 */}
        {pendingPayments.length > 0 && (
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e5e5e7",
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1d1d1f", marginBottom: "20px" }}>
              待付款 ({pendingPayments.length})
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    padding: "20px",
                    background: "#f5f5f7",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                      {payment.taskTitle}
                    </h3>
                    <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#86868b" }}>
                      <span>👤 {payment.studentName}</span>
                      <span>📅 完成于 {payment.completedDate}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: "#1d1d1f" }}>
                        ¥{payment.amount.toLocaleString()}
                      </div>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#ff9500",
                        background: "#fff3cd",
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}>
                        待付款
                      </span>
                    </div>

                    <button
                      onClick={() => handlePayment(payment.id)}
                      style={{
                        padding: "12px 24px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      确认付款
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 已付款列表 */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e5e5e7",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1d1d1f", marginBottom: "20px" }}>
            付款记录 ({paidPayments.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#86868b" }}>
              加载中...
            </div>
          ) : paidPayments.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e5e7" }}>
                  <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>任务名称</th>
                  <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>学生</th>
                  <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>完成日期</th>
                  <th style={{ textAlign: "left", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>付款日期</th>
                  <th style={{ textAlign: "right", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>金额</th>
                  <th style={{ textAlign: "center", padding: "12px 0", fontSize: "12px", color: "#86868b", fontWeight: 600 }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {paidPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: "1px solid #f5f5f7" }}>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#1d1d1f", fontWeight: 500 }}>
                      {payment.taskTitle}
                    </td>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#86868b" }}>
                      {payment.studentName}
                    </td>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#86868b" }}>
                      {payment.completedDate}
                    </td>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#86868b" }}>
                      {payment.paidDate}
                    </td>
                    <td style={{ padding: "16px 0", fontSize: "14px", color: "#1d1d1f", fontWeight: 600, textAlign: "right" }}>
                      ¥{payment.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 0", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#d4f4dd",
                        color: "#34c759",
                      }}>
                        ✓ 已付款
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#86868b" }}>
              暂无付款记录
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
