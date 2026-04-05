"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Withdrawal {
  id: string;
  user_id: string;
  nickname: string;
  amount: number;
  status: string;
  alipay_account: string;
  created_at: string;
  is_auto_approved: boolean;
}

interface Payment {
  id: string;
  payment_id: string;
  amount: number;
  payer: string;
  payee_nickname: string;
  type: string;
  status: string;
  created_at: string;
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<"withdrawals" | "payments">("withdrawals");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    setLoading(true);
    const req = tab === "withdrawals"
      ? adminApi.getWithdrawals()
      : adminApi.getFinancePayments();
    req
      .then(({ data }) => {
        if (tab === "withdrawals") setWithdrawals(data.data || []);
        else setPayments(data.data || []);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, [tab]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await adminApi.approveWithdrawal(id);
      show("已批准提现", "success");
      setWithdrawals((ws) => ws.map((w) => w.id === id ? { ...w, status: "approved" } : w));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>财务管理</h1>
      </div>

      <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: "1px solid #30363d" }}>
        {(["withdrawals", "payments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium"
            style={{
              background: tab === t ? "#21262d" : "#161b22",
              color: tab === t ? "#e6edf3" : "#8b949e",
            }}>
            {t === "withdrawals" ? "💸 提现审核" : "📊 流水记录"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : tab === "withdrawals" ? (
        <div className="flex flex-col gap-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="p-4 rounded-lg flex items-center justify-between gap-4"
              style={{ background: "#161b22", border: "1px solid #30363d" }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={w.status === "pending" ? "orange" : w.status === "approved" ? "green" : "gray"}>
                    {w.status === "pending" ? "待审核" : w.status === "approved" ? "已批准" : w.status}
                  </Badge>
                  {w.is_auto_approved && <Badge color="gray">自动审核</Badge>}
                  <span className="text-xs" style={{ color: "#484f58" }}>
                    {new Date(w.created_at).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{w.nickname}</p>
                <p className="text-xs" style={{ color: "#484f58" }}>支付宝：{w.alipay_account}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold mb-2" style={{ color: "#3fb950" }}>¥{w.amount}</div>
                {w.status === "pending" && (
                  <Button size="sm" loading={approving === w.id} onClick={() => handleApprove(w.id)}>
                    批准
                  </Button>
                )}
              </div>
            </div>
          ))}
          {withdrawals.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: "#484f58" }}>暂无待审核提现</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #30363d" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                {["类型", "收款方", "金额", "状态", "时间"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "#8b949e" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "#161b22" : "#0d1117", borderBottom: "1px solid #21262d" }}>
                  <td className="px-3 py-2.5" style={{ color: "#8b949e" }}>{p.type}</td>
                  <td className="px-3 py-2.5" style={{ color: "#e6edf3" }}>{p.payee_nickname}</td>
                  <td className="px-3 py-2.5 font-bold" style={{ color: "#3fb950" }}>¥{p.amount}</td>
                  <td className="px-3 py-2.5">
                    <Badge color={p.status === "completed" ? "green" : "orange"}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "#484f58" }}>
                    {new Date(p.created_at).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-sm" style={{ color: "#484f58" }}>暂无流水记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
