"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface AILog {
  id: string;
  user_type: string;
  user_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
  created_at: string;
}

interface AIStats {
  total_calls: number;
  total_tokens: number;
  total_cost: number;
  avg_tokens_per_call: number;
}

export default function AdminAIPage() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("7d");
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/v1/admin/ai/logs?period=${dateFilter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      }).then(res => res.json()),
      fetch(`/api/v1/admin/ai/stats?period=${dateFilter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      }).then(res => res.json())
    ])
      .then(([logsData, statsData]) => {
        if (logsData.list) setLogs(logsData.list);
        if (statsData.data) setStats(statsData.data);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [dateFilter]);

  return (
    <AdminLayout
      title="🤖 AI引擎管理"
      subtitle="监控AI调用和成本"
      actions={
        <Button onClick={() => show("导出功能开发中", "info")}>
          📥 导出数据
        </Button>
      }
    >
      {/* 时间筛选 */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px" }}>
        {[
          { value: "1d", label: "今天" },
          { value: "7d", label: "近7天" },
          { value: "30d", label: "近30天" },
          { value: "all", label: "全部" }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setDateFilter(period.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: dateFilter === period.value ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              border: dateFilter === period.value ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
              color: dateFilter === period.value ? "#3B82F6" : "#8E96A5",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          {[
            { label: "总调用次数", value: stats.total_calls, icon: "📞", color: "#3B82F6" },
            { label: "总令牌数", value: stats.total_tokens.toLocaleString(), icon: "🔢", color: "#10B981" },
            { label: "总成本", value: `¥${stats.total_cost.toFixed(2)}`, icon: "💰", color: "#F59E0B" },
            { label: "平均令牌/次", value: Math.round(stats.avg_tokens_per_call), icon: "📊", color: "#8B5CF6" }
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
      )}

      {/* AI调用日志 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon="🤖" message="暂无AI调用记录" />
      ) : (
        <Table headers={["用户类型", "用户编号", "模型", "输入令牌", "输出令牌", "总令牌", "成本", "调用时间"]}>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <StatusBadge
                  status={log.user_type === "student" ? "info" : "warning"}
                  label={log.user_type === "student" ? "学生" : "企业"}
                />
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: "#8E96A5"
                }}>
                  {log.user_id.substring(0, 8)}...
                </span>
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
                  {log.model}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "600"
                }}>
                  {log.prompt_tokens.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "600"
                }}>
                  {log.completion_tokens.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "700",
                  color: "#3B82F6"
                }}>
                  {(log.prompt_tokens + log.completion_tokens).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  color: "#F59E0B",
                  fontWeight: "700",
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  ¥{log.total_cost.toFixed(4)}
                </span>
              </TableCell>
              <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                {new Date(log.created_at).toLocaleString('zh-CN')}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </AdminLayout>
  );
}
