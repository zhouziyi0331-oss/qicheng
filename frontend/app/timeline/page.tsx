"use client";

import { useEffect, useState } from "react";
import { studentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface TimelineEvent {
  id: string;
  eventType: string;
  eventTitle: string;
  eventDesc: string;
  isMilestone: boolean;
  eventData?: Record<string, unknown>;
  createdAt: string;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const res = await studentApi.getTimeline();
      setEvents(res.data);
    } catch (err) {
      show("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">成长时间线</h1>
      <p className="text-gray-600 mb-8">记录你在启程的每一个重要时刻</p>

      <div className="relative border-l-2 border-blue-200 pl-8 space-y-8">
        {events.map((event) => (
          <div key={event.id} className="relative">
            {/* 时间线节点 */}
            <div
              className={`absolute -left-[41px] w-6 h-6 rounded-full border-4 ${
                event.isMilestone
                  ? "bg-yellow-400 border-yellow-200"
                  : "bg-blue-400 border-blue-200"
              }`}
            />

            {/* 事件卡片 */}
            <div
              className={`p-6 rounded-lg ${
                event.isMilestone
                  ? "bg-yellow-50 border-2 border-yellow-200"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{event.eventTitle}</h3>
                {event.isMilestone && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    里程碑
                  </span>
                )}
              </div>
              <p className="text-gray-700 mb-3">{event.eventDesc}</p>
              <time className="text-sm text-gray-500">
                {new Date(event.createdAt).toLocaleString("zh-CN")}
              </time>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            你的成长故事即将开始...
          </div>
        )}
      </div>
    </div>
  );
}
