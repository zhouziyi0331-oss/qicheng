"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface Mentor {
  id: string;
  name: string;
  title: string;
  expertise: string;
  rating: number;
  session_count: number;
  total_hours: number;
  status: string;
  created_at: string;
}

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    fetch(`/api/v1/admin/mentors`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.list) setMentors(data.list);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredMentors = mentors.filter(m =>
    m.name.includes(search) || m.expertise.includes(search)
  );

  return (
    <AdminLayout
      title="👨‍🏫 导师管理"
      subtitle={`共 ${mentors.length} 位导师`}
      actions={
        <Button onClick={() => show("添加导师功能开发中", "info")}>
          ➕ 添加导师
        </Button>
      }
    >
      {/* 搜索 */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ flex: 1, maxWidth: "400px" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索导师姓名或专长..."
          />
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
          { label: "总导师数", value: mentors.length, icon: "👨‍🏫", color: "#3B82F6" },
          { label: "活跃导师", value: mentors.filter(m => m.status === "active").length, icon: "⚡", color: "#10B981" },
          { label: "总咨询次数", value: mentors.reduce((sum, m) => sum + m.session_count, 0), icon: "💬", color: "#F59E0B" },
          { label: "总咨询时长", value: `${mentors.reduce((sum, m) => sum + m.total_hours, 0)}h`, icon: "⏱️", color: "#8B5CF6" }
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

      {/* 导师列表 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : filteredMentors.length === 0 ? (
        <EmptyState icon="👨‍🏫" message="暂无导师数据" />
      ) : (
        <Table headers={["导师", "职称", "专长", "评分", "咨询次数", "总时长", "状态", "操作"]}>
          {filteredMentors.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "700"
                  }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: "600" }}>{m.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                {m.title}
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
                  {m.expertise}
                </span>
              </TableCell>
              <TableCell>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ color: "#F59E0B", fontSize: "16px" }}>⭐</span>
                  <span style={{
                    fontWeight: "700",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {m.rating.toFixed(1)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "600"
                }}>
                  {m.session_count}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "600",
                  color: "#10B981"
                }}>
                  {m.total_hours}h
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={m.status === "active" ? "success" : "warning"}
                  label={m.status === "active" ? "活跃" : "休息中"}
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/mentors/${m.id}`}
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
          ))}
        </Table>
      )}
    </AdminLayout>
  );
}
