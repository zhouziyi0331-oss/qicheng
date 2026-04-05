"use client";
import { useState, useEffect } from "react";
import { abilityApi, reportApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  is_milestone: boolean;
  created_at: string;
}

interface RadarData {
  d1: number; d2: number; d3: number; d4: number; d5: number; d6: number;
  labels: string[];
}

const EVENT_ICONS: Record<string, string> = {
  journey_start: "🚀",
  task_completed: "✅",
  first_task_completed: "🎉",
  test_completed: "🧠",
  level_up: "⬆️",
  contact_unlocked: "🤝",
};

export default function AbilityPage() {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [radarLocked, setRadarLocked] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [reports, setReports] = useState<Array<{ type: string; name: string; status: string; preview: { blurredHint: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    Promise.allSettled([
      abilityApi.radar(),
      abilityApi.timeline(),
      reportApi.list(),
    ]).then(([r, t, rep]) => {
      if (r.status === "fulfilled") {
        setRadarData(r.value.data.data);
      } else {
        const code = (r.reason as { response?: { data?: { code?: string } } })?.response?.data?.code;
        if (code === "LOCKED") setRadarLocked(true);
      }
      if (t.status === "fulfilled") setEvents(t.value.data.data?.events || []);
      if (rep.status === "fulfilled") setReports(rep.value.data.data || []);
    }).catch(() => show("加载失败", "error")).finally(() => setLoading(false));
  }, []);

  const chartData = radarData ? [
    { subject: "专业技能", value: radarData.d1 },
    { subject: "执行力", value: radarData.d2 },
    { subject: "工具掌握", value: radarData.d3 },
    { subject: "需求理解", value: radarData.d4 },
    { subject: "时间管理", value: radarData.d5 },
    { subject: "交付水平", value: radarData.d6 },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: "#e6edf3" }}>能力成长</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 雷达图 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>六维能力雷达</h2>
          {radarLocked ? (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-3">🔒</div>
              <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>完成首单后解锁</p>
              <p className="text-xs mt-1" style={{ color: "#8b949e" }}>雷达图将展示你的真实能力分布</p>
            </div>
          ) : loading ? (
            <div className="h-48 flex items-center justify-center">
              <p style={{ color: "#484f58" }}>加载中...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#8b949e", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3", fontSize: 12 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#58a6ff"
                  fill="#58a6ff"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* OPC报告 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>OPC成长报告</h2>
          {reports.length === 0 ? (
            <p className="text-sm" style={{ color: "#484f58" }}>暂无报告</p>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.map((r) => (
                <div
                  key={r.type}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "#21262d", border: "1px solid #30363d" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{r.name}</p>
                    {r.preview?.blurredHint && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#484f58" }}>
                        {r.preview.blurredHint}
                      </p>
                    )}
                  </div>
                  <Badge color={r.status === "purchased" ? "green" : "gray"}>
                    {r.status === "purchased" ? "已解锁" : "锁定"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 成长时间线 */}
      <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <h2 className="text-sm font-medium mb-5" style={{ color: "#8b949e" }}>成长时间线</h2>
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: "#484f58" }}>还没有成长记录，开始你的第一单吧</p>
        ) : (
          <div className="flex flex-col gap-0">
            {events.map((event, i) => (
              <div key={event.id} className="flex gap-4">
                {/* 时间线轴 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      background: event.is_milestone ? "#1f3358" : "#21262d",
                      border: `1px solid ${event.is_milestone ? "#58a6ff" : "#30363d"}`,
                    }}
                  >
                    {EVENT_ICONS[event.event_type] || "•"}
                  </div>
                  {i < events.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: "#30363d" }} />
                  )}
                </div>
                {/* 内容 */}
                <div className="pb-5 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{event.title}</p>
                    {event.is_milestone && <Badge color="blue">里程碑</Badge>}
                  </div>
                  {event.description && (
                    <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>{event.description}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#484f58" }}>
                    {new Date(event.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
