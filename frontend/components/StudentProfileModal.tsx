"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

interface StudentProfile {
  id: string;
  nickname: string; // 匿名化：学生A、学生B
  opc_label: string;
  level: number;
  task_count: number;
  abilities: {
    d1: number;
    d2: number;
    d3: number;
    d4: number;
    d5: number;
    d6: number;
  };
  tags: string[];
}

export default function StudentProfileModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    taskApi.getStudentProfile(studentId)
      .then(({ data }) => setProfile(data.data))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, [studentId]);

  const chartData = profile ? [
    { subject: "专业技能", value: profile.abilities.d1 },
    { subject: "执行力", value: profile.abilities.d2 },
    { subject: "工具掌握", value: profile.abilities.d3 },
    { subject: "需求理解", value: profile.abilities.d4 },
    { subject: "时间管理", value: profile.abilities.d5 },
    { subject: "交付水平", value: profile.abilities.d6 },
  ] : [];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-center" style={{ color: "#636E72" }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="float-right text-2xl leading-none"
          style={{ color: "#B2BEC3" }}
        >
          ×
        </button>

        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#2D3436" }}>
            {profile.nickname}
          </h2>
          <div className="flex items-center gap-2">
            <Badge color="blue">{profile.opc_label}</Badge>
            <Badge color="gray">Lv.{profile.level}</Badge>
            <span className="text-sm" style={{ color: "#636E72" }}>
              已完成 {profile.task_count} 个任务
            </span>
          </div>
        </div>

        {/* 能力雷达图 */}
        <div className="mb-6 p-6 rounded-2xl" style={{ background: "#F9F7F5" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>
            六维能力分析
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="#E5D4E8" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#636E72", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E5D4E8", color: "#2D3436", fontSize: 12 }}
              />
              <Radar
                dataKey="value"
                stroke="#EC4899"
                fill="#F9C6D9"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 能力标签 */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#2D3436" }}>
              能力标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#F9C6D9", color: "#2D3436" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 提示 */}
        <div className="p-4 rounded-2xl text-sm" style={{ background: "#FFF3CD", border: "1px solid #FFE69C", color: "#856404" }}>
          🔒 为保护学生隐私，此处仅显示匿名能力画像。完成2单后可解锁联系方式。
        </div>
      </div>
    </div>
  );
}
