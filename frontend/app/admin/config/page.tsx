"use client";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, Button, EmptyState, LoadingSkeleton } from "@/components/admin/AdminLayout";

interface ConfigEntry {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    adminApi.getConfig()
      .then(({ data }) => setConfigs(data.data || []))
      .catch(() => show("加载失败（需要超级管理员权限）", "error"))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (cfg: ConfigEntry) => {
    setEditing(cfg.key);
    setEditValue(typeof cfg.value === "object" ? JSON.stringify(cfg.value, null, 2) : String(cfg.value));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(editValue); }
      catch { parsed = editValue; }
      await adminApi.updateConfig(key, parsed);
      show("配置已更新", "success");
      setConfigs((cs) => cs.map((c) => c.key === key ? { ...c, value: parsed } : c));
      setEditing(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "更新失败", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="⚙️ 系统配置"
      subtitle="仅超级管理员可访问 · 所有修改记入操作日志"
    >
      {/* 警告提示 */}
      <Card style={{
        padding: "16px 20px",
        marginBottom: "24px",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#EF4444", marginBottom: "4px" }}>
              高危操作区域
            </div>
            <div style={{ fontSize: "12px", color: "#F87171" }}>
              修改系统配置可能影响平台运行，请谨慎操作。所有修改都会被记录到操作日志中。
            </div>
          </div>
        </div>
      </Card>

      {/* 配置列表 */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : configs.length === 0 ? (
        <EmptyState icon="⚙️" message="暂无配置项" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {configs.map((cfg) => (
            <Card key={cfg.key} style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "24px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 配置键名 */}
                  <div style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "rgba(59, 130, 246, 0.15)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    marginBottom: "12px"
                  }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#3B82F6",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {cfg.key}
                    </span>
                  </div>

                  {/* 配置描述 */}
                  {cfg.description && (
                    <p style={{
                      fontSize: "13px",
                      color: "#8E96A5",
                      marginBottom: "16px",
                      lineHeight: "1.6"
                    }}>
                      {cfg.description}
                    </p>
                  )}

                  {/* 配置值 */}
                  {editing === cfg.key ? (
                    <textarea
                      style={{
                        width: "100%",
                        height: "120px",
                        resize: "vertical",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(59, 130, 246, 0.5)",
                        color: "#F1F5F9",
                        fontSize: "13px",
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: "none",
                        lineHeight: "1.6"
                      }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                  ) : (
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}>
                      <pre style={{
                        fontSize: "13px",
                        color: "#10B981",
                        fontFamily: "'JetBrains Mono', monospace",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all"
                      }}>
                        {typeof cfg.value === "object" ? JSON.stringify(cfg.value, null, 2) : String(cfg.value)}
                      </pre>
                    </div>
                  )}

                  {/* 更新时间 */}
                  <p style={{
                    fontSize: "11px",
                    color: "#6B7280",
                    marginTop: "12px",
                    marginBottom: 0
                  }}>
                    最后更新：{new Date(cfg.updated_at).toLocaleString("zh-CN")}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  {editing === cfg.key ? (
                    <>
                      <Button loading={saving} onClick={() => handleSave(cfg.key)}>
                        保存
                      </Button>
                      <Button variant="secondary" onClick={() => setEditing(null)}>
                        取消
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={() => startEdit(cfg)}>
                      编辑
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
