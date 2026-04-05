"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";

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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-lg animate-pulse mb-4" style={{ background: "#161b22" }} />
        ))}
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "#484f58" }}>
        <p>学生不存在</p>
        <Link href="/admin/students" className="text-sm mt-3 block" style={{ color: "#58a6ff" }}>← 返回列表</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/students" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 学生数据</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>{student.nickname}</h1>
        {student.opc_label && <Badge color="blue">{student.opc_label}</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 基本信息 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>基本信息</h3>
          {[
            ["手机", student.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")],
            ["学校", student.university || "—"],
            ["城市", student.city || "—"],
            ["专业", student.major || "—"],
            ["年级", student.grade || "—"],
            ["注册时间", new Date(student.created_at).toLocaleDateString("zh-CN")],
            ["毕业时间", student.graduated_at ? new Date(student.graduated_at).toLocaleDateString("zh-CN") : "未毕业"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: "#21262d" }}>
              <span className="text-xs" style={{ color: "#484f58" }}>{k}</span>
              <span className="text-xs" style={{ color: "#e6edf3" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* OPC & 等级 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>OPC & 等级</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {student.opc_label && <Badge color="blue">主标签：{student.opc_label}</Badge>}
            {student.opc_label_secondary && <Badge color="gray">副标签：{student.opc_label_secondary}</Badge>}
            {student.level_a != null && (
              <Badge color="gray">赛道A：Lv.{student.level_a} {LEVEL_NAMES[student.level_a]}</Badge>
            )}
          </div>
          {student.six_dim_scores && (
            <div className="flex flex-col gap-2">
              {Object.entries(student.six_dim_scores).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: "#8b949e" }}>{DIM_NAMES[k] || k}</span>
                    <span style={{ color: "#58a6ff" }}>{v}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#21262d" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(v, 100)}%`, background: "#58a6ff" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 收入统计 */}
      <div className="p-5 rounded-lg mb-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>收入统计</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "完成任务", value: student.task_count ?? 0, color: "#e6edf3" },
            { label: "累计收入", value: `¥${(student.total_earnings ?? 0).toFixed(0)}`, color: "#3fb950" },
            { label: "当前余额", value: `¥${(student.balance ?? 0).toFixed(0)}`, color: "#58a6ff" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: "#21262d" }}>
              <div className="text-xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#8b949e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 任务历史 */}
      {student.tasks && student.tasks.length > 0 && (
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>任务历史</h3>
          <div className="flex flex-col gap-2">
            {student.tasks.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: "#21262d" }}>
                <p className="text-sm flex-1 truncate" style={{ color: "#e6edf3" }}>{t.title}</p>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium" style={{ color: "#3fb950" }}>¥{t.budget_net}</span>
                  <Badge color={t.status === "completed" ? "green" : "gray"}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
