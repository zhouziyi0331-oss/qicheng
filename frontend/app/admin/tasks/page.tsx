"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface AdminTask {
  id: string;
  title: string;
  status: string;
  track_type: string;
  budget_gross: number;
  company_name: string;
  assignee_count: number;
  max_assignees: number;
  created_at: string;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { show } = useToast();

  useEffect(() => {
    adminApi.companyTasks()
      .then(({ data }) => setTasks(data.data || []))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleTakedown = async (id: string) => {
    const reason = window.prompt("下架原因（学生和企业都会看到）：");
    if (!reason) return;
    setActing(id);
    try {
      await adminApi.takedownTask(id, reason);
      show("已下架", "success");
      setTasks((ts) => ts.filter((t) => t.id !== id));
    } catch {
      show("操作失败", "error");
    } finally {
      setActing(null);
    }
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
      pending_review: { type: "warning", label: "待审核" },
      active: { type: "info", label: "进行中" },
      in_progress: { type: "info", label: "进行中" },
      completed: { type: "success", label: "已完成" },
      cancelled: { type: "error", label: "已取消" },
      draft: { type: "warning", label: "草稿" },
    };
    return map[status] || { type: "info", label: status };
  };

  const filteredTasks = tasks.filter(t =>
    statusFilter === "all" || t.status === statusFilter
  );

  return (
    <AdminLayout
      title="📋 任务管理"
      subtitle={`共 ${tasks.length} 个任务`}
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
          { value: "pending_review", label: "待审核" },
          { value: "active", label: "进行中" },
          { value: "completed", label: "已完成" },
          { value: "cancelled", label: "已取消" }
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
          { label: "总任务数", value: tasks.length, icon: "📋", color: "#3B82F6" },
          { label: "待审核", value: tasks.filter(t => t.status === "pending_review").length, icon: "⏳", color: "#F59E0B" },
          { label: "进行中", value: tasks.filter(t => t.status === "active" || t.status === "in_progress").length, icon: "⚡", color: "#10B981" },
          { label: "总预算", value: `¥${Math.round(tasks.reduce((sum, t) => sum + t.budget_gross, 0) / 100)}`, icon: "💰", color: "#8B5CF6" }
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

      {/* 任务列表 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState icon="📋" message="暂无任务数据" />
      ) : (
        <Table headers={["任务", "企业", "状态", "赛道", "预算", "进度", "创建时间", "操作"]}>
          {filteredTasks.map((t) => {
            const statusInfo = getStatusInfo(t.status);
            return (
              <TableRow key={t.id}>
                <TableCell>
                  <div style={{ fontWeight: "600", maxWidth: "300px" }}>{t.title}</div>
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
                    {t.company_name}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusInfo.type} label={statusInfo.label} />
                </TableCell>
                <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                  {t.track_type || "未分类"}
                </TableCell>
                <TableCell>
                  <span style={{
                    color: "#10B981",
                    fontWeight: "700",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    ¥{Math.round(t.budget_gross / 100)}
                  </span>
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      flex: 1,
                      height: "6px",
                      borderRadius: "3px",
                      background: "rgba(255,255,255,0.1)",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${(t.assignee_count / t.max_assignees) * 100}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #3B82F6, #10B981)",
                        transition: "width 0.3s"
                      }} />
                    </div>
                    <span style={{
                      fontSize: "12px",
                      color: "#8E96A5",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {t.assignee_count}/{t.max_assignees}
                    </span>
                  </div>
                </TableCell>
                <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                  {new Date(t.created_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/admin/tasks/${t.id}`}
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
                      详情
                    </Link>
                    {t.status !== "cancelled" && (
                      <button
                        onClick={() => handleTakedown(t.id)}
                        disabled={acting === t.id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: acting === t.id ? "not-allowed" : "pointer",
                          opacity: acting === t.id ? 0.6 : 1,
                          transition: "all 0.2s"
                        }}
                      >
                        {acting === t.id ? "处理中..." : "下架"}
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}
    </AdminLayout>
  );
}
