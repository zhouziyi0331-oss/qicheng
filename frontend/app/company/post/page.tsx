"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const TRACK_OPTIONS = [
  { value: "A", label: "赛道A — 内容创作（文案/图文/视频脚本）" },
  { value: "B", label: "赛道B — AI工具应用（自动化/Agent/工具搭建）" },
  { value: "AB", label: "赛道AB — 综合项目（需要创作+技术）" },
];
const LEVEL_OPTIONS = [
  { value: 0, label: "Lv.0 入门（零基础可完成）" },
  { value: 1, label: "Lv.1 初级（用过AI工具）" },
  { value: 2, label: "Lv.2 实践者（AI熟练用户）" },
  { value: 3, label: "Lv.3 熟练（AI专家）" },
];

export default function PostTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [track, setTrack] = useState("A");
  const [level, setLevel] = useState(0);
  const [budget, setBudget] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [maxAssignees, setMaxAssignees] = useState("1");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !acceptanceCriteria || !budget) {
      return show("请填写所有必填项", "error");
    }
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum < 30) {
      return show("预算最低30元", "error");
    }
    setLoading(true);
    try {
      await taskApi.create({  // POST /tasks/company
        title,
        description,
        acceptance_criteria: acceptanceCriteria,
        track_type: track,
        level_required: level,
        budget_gross: budgetNum,
        estimated_hours: parseFloat(estimatedHours) || 2,
        max_assignees: parseInt(maxAssignees) || 1,
        tags: tags.split(/[,，\s]+/).filter(Boolean),
      });
      show("任务发布成功！等待平台审核 🎉", "success");
      router.push("/company/tasks");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "发布失败，请检查信息", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>发布任务</h1>
        <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
          描述你的AI应用需求，学生团队将在24小时内接单
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="p-5 rounded-lg flex flex-col gap-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium" style={{ color: "#8b949e" }}>基本信息</h2>
          <Input
            label="任务标题 *"
            placeholder="简洁描述任务目标，如「用AI生成10篇产品文案」"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>任务描述 *</label>
            <textarea
              className="w-full h-32 resize-none p-3 rounded-lg text-sm"
              placeholder="详细描述需求背景、期望效果、参考资料链接等..."
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>验收标准 *</label>
            <textarea
              className="w-full h-24 resize-none p-3 rounded-lg text-sm"
              placeholder="明确说明什么样的交付物算完成，如「每篇文案不少于300字，含产品核心卖点，语言流畅」"
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5 rounded-lg flex flex-col gap-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium" style={{ color: "#8b949e" }}>任务设置</h2>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>赛道选择</label>
            <div className="flex flex-col gap-2">
              {TRACK_OPTIONS.map((t) => (
                <label key={t.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors"
                  style={{
                    background: track === t.value ? "#1f3358" : "#21262d",
                    border: `1px solid ${track === t.value ? "#58a6ff" : "#30363d"}`,
                  }}>
                  <input
                    type="radio"
                    name="track"
                    value={t.value}
                    checked={track === t.value}
                    onChange={(e) => setTrack(e.target.value)}
                    style={{ width: "auto" }}
                  />
                  <span className="text-sm" style={{ color: track === t.value ? "#58a6ff" : "#e6edf3" }}>
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>所需等级</label>
            <select
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 rounded-lg flex flex-col gap-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium" style={{ color: "#8b949e" }}>报价与接单设置</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="预算（元）*"
              type="number"
              placeholder="最低 30 元"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="30"
            />
            <Input
              label="预计工时（小时）"
              type="number"
              placeholder="如：3"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              min="0.5"
              step="0.5"
            />
          </div>
          <Input
            label="最多接单人数"
            type="number"
            placeholder="默认1人，最多3人"
            value={maxAssignees}
            onChange={(e) => setMaxAssignees(e.target.value)}
            min="1"
            max="3"
          />
          <Input
            label="标签（逗号分隔，选填）"
            placeholder="如：文案,AI工具,内容营销"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="p-4 rounded-lg text-sm" style={{ background: "#1a3a2a", border: "1px solid #2ea043", color: "#8b949e" }}>
          💡 平台抽取 15% 服务费，学生实得{budget ? ` ¥${(parseFloat(budget) * 0.85).toFixed(0)}` : ""}。
          任务发布后经平台审核（通常2小时内）即可上线。
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          发布任务
        </Button>
      </form>
    </div>
  );
}
