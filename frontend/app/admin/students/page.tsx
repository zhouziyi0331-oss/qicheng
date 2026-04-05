"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";

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
  const [query, setQuery] = useState("");
  const { show } = useToast();

  const load = (q: string) => {
    setLoading(true);
    adminApi.listStudents(1, q || undefined)
      .then(({ data }) => setStudents(data.data || []))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(""); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>学生数据</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setQuery(search), load(search))}
          placeholder="搜索昵称 / 手机号 / 学校..."
          className="flex-1 p-2.5 rounded-lg text-sm"
          style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
        />
        <button
          onClick={() => { setQuery(search); load(search); }}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}
        >
          搜索
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #30363d" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                {["昵称", "学校", "OPC标签", "等级", "完成任务", "余额", "注册时间"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "#8b949e" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    background: i % 2 === 0 ? "#161b22" : "#0d1117",
                    borderBottom: "1px solid #21262d",
                  }}
                >
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/students/${s.id}`} className="no-underline" style={{ color: "#58a6ff" }}>
                      {s.nickname}
                    </Link>
                    <p className="text-xs" style={{ color: "#484f58" }}>{s.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</p>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "#8b949e" }}>{s.university || "—"}</td>
                  <td className="px-3 py-2.5">
                    {s.opc_label ? <Badge color="blue">{s.opc_label}</Badge> : <span style={{ color: "#484f58" }}>未测试</span>}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "#8b949e" }}>
                    {s.level_a != null ? `Lv.${s.level_a} ${LEVEL_NAMES[s.level_a]}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center" style={{ color: "#e6edf3" }}>{s.task_count ?? 0}</td>
                  <td className="px-3 py-2.5" style={{ color: "#3fb950" }}>¥{(s.balance ?? 0).toFixed(0)}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "#484f58" }}>
                    {new Date(s.created_at).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-sm" style={{ color: "#484f58" }}>
                    {query ? `没有找到「${query}」` : "暂无学生数据"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
