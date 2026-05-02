"use client";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface LogEntry {
  id: string;
  admin_id: string;
  admin_nickname: string;
  action: string;
  target_type: string;
  target_id: string;
  note: string;
  created_at: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { show } = useToast();

  const load = (p: number) => {
    setLoading(true);
    adminApi.getLogs(p)
      .then(({ data }) => {
        const items = data.data || [];
        if (p === 1) setLogs(items);
        else setLogs((prev) => [...prev, ...items]);
        setHasMore(items.length === 50);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const getActionInfo = (action: string) => {
    const map: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
      task_takedown: { type: "error", label: "任务下架" },
      company_blacklist: { type: "error", label: "企业拉黑" },
      withdrawal_approve: { type: "success", label: "提现审批" },
      broadcast_notification: { type: "info", label: "广播通知" },
      task_intervene: { type: "warning", label: "任务介入" },
      send_notification: { type: "info", label: "发送通知" },
      config_update: { type: "warning", label: "配置更新" },
      student_data_export: { type: "info", label: "数据导出" },
      tag_update: { type: "info", label: "标签更新" },
    };
    return map[action] || { type: "info", label: action.replace(/_/g, " ") };
  };

  return (
    <AdminLayout
      title="📋 操作日志"
      subtitle="所有管理员操作均不可删除、不可修改"
    >
      {/* 统计卡片 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { label: "总操作数", value: logs.length, icon: "📝", color: "#3B82F6" },
          { label: "今日操作", value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, icon: "📅", color: "#10B981" },
          { label: "活跃管理员", value: new Set(logs.map(l => l.admin_id)).size, icon: "👥", color: "#F59E0B" },
          { label: "高危操作", value: logs.filter(l => ["task_takedown", "company_blacklist"].includes(l.action)).length, icon: "⚠️", color: "#EF4444" }
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

      {/* 日志列表 */}
      {loading && page === 1 ? (
        <LoadingSkeleton count={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" message="暂无操作记录" />
      ) : (
        <>
          <Table headers={["操作类型", "管理员", "目标", "说明", "操作时间"]}>
            {logs.map((log) => {
              const actionInfo = getActionInfo(log.action);
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <StatusBadge status={actionInfo.type} label={actionInfo.label} />
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: "700"
                      }}>
                        {log.admin_nickname.charAt(0)}
                      </div>
                      <span style={{ fontWeight: "600" }}>{log.admin_nickname}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div style={{ fontSize: "12px", color: "#8E96A5" }}>
                        {log.target_type}
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: "#6B7280",
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        #{log.target_id?.slice(0, 8)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#8E96A5",
                      fontSize: "13px"
                    }}>
                      {log.note || "-"}
                    </div>
                  </TableCell>
                  <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                    {new Date(log.created_at).toLocaleString("zh-CN")}
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>

          {hasMore && (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button
                onClick={() => { const next = page + 1; setPage(next); load(next); }}
                disabled={loading}
                style={{
                  padding: "12px 32px",
                  borderRadius: "12px",
                  background: loading ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: loading ? "#6B7280" : "#F1F5F9",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
              >
                {loading ? "加载中..." : "加载更多"}
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
