"use client";
import { useState, useEffect } from "react";
import { studentApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import EmotionSignalCard from "@/components/profile/EmotionSignalCard";

interface StudentProfile {
  nickname: string;
  phone: string;
  opc_label: string | null;
  opc_label_secondary: string | null;
  six_dim_scores: Record<string, number> | null;
  balance: number | null;
  task_count: number | null;
  level_a: number | null;
  graduated_at: string | null;
}

interface EmotionSignal {
  id: number;
  signalType: 'cooling' | 'frustrated' | 'high_frustrated' | 'excited';
  signalValue: number;
  triggerEvent: string;
  detectedAt: string;
}

const DIM_LABELS = [
  { key: "d1", label: "专业技能", color: "#6ee7f7" },
  { key: "d2", label: "执行力", color: "#a78bfa" },
  { key: "d3", label: "新工具上手", color: "#34d399" },
  { key: "d4", label: "需求理解", color: "#fbbf24" },
  { key: "d5", label: "时间管理", color: "#f87171" },
  { key: "d6", label: "交付水平", color: "#60a5fa" },
];

const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [emotionSignals, setEmotionSignals] = useState<EmotionSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const { updateNickname } = useAuthStore();
  const { show } = useToast();

  useEffect(() => {
    Promise.all([
      studentApi.getProfile(),
      studentApi.getEmotionSignals().catch(() => ({ data: { data: [] } }))
    ])
      .then(([profileRes, signalsRes]) => {
        setProfile(profileRes.data.data);
        setNickname(profileRes.data.data.nickname || "");
        setEmotionSignals(signalsRes.data.data || []);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return show("昵称不能为空", "error");
    setSaving(true);
    try {
      await studentApi.updateProfile({ nickname: nickname.trim() });
      updateNickname(nickname.trim());
      setProfile((p) => p ? { ...p, nickname: nickname.trim() } : p);
      setEditing(false);
      show("昵称已更新", "success");
    } catch {
      show("更新失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const getScore = (dim: string) => {
    return profile?.six_dim_scores?.[dim] || 0;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-lg animate-pulse mb-4" style={{ background: "#161b22" }} />
        ))}
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
      <h1 className="text-xl font-bold mb-6" style={{ color: "#e6edf3" }}>我的主页</h1>

      {/* 情绪信号 */}
      <EmotionSignalCard signals={emotionSignals} />

      {/* OPC 人格卡片 */}
      <div className="p-6 rounded-lg mb-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a2744 0%, #161b22 100%)", border: "1px solid #30363d" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5"
          style={{ background: "#58a6ff", transform: "translate(30%, -30%)" }} />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="text-lg font-bold"
                    style={{ width: 160, padding: "4px 8px" }}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
                  />
                  <Button size="sm" loading={saving} onClick={handleSaveNickname}>保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setNickname(profile.nickname); }}>取消</Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold" style={{ color: "#e6edf3" }}>{profile.nickname}</h2>
                  <button onClick={() => setEditing(true)} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "#21262d", color: "#8b949e", border: "1px solid #30363d" }}>
                    改昵称
                  </button>
                </>
              )}
            </div>
            <p className="text-xs mb-3" style={{ color: "#484f58" }}>{profile.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</p>
            {profile.opc_label ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge color="blue">OPC · {profile.opc_label}</Badge>
                {profile.opc_label_secondary && <Badge color="gray">{profile.opc_label_secondary}</Badge>}
                <Badge color="gray">Lv.{profile.level_a ?? 0} {LEVEL_NAMES[profile.level_a ?? 0] || ""}</Badge>
              </div>
            ) : (
              <Badge color="gray">尚未完成测试</Badge>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: "#3fb950" }}>¥{(profile.balance || 0).toFixed(2)}</div>
            <div className="text-xs" style={{ color: "#484f58" }}>可用余额</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex gap-6" style={{ borderColor: "#30363d" }}>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: "#e6edf3" }}>{profile.task_count || 0}</div>
            <div className="text-xs" style={{ color: "#8b949e" }}>完成任务</div>
          </div>
          {profile.graduated_at && (
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: "#e6edf3" }}>
                {new Date(profile.graduated_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
              </div>
              <div className="text-xs" style={{ color: "#8b949e" }}>毕业日期</div>
            </div>
          )}
        </div>
      </div>

      {/* 五维能力 */}
      {profile.opc_label && profile.six_dim_scores && (
        <div className="p-5 rounded-lg mb-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>五维能力</h3>
          <div className="flex flex-col gap-3">
            {DIM_LABELS.map((dim) => {
              const score = getScore(dim.key);
              return (
                <div key={dim.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#8b949e" }}>{dim.label}</span>
                    <span style={{ color: dim.color }}>{score}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(score, 100)}%`, background: dim.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 未完成测试提示 */}
      {!profile.opc_label && (
        <div className="p-5 rounded-lg mb-4 text-center" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-3xl mb-3">🧭</div>
          <p className="text-sm mb-4" style={{ color: "#8b949e" }}>完成25题AI人格测试，解锁你的OPC标签和五维能力图</p>
          <a href="/onboarding" className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-white no-underline"
            style={{ background: "#238636" }}>
            开始测试
          </a>
        </div>
      )}

      {/* 功能菜单 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link href="/my-tasks" className="p-4 rounded-lg no-underline group hover:scale-105 transition-transform"
          style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-2xl mb-2">📋</div>
          <div className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>我的任务</div>
          <div className="text-xs" style={{ color: "#8b949e" }}>查看进行中和已完成的任务</div>
        </Link>

        <Link href="/withdraw" className="p-4 rounded-lg no-underline group hover:scale-105 transition-transform"
          style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-2xl mb-2">💰</div>
          <div className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>提现</div>
          <div className="text-xs" style={{ color: "#8b949e" }}>余额满¥50可申请提现</div>
        </Link>

        <Link href="/ability" className="p-4 rounded-lg no-underline group hover:scale-105 transition-transform"
          style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>能力分析</div>
          <div className="text-xs" style={{ color: "#8b949e" }}>查看六维能力雷达图</div>
        </Link>

        <Link href="/reports" className="p-4 rounded-lg no-underline group hover:scale-105 transition-transform"
          style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-2xl mb-2">📄</div>
          <div className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>OPC报告</div>
          <div className="text-xs" style={{ color: "#8b949e" }}>解锁深度职业分析报告</div>
        </Link>

        <Link href="/timeline" className="p-4 rounded-lg no-underline group hover:scale-105 transition-transform"
          style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>成长时间线</div>
          <div className="text-xs" style={{ color: "#8b949e" }}>回顾你的成长历程</div>
        </Link>

        <Link href="/story" className="p-4 rounded-lg no-underline group hover:scale-105 transition-transform"
          style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <div className="text-2xl mb-2">✨</div>
          <div className="text-sm font-medium mb-1" style={{ color: "#e6edf3" }}>故事墙</div>
          <div className="text-xs" style={{ color: "#8b949e" }}>分享你的OPC故事</div>
        </Link>
      </div>

      {/* 高级功能 */}
      <div className="p-5 rounded-lg mb-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>进阶功能</h3>
        <div className="space-y-2">
          <Link href="/challenge" className="flex items-center justify-between p-3 rounded-lg no-underline hover:bg-opacity-80 transition-colors"
            style={{ background: "#21262d" }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">🚀</div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#e6edf3" }}>跳级挑战</div>
                <div className="text-xs" style={{ color: "#8b949e" }}>挑战更高等级任务</div>
              </div>
            </div>
            <div className="text-xs" style={{ color: "#58a6ff" }}>→</div>
          </Link>

          <Link href="/team" className="flex items-center justify-between p-3 rounded-lg no-underline hover:bg-opacity-80 transition-colors"
            style={{ background: "#21262d" }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">👥</div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#e6edf3" }}>组队接单</div>
                <div className="text-xs" style={{ color: "#8b949e" }}>与他人协作完成任务</div>
              </div>
            </div>
            <div className="text-xs" style={{ color: "#58a6ff" }}>→</div>
          </Link>

          <Link href="/invitation" className="flex items-center justify-between p-3 rounded-lg no-underline hover:bg-opacity-80 transition-colors"
            style={{ background: "#21262d" }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">💌</div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#e6edf3" }}>邀请任务</div>
                <div className="text-xs" style={{ color: "#8b949e" }}>满级后解锁企业邀请</div>
              </div>
            </div>
            {profile.level_a === 7 ? (
              <Badge color="green">已解锁</Badge>
            ) : (
              <Badge color="gray">Lv.7解锁</Badge>
            )}
          </Link>
        </div>
      </div>

      {/* 设置 */}
      <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>设置</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-opacity-80 transition-colors"
            style={{ background: "#21262d", border: "none", cursor: "pointer" }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">🔔</div>
              <div className="text-sm" style={{ color: "#e6edf3" }}>通知设置</div>
            </div>
            <div className="text-xs" style={{ color: "#58a6ff" }}>→</div>
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-opacity-80 transition-colors"
            style={{ background: "#21262d", border: "none", cursor: "pointer" }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">🔒</div>
              <div className="text-sm" style={{ color: "#e6edf3" }}>隐私设置</div>
            </div>
            <div className="text-xs" style={{ color: "#58a6ff" }}>→</div>
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-opacity-80 transition-colors"
            style={{ background: "#21262d", border: "none", cursor: "pointer" }}
            onClick={() => {
              if (confirm("确定要退出登录吗？")) {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }
            }}>
            <div className="flex items-center gap-3">
              <div className="text-xl">🚪</div>
              <div className="text-sm" style={{ color: "#e6edf3" }}>退出登录</div>
            </div>
            <div className="text-xs" style={{ color: "#58a6ff" }}>→</div>
          </button>
        </div>
      </div>
    </div>
  );
}
