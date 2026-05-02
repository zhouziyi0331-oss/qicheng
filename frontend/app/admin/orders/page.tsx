"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface Order {
  id: string;
  task_title: string;
  student_name: string;
  company_name: string;
  status: string;
  amount: number;
  created_at: string;
  completed_at?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);

    fetch(`/api/v1/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.list) setOrders(data.list);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const getStatusInfo = (status: string) => {
    const map: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
      pending: { type: "warning", label: "待接单" },
      accepted: { type: "info", label: "进行中" },
      submitted: { type: "warning", label: "待验收" },
      completed: { type: "success", label: "已完成" },
      cancelled: { type: "error", label: "已取消" },
      disputed: { type: "error", label: "纠纷中" },
    };
    return map[status] || { type: "info", label: status };
  };

  return (
    <AdminLayout
      title="🛒 订单管理"
      subtitle={`共 ${orders.length} 个订单`}
      actions={
        <Button onClick={() => show("导出功能开发中", "info")}>
          📥 导出数据
        </Button>
      }
    >
      {/* 状态筛选 */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px" }}>
        {[
          { value: "all", label: "全部" },
          { value: "pending", label: "待接单" },
          { value: "accepted", label: "进行中" },
          { value: "submitted", label: "待验收" },
          { value: "completed", label: "已完成" },
          { value: "disputed", label: "纠纷中" }
        ].map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: statusFilter === status.value ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              border: statusFilter === status.value ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
              color: statusFilter === status.value ? "#3B82F6" : "#8E96A5",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { label: "总订单数", value: orders.length, icon: "🛒", color: "#3B82F6" },
          { label: "进行中", value: orders.filter(o => o.status === "accepted").length, icon: "⚡", color: "#10B981" },
          { label: "已完成", value: orders.filter(o => o.status === "completed").length, icon: "✅", color: "#8B5CF6" },
          { label: "总金额", value: `¥${Math.round(orders.reduce((sum, o) => sum + o.amount, 0) / 100)}`, icon: "💰", color: "#F59E0B" }
        ].map((stat, idx) => (
          <Card key={idx} style={{ padding: "20px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `${stat.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#F1F5F9",
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#8E96A5",
                  fontWeight: "500"
                }}>
                  {stat.label}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 订单列表 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : orders.length === 0 ? (
        <EmptyState icon="🛒" message="暂无订单数据" />
      ) : (
        <Table headers={["任务", "学生", "企业", "状态", "金额", "创建时间", "操作"]}>
          {orders.map((o) => {
            const statusInfo = getStatusInfo(o.status);
            return (
              <TableRow key={o.id}>
                <TableCell>
                  <div style={{ fontWeight: "600", maxWidth: "300px" }}>{o.task_title}</div>
                </TableCell>
                <TableCell>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(139,92,246,0.15)",
                    color: "#8B5CF6",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {o.student_name}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(245,158,11,0.15)",
                    color: "#F59E0B",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {o.company_name}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusInfo.type} label={statusInfo.label} />
                </TableCell>
                <TableCell>
                  <span style={{
                    color: "#10B981",
                    fontWeight: "700",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    ¥{Math.round(o.amount / 100)}
                  </span>
                </TableCell>
                <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                  {new Date(o.created_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.3)",
                      color: "#3B82F6",
                      fontSize: "12px",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "inline-block",
                      transition: "all 0.2s"
                    }}
                  >
                    查看详情
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}
    </AdminLayout>
  );
}
