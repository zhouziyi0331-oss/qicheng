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
    <div style={{ minHeight: "100vh", background: "#F9F7F5" }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-sm no-underline hover:opacity-70 transition-opacity" style={{ color: "#636E72" }}>
            ← 返回后台
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#2D3436" }}>财务管理</h1>
        </div>

        <div className="flex rounded-2xl overflow-hidden mb-6 p-1" style={{ background: "#FFFFFF" }}>
          {(["withdrawals", "payments"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-medium rounded-xl transition-all"
              style={{
                background: tab === t ? "#FF6B35" : "transparent",
                color: tab === t ? "#FFFFFF" : "#636E72",
              }}>
              {t === "withdrawals" ? "提现审核" : "流水记录"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-3xl animate-pulse" style={{ background: "#FFFFFF" }} />
            ))}
          </div>
        ) : tab === "withdrawals" ? (
          <div className="flex flex-col gap-4">
            {withdrawals.map((w) => (
              <div key={w.id} className="p-6 rounded-3xl flex items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ background: "#FFFFFF" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge color={w.status === "pending" ? "orange" : w.status === "approved" ? "green" : "gray"}>
                      {w.status === "pending" ? "待审核" : w.status === "approved" ? "已批准" : w.status}
                    </Badge>
                    {w.is_auto_approved && <Badge color="gray">自动审核</Badge>}
                    <span className="text-xs" style={{ color: "#B2BEC3" }}>
                      {new Date(w.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-base font-semibold mb-1" style={{ color: "#2D3436" }}>{w.nickname}</p>
                  <p className="text-sm" style={{ color: "#636E72" }}>支付宝：{w.alipay_account}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-3" style={{ color: "#00B894" }}>¥{w.amount}</div>
                  {w.status === "pending" && (
                    <Button size="sm" loading={approving === w.id} onClick={() => handleApprove(w.id)}>
                      批准
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && (
              <div className="text-center py-20">
                <p className="text-base" style={{ color: "#B2BEC3" }}>暂无待审核提现</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: "#FFFFFF" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F9F7F5", borderBottom: "1px solid #DFE6E9" }}>
                  {["类型", "收款方", "金额", "状态", "时间"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-xs font-semibold" style={{ color: "#636E72" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                    <td className="px-4 py-4" style={{ color: "#636E72" }}>{p.type}</td>
                    <td className="px-4 py-4 font-medium" style={{ color: "#2D3436" }}>{p.payee_nickname}</td>
                    <td className="px-4 py-4 font-bold" style={{ color: "#00B894" }}>¥{p.amount}</td>
                    <td className="px-4 py-4">
                      <Badge color={p.status === "completed" ? "green" : "orange"}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-xs" style={{ color: "#B2BEC3" }}>
                      {new Date(p.created_at).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm" style={{ color: "#B2BEC3" }}>暂无流水记录</td>
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
