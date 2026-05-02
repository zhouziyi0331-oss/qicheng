"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface Student {
  id: string;
  nickname: string;
  phone: string;
  university: string;
  opc_label: string;
  level_a: number;
  task_count: number;
  balance: number;
  created_at: string;
}

const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师"];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    adminApi.listStudents(1, search || undefined)
      .then(({ data }) => setStudents(data.data || []))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredStudents = students.filter(s =>
    levelFilter === "all" || s.level_a === parseInt(levelFilter)
  );

  return (
    <AdminLayout
      title="👨‍🎓 学生管理"
      subtitle={`共 ${students.length} 名学生`}
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
            placeholder="搜索学生姓名或手机号..."
          />
        </div>
        <Button variant="secondary" onClick={load}>
          🔍 搜索
        </Button>

        {/* 等级筛选 */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setLevelFilter("all")}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: levelFilter === "all" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              border: levelFilter === "all" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
              color: levelFilter === "all" ? "#3B82F6" : "#8E96A5",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            全部
          </button>
          {LEVEL_NAMES.map((name, idx) => (
            <button
              key={idx}
              onClick={() => setLevelFilter(idx.toString())}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                background: levelFilter === idx.toString() ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
                border: levelFilter === idx.toString() ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: levelFilter === idx.toString() ? "#3B82F6" : "#8E96A5",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {name}
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
          { label: "总学生数", value: students.length, icon: "👥", color: "#3B82F6" },
          { label: "活跃学生", value: students.filter(s => s.task_count > 0).length, icon: "⚡", color: "#10B981" },
          { label: "高级以上", value: students.filter(s => s.level_a >= 3).length, icon: "🏆", color: "#F59E0B" },
          { label: "平均任务数", value: Math.round(students.reduce((sum, s) => sum + s.task_count, 0) / students.length || 0), icon: "📊", color: "#8B5CF6" }
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

      {/* 学生列表 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState icon="👨‍🎓" message="暂无学生数据" />
      ) : (
        <Table headers={["学生", "等级", "OPC标签", "任务数", "余额", "注册时间", "操作"]}>
          {filteredStudents.map((s) => (
            <TableRow key={s.id}>
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
                    {s.nickname.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "2px" }}>{s.nickname}</div>
                    <div style={{ fontSize: "12px", color: "#8E96A5" }}>{s.phone}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={s.level_a >= 4 ? "success" : s.level_a >= 2 ? "info" : "warning"}
                  label={LEVEL_NAMES[s.level_a] || "未知"}
                />
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
                  {s.opc_label || "未标记"}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "600"
                }}>
                  {s.task_count}
                </span>
              </TableCell>
              <TableCell>
                <span style={{
                  color: "#10B981",
                  fontWeight: "700",
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  ¥{s.balance || 0}
                </span>
              </TableCell>
              <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                {new Date(s.created_at).toLocaleDateString('zh-CN')}
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/students/${s.id}`}
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
          ))}
        </Table>
      )}
    </AdminLayout>
  );
}
