"use client";
import { useState, useEffect, use } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, StatusBadge, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface StudentDetail {
  id: string;
  nickname: string;
  phone: string;
  university: string;
  city: string;
  major: string;
  grade: string;
  opc_label: string;
  opc_label_secondary: string;
  level_a: number;
  level_b: number;
  six_dim_scores: Record<string, number>;
  task_count: number;
  total_earnings: number;
  balance: number;
  graduated_at: string | null;
  created_at: string;
  test_results: Array<{ created_at: string; opc_label: string }>;
  tasks: Array<{ title: string; status: string; budget_net: number; created_at: string }>;
}

const DIM_NAMES: Record<string, string> = {
  d1: "专业技能", d2: "执行力", d3: "工具掌握", d4: "需求理解", d5: "时间管理", d6: "交付水平",
};
const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师"];

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    adminApi.getStudentDetail(id)
      .then(({ data }) => setStudent(data.data))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="学生详情" subtitle="加载中...">
        <LoadingSkeleton count={3} />
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout title="学生详情" subtitle="学生不存在">
        <EmptyState icon="🎓" message="学生不存在" />
      </AdminLayout>
    );
  }

  const getTaskStatusInfo = (status: string) => {
    const map: Record<string, { type: "success" | "warning" | "error" | "info"; label: string }> = {
      completed: { type: "success", label: "已完成" },
      accepted: { type: "info", label: "进行中" },
      pending: { type: "warning", label: "待接单" },
      cancelled: { type: "error", label: "已取消" },
    };
    return map[status] || { type: "info", label: status };
  };

  return (
    <AdminLayout
      title={`🎓 ${student.nickname}`}
      subtitle={`学生编号: ${id.substring(0, 8)}...`}
      backLink="/admin/students"
    >
      {/* 头部信息卡片 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {[
          { label: "完成任务", value: student.task_count ?? 0, icon: "✅", color: "#3B82F6" },
          { label: "累计收入", value: `¥${(student.total_earnings ?? 0).toFixed(0)}`, icon: "💰", color: "#10B981" },
          { label: "当前余额", value: `¥${(student.balance ?? 0).toFixed(0)}`, icon: "💳", color: "#F59E0B" },
          { label: "等级", value: `Lv.${student.level_a ?? 0} ${LEVEL_NAMES[student.level_a ?? 0]}`, icon: "⭐", color: "#8B5CF6" }
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

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "24px",
        marginBottom: "24px"
      }}>
        {/* 基本信息 */}
        <Card style={{ padding: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              📋
            </div>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#F1F5F9",
              margin: 0
            }}>
              基本信息
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              ["手机", student.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")],
              ["学校", student.university || "—"],
              ["城市", student.city || "—"],
              ["专业", student.major || "—"],
              ["年级", student.grade || "—"],
              ["注册时间", new Date(student.created_at).toLocaleDateString("zh-CN")],
              ["毕业时间", student.graduated_at ? new Date(student.graduated_at).toLocaleDateString("zh-CN") : "未毕业"],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)"
              }}>
                <span style={{ fontSize: "13px", color: "#8E96A5", fontWeight: "600" }}>{k}</span>
                <span style={{ fontSize: "13px", color: "#F1F5F9", fontWeight: "600" }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* OPC标签 */}
        <Card style={{ padding: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              🏷️
            </div>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#F1F5F9",
              margin: 0
            }}>
              OPC标签
            </h2>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {student.opc_label && (
              <div style={{
                padding: "8px 16px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)"
              }}>
                <div style={{ fontSize: "11px", color: "#8E96A5", marginBottom: "2px" }}>主标签</div>
                <div style={{ fontSize: "14px", color: "#3B82F6", fontWeight: "700" }}>{student.opc_label}</div>
              </div>
            )}
            {student.opc_label_secondary && (
              <div style={{
                padding: "8px 16px",
                borderRadius: "10px",
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)"
              }}>
                <div style={{ fontSize: "11px", color: "#8E96A5", marginBottom: "2px" }}>副标签</div>
                <div style={{ fontSize: "14px", color: "#8B5CF6", fontWeight: "700" }}>{student.opc_label_secondary}</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 六维能力 */}
      {student.six_dim_scores && Object.keys(student.six_dim_scores).length > 0 && (
        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              📊
            </div>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#F1F5F9",
              margin: 0
            }}>
              六维能力画像
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            {Object.entries(student.six_dim_scores).map(([k, v]) => (
              <div key={k}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <span style={{ fontSize: "13px", color: "#8E96A5", fontWeight: "600" }}>
                    {DIM_NAMES[k] || k}
                  </span>
                  <span style={{
                    fontSize: "14px",
                    color: "#3B82F6",
                    fontWeight: "700",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {v}
                  </span>
                </div>
                <div style={{
                  height: "8px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(v, 100)}%`,
                    background: "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)",
                    borderRadius: "10px",
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 任务历史 */}
      {student.tasks && student.tasks.length > 0 && (
        <Card style={{ padding: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              📝
            </div>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#F1F5F9",
              margin: 0
            }}>
              任务历史 ({student.tasks.length})
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {student.tasks.map((t, i) => {
              const statusInfo = getTaskStatusInfo(t.status);
              return (
                <div key={i} style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px"
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#F1F5F9",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#8E96A5" }}>
                      {new Date(t.created_at).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <span style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#10B981",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      ¥{t.budget_net}
                    </span>
                    <StatusBadge status={statusInfo.type} label={statusInfo.label} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
