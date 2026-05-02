"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface Company {
  id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  industry: string;
  verification_status: string;
  task_count: number;
  balance: number;
  created_at: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("keyword", search);
    if (statusFilter !== "all") params.append("status", statusFilter);

    fetch(`/api/v1/admin/companies?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.list) setCompanies(data.list);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const getStatusInfo = (status: string) => {
    const map: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
      pending: { type: "warning", label: "待审核" },
      verified: { type: "success", label: "已认证" },
      rejected: { type: "error", label: "已拒绝" },
    };
    return map[status] || { type: "info", label: status };
  };

  return (
    <AdminLayout
      title="🏢 企业管理"
      subtitle={`共 ${companies.length} 家企业`}
      actions={
        <Button onClick={() => show("导出功能开发中", "info")}>
          📥 导出数据
        </Button>
      }
    >
      {/* 筛选和搜索 */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ flex: 1, maxWidth: "400px" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索企业名称或联系人..."
          />
        </div>
        <Button variant="secondary" onClick={load}>
          🔍 搜索
        </Button>

        {/* 状态筛选 */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: "all", label: "全部" },
            { value: "pending", label: "待审核" },
            { value: "verified", label: "已认证" },
            { value: "rejected", label: "已拒绝" }
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
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { label: "总企业数", value: companies.length, icon: "🏢", color: "#3B82F6" },
          { label: "已认证", value: companies.filter(c => c.verification_status === "verified").length, icon: "✅", color: "#10B981" },
          { label: "待审核", value: companies.filter(c => c.verification_status === "pending").length, icon: "⏳", color: "#F59E0B" },
          { label: "总任务数", value: companies.reduce((sum, c) => sum + c.task_count, 0), icon: "📋", color: "#8B5CF6" }
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

      {/* 企业列表 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : companies.length === 0 ? (
        <EmptyState icon="🏢" message="暂无企业数据" />
      ) : (
        <Table headers={["企业", "行业", "认证状态", "任务数", "余额", "注册时间", "操作"]}>
          {companies.map((c) => {
            const statusInfo = getStatusInfo(c.verification_status);
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "700"
                    }}>
                      {c.company_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "2px" }}>{c.company_name}</div>
                      <div style={{ fontSize: "12px", color: "#8E96A5" }}>
                        {c.contact_name} · {c.contact_phone}
                      </div>
                    </div>
                  </div>
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
                    {c.industry || "未分类"}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusInfo.type} label={statusInfo.label} />
                </TableCell>
                <TableCell>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: "600"
                  }}>
                    {c.task_count}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{
                    color: "#10B981",
                    fontWeight: "700",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    ¥{c.balance || 0}
                  </span>
                </TableCell>
                <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                  {new Date(c.created_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/companies/${c.id}`}
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(59,130,246,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(59,130,246,0.15)";
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
