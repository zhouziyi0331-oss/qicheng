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
    <div style={{ minHeight: "100vh", background: "#F9F7F5" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-sm no-underline hover:opacity-70 transition-opacity" style={{ color: "#636E72" }}>
            ← 返回后台
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#2D3436" }}>学生数据</h1>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setQuery(search), load(search))}
            placeholder="搜索昵称 / 手机号 / 学校..."
            className="flex-1 px-4 py-3 rounded-2xl text-sm"
            style={{ background: "#FFFFFF", border: "1px solid #DFE6E9", color: "#2D3436" }}
          />
          <button
            onClick={() => { setQuery(search); load(search); }}
            className="px-6 py-3 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: "#FF6B35", color: "#FFFFFF" }}
          >
            搜索
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-3xl animate-pulse" style={{ background: "#FFFFFF" }} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: "#FFFFFF" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F9F7F5", borderBottom: "1px solid #DFE6E9" }}>
                  {["昵称", "学校", "OPC标签", "等级", "完成任务", "余额", "注册时间"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-xs font-semibold" style={{ color: "#636E72" }}>
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
                      background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                      borderBottom: "1px solid #F0F0F0",
                    }}
                  >
                    <td className="px-4 py-4">
                      <Link href={`/admin/students/${s.id}`} className="no-underline font-medium hover:opacity-70 transition-opacity" style={{ color: "#0984E3" }}>
                        {s.nickname}
                      </Link>
                      <p className="text-xs mt-1" style={{ color: "#B2BEC3" }}>{s.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</p>
                    </td>
                    <td className="px-4 py-4" style={{ color: "#636E72" }}>{s.university || "—"}</td>
                    <td className="px-4 py-4">
                      {s.opc_label ? <Badge color="blue">{s.opc_label}</Badge> : <span style={{ color: "#B2BEC3" }}>未测试</span>}
                    </td>
                    <td className="px-4 py-4" style={{ color: "#636E72" }}>
                      {s.level_a != null ? `Lv.${s.level_a} ${LEVEL_NAMES[s.level_a]}` : "—"}
                    </td>
                    <td className="px-4 py-4 text-center font-medium" style={{ color: "#2D3436" }}>{s.task_count ?? 0}</td>
                    <td className="px-4 py-4 font-semibold" style={{ color: "#00B894" }}>¥{(s.balance ?? 0).toFixed(0)}</td>
                    <td className="px-4 py-4 text-xs" style={{ color: "#B2BEC3" }}>
                      {new Date(s.created_at).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-sm" style={{ color: "#B2BEC3" }}>
                      {query ? `没有找到「${query}」` : "暂无学生数据"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
