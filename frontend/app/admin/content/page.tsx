"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, SearchInput, Button, StatusBadge, Table, TableRow, TableCell, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface Content {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.append("type", typeFilter);

    fetch(`/api/v1/admin/content?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.list) setContents(data.list);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter]);

  const getTypeInfo = (type: string) => {
    const map: Record<string, { icon: string; label: string; color: string }> = {
      opc_story: { icon: "📖", label: "OPC故事", color: "#3B82F6" },
      news: { icon: "📰", label: "公告", color: "#10B981" },
      banner: { icon: "🎨", label: "横幅广告", color: "#F59E0B" },
    };
    return map[type] || { icon: "📄", label: type, color: "#8B5CF6" };
  };

  return (
    <AdminLayout
      title="📝 内容管理"
      subtitle={`共 ${contents.length} 条内容`}
      actions={
        <Button onClick={() => show("创建内容功能开发中", "info")}>
          ➕ 创建内容
        </Button>
      }
    >
      {/* 类型筛选 */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px" }}>
        {[
          { value: "all", label: "全部" },
          { value: "opc_story", label: "OPC故事" },
          { value: "news", label: "公告" },
          { value: "banner", label: "横幅广告" }
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => setTypeFilter(type.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: typeFilter === type.value ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              border: typeFilter === type.value ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
              color: typeFilter === type.value ? "#3B82F6" : "#8E96A5",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {type.label}
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
          { label: "总内容数", value: contents.length, icon: "📝", color: "#3B82F6" },
          { label: "OPC故事", value: contents.filter(c => c.type === "opc_story").length, icon: "📖", color: "#10B981" },
          { label: "公告", value: contents.filter(c => c.type === "news").length, icon: "📰", color: "#F59E0B" },
          { label: "总浏览量", value: contents.reduce((sum, c) => sum + c.views, 0).toLocaleString(), icon: "👁️", color: "#8B5CF6" }
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

      {/* 内容列表 */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : contents.length === 0 ? (
        <EmptyState icon="📝" message="暂无内容数据" />
      ) : (
        <Table headers={["标题", "类型", "状态", "浏览量", "创建时间", "更新时间", "操作"]}>
          {contents.map((c) => {
            const typeInfo = getTypeInfo(c.type);
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: `${typeInfo.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      {typeInfo.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", maxWidth: "300px" }}>{c.title}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: `${typeInfo.color}20`,
                    color: typeInfo.color,
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {typeInfo.label}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={c.status === "published" ? "success" : "warning"}
                    label={c.status === "published" ? "已发布" : "草稿"}
                  />
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "16px" }}>👁️</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: "600"
                    }}>
                      {c.views.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                  {new Date(c.created_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell style={{ color: "#8E96A5", fontSize: "13px" }}>
                  {new Date(c.updated_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => show("编辑功能开发中", "info")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(59,130,246,0.15)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        color: "#3B82F6",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("确定要删除这条内容吗？")) {
                          show("删除功能开发中", "info");
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#EF4444",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      删除
                    </button>
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
