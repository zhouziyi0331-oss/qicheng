"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { paymentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface BalanceData {
  balance: number;
  total_earnings: number;
  pending_withdrawal: number;
}

interface HistoryItem {
  id: string;
  type: string;
  amount: number;
  direction: "in" | "out";
  description: string;
  status: string;
  created_at: string;
}

export default function WithdrawPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [alipay, setAlipay] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    Promise.allSettled([paymentApi.balance(), paymentApi.history()])
      .then(([b, h]) => {
        if (b.status === "fulfilled") setBalance(b.value.data.data);
        if (h.status === "fulfilled") setHistory(h.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 50) return show("最低提现金额 ¥50", "error");
    if (!alipay.trim()) return show("请填写支付宝账号", "error");
    if (balance && amt > balance.balance) return show("余额不足", "error");
    setSubmitting(true);
    try {
      await paymentApi.withdraw(amt, alipay.trim());
      show("提现申请已提交，预计1-3个工作日到账", "success");
      setBalance((b) => b ? { ...b, balance: b.balance - amt, pending_withdrawal: b.pending_withdrawal + amt } : b);
      setAmount("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "提现失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        {[1, 2].map((i) => <div key={i} className="h-28 rounded-lg animate-pulse mb-4" style={{ background: "#161b22" }} />)}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 我的主页</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>提现</h1>
      </div>

      {/* 余额卡片 */}
      <div className="p-5 rounded-lg mb-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "可提余额", value: `¥${(balance?.balance ?? 0).toFixed(2)}`, color: "#3fb950" },
            { label: "待到账", value: `¥${(balance?.pending_withdrawal ?? 0).toFixed(2)}`, color: "#d29922" },
            { label: "累计收入", value: `¥${(balance?.total_earnings ?? 0).toFixed(2)}`, color: "#8b949e" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#484f58" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>提现金额（最低 ¥50）</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额"
              min="50"
              max={balance?.balance ?? 0}
              step="0.01"
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>支付宝账号</label>
            <input
              value={alipay}
              onChange={(e) => setAlipay(e.target.value)}
              placeholder="手机号或邮箱"
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            />
          </div>
          <Button
            loading={submitting}
            disabled={(balance?.balance ?? 0) < 50}
            onClick={handleWithdraw}
            className="w-full"
          >
            申请提现
          </Button>
        </div>

        <p className="text-xs mt-3" style={{ color: "#484f58" }}>
          ≤¥1000 自动审核，&gt;¥1000 人工审核（1-2个工作日）。到账需1-3个工作日。
        </p>
      </div>

      {/* 收支历史 */}
      <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>收支记录</h3>
        {history.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "#484f58" }}>暂无记录</p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "#21262d" }}>
            {history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#e6edf3" }}>{item.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color={item.status === "completed" ? "green" : "orange"}>
                      {item.status === "completed" ? "已完成" : "处理中"}
                    </Badge>
                    <span className="text-xs" style={{ color: "#484f58" }}>
                      {new Date(item.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-base flex-shrink-0" style={{
                  color: item.direction === "in" ? "#3fb950" : "#f85149",
                }}>
                  {item.direction === "in" ? "+" : "-"}¥{item.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
