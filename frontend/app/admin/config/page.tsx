"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>系统配置</h1>
      </div>
      <p className="text-xs mb-6" style={{ color: "#484f58" }}>仅超级管理员可访问 · 所有修改记入操作日志</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {configs.map((cfg) => (
            <div key={cfg.key} className="p-4 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-mono" style={{ color: "#58a6ff" }}>{cfg.key}</p>
                  {cfg.description && (
                    <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>{cfg.description}</p>
                  )}
                  {editing === cfg.key ? (
                    <textarea
                      className="w-full mt-2 h-24 resize-none p-2 rounded text-xs font-mono"
                      style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                  ) : (
                    <p className="text-xs mt-1 font-mono truncate" style={{ color: "#e6edf3" }}>
                      {typeof cfg.value === "object" ? JSON.stringify(cfg.value) : String(cfg.value)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {editing === cfg.key ? (
                    <>
                      <Button size="sm" loading={saving} onClick={() => handleSave(cfg.key)}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>取消</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => startEdit(cfg)}>编辑</Button>
                  )}
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: "#484f58" }}>
                最后更新：{new Date(cfg.updated_at).toLocaleString("zh-CN")}
              </p>
            </div>
          ))}
          {configs.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: "#484f58" }}>暂无配置项</p>
          )}
        </div>
      )}
    </div>
  );
}
