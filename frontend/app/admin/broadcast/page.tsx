"use client";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, Button } from "@/components/admin/AdminLayout";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [roles, setRoles] = useState<string[]>(["student", "company"]);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const toggleRole = (role: string) => {
    setRoles((rs) => rs.includes(role) ? rs.filter((r) => r !== role) : [...rs, role]);
  };

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) return show("请填写标题和内容", "error");
    if (roles.length === 0) return show("请选择至少一个目标用户组", "error");
    const confirmed = window.confirm(`确认向 ${roles.join("、")} 发送广播通知？`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await adminApi.broadcast(title.trim(), body.trim(), roles);
      show("广播发送成功", "success");
      setTitle("");
      setBody("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "发送失败", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="📢 通知推送"
      subtitle="向所有用户或特定用户组发送广播通知"
    >
      {/* 警告提示 */}
      <Card style={{
        padding: "16px 20px",
        marginBottom: "24px",
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#F59E0B", marginBottom: "4px" }}>
              广播通知注意事项
            </div>
            <div style={{ fontSize: "12px", color: "#FBBF24" }}>
              广播通知将发送给所有符合条件的用户，操作不可撤销，且会写入管理员日志。请谨慎使用。
            </div>
          </div>
        </div>
      </Card>

      {/* 广播表单 */}
      <Card style={{ padding: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* 通知标题 */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              color: "#8E96A5",
              fontWeight: "600",
              marginBottom: "8px"
            }}>
              通知标题 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：平台维护通知"
              maxLength={100}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F1F5F9",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                e.currentTarget.style.background = "rgba(0,0,0,0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(0,0,0,0.2)";
              }}
            />
            <div style={{
              fontSize: "11px",
              color: "#6B7280",
              marginTop: "6px",
              textAlign: "right"
            }}>
              {title.length}/100
            </div>
          </div>

          {/* 通知内容 */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              color: "#8E96A5",
              fontWeight: "600",
              marginBottom: "8px"
            }}>
              通知内容 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="通知正文..."
              style={{
                width: "100%",
                height: "160px",
                resize: "vertical",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F1F5F9",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                transition: "all 0.2s",
                lineHeight: "1.6"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                e.currentTarget.style.background = "rgba(0,0,0,0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(0,0,0,0.2)";
              }}
            />
          </div>

          {/* 目标用户组 */}
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              color: "#8E96A5",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              目标用户组 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { value: "student", label: "学生", icon: "🎓", color: "#3B82F6" },
                { value: "company", label: "企业", icon: "🏢", color: "#10B981" },
              ].map((opt) => {
                const isSelected = roles.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      background: isSelected ? `${opt.color}20` : "rgba(255,255,255,0.03)",
                      border: `2px solid ${isSelected ? opt.color : "rgba(255,255,255,0.1)"}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      userSelect: "none"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRole(opt.value)}
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        accentColor: opt.color
                      }}
                    />
                    <span style={{ fontSize: "24px" }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: isSelected ? opt.color : "#F1F5F9"
                      }}>
                        {opt.label}
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: "#8E96A5",
                        marginTop: "2px"
                      }}>
                        {opt.value === "student" ? "所有学生用户" : "所有企业用户"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 预览区域 */}
          {(title || body) && (
            <div>
              <label style={{
                display: "block",
                fontSize: "13px",
                color: "#8E96A5",
                fontWeight: "600",
                marginBottom: "12px"
              }}>
                通知预览
              </label>
              <div style={{
                padding: "20px",
                borderRadius: "12px",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)"
              }}>
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
                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px"
                  }}>
                    📢
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#F1F5F9",
                      marginBottom: "4px"
                    }}>
                      {title || "通知标题"}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#8E96A5"
                    }}>
                      系统通知 · 刚刚
                    </div>
                  </div>
                </div>
                <p style={{
                  fontSize: "14px",
                  color: "#D1D5DB",
                  lineHeight: "1.6",
                  margin: 0
                }}>
                  {body || "通知内容"}
                </p>
              </div>
            </div>
          )}

          {/* 发送按钮 */}
          <Button
            loading={loading}
            onClick={handleBroadcast}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "700"
            }}
          >
            {loading ? "发送中..." : `发送广播通知给 ${roles.length === 0 ? "无" : roles.map(r => r === "student" ? "学生" : "企业").join(" 和 ")}`}
          </Button>
        </div>
      </Card>
    </AdminLayout>
  );
}
