"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

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

interface FinanceOverview {
  totalRevenue: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  platformProfit: number;
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<"overview" | "withdrawals" | "transactions">("overview");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { show } = useToast();

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const { data } = await adminApi.getFinanceOverview();
        setOverview(data);
      } else if (tab === "withdrawals") {
        const { data } = await adminApi.getWithdrawals();
        setWithdrawals(data.data || []);
      }
    } catch (err) {
      show("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await adminApi.approveWithdrawal(id);
      show("已批准提现，余额已更新", "success");
      loadData();
    } catch (err: any) {
      show(err?.response?.data?.message || "操作失败", "error");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      show("请输入拒绝原因", "error");
      return;
    }
    try {
      await adminApi.rejectWithdrawal(id, rejectReason);
      show("已拒绝提现申请", "success");
      setRejectingId(null);
      setRejectReason("");
      loadData();
    } catch (err: any) {
      show(err?.response?.data?.message || "操作失败", "error");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0C10 0%, #11141C 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
        {/* 顶部导航 */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/admin" style={{
            color: "#8E96A5",
            textDecoration: "none",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#8E96A5"}
          >
            ← 返回后台
          </Link>
          <div style={{
            width: "1px",
            height: "16px",
            background: "rgba(255,255,255,0.1)"
          }} />
          <h1 style={{
            color: "#F1F5F9",
            fontSize: "24px",
            fontWeight: "700",
            margin: 0
          }}>
            💰 财务管理
          </h1>
        </div>

        {/* 标签切换 */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          padding: "6px",
          background: "#1A1D24",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          {[
            { id: "overview", label: "财务概览", icon: "📊" },
            { id: "withdrawals", label: "提现审核", icon: "💳" },
            { id: "transactions", label: "交易流水", icon: "📝" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: "8px",
                background: tab === t.id ? "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" : "transparent",
                border: "none",
                color: tab === t.id ? "#fff" : "#8E96A5",
                fontSize: "14px",
                fontWeight: tab === t.id ? "600" : "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (tab !== t.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== t.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: "120px",
                borderRadius: "16px",
                background: "#1A1D24",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }} />
            ))}
          </div>
        ) : tab === "overview" && overview ? (
          <div>
            {/* 财务概览卡片 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "32px"
            }}>
              {[
                {
                  label: "总收入",
                  value: `¥${overview.totalRevenue.toLocaleString()}`,
                  change: "+12.5%",
                  trend: "up",
                  color: "#10B981",
                  icon: "💵"
                },
                {
                  label: "已提现",
                  value: `¥${overview.totalWithdrawn.toLocaleString()}`,
                  change: `${overview.pendingWithdrawals}笔待审`,
                  trend: "neutral",
                  color: "#F59E0B",
                  icon: "💸"
                },
                {
                  label: "平台利润",
                  value: `¥${overview.platformProfit.toLocaleString()}`,
                  change: "+8.3%",
                  trend: "up",
                  color: "#3B82F6",
                  icon: "💰"
                },
                {
                  label: "待处理提现",
                  value: overview.pendingWithdrawals,
                  change: "需要审核",
                  trend: "neutral",
                  color: "#8B5CF6",
                  icon: "⏳"
                }
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: "24px",
                  borderRadius: "16px",
                  background: "#1A1D24",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = `${item.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                }}
                >
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}80 100%)`
                  }} />

                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `${item.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "16px"
                  }}>
                    {item.icon}
                  </div>

                  <div style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#F1F5F9",
                    marginBottom: "8px",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {item.value}
                  </div>

                  <div style={{
                    fontSize: "13px",
                    color: "#8E96A5",
                    marginBottom: "12px",
                    fontWeight: "500"
                  }}>
                    {item.label}
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: item.trend === "up" ? "#10B981" : "#8E96A5"
                    }}>
                      {item.trend === "up" && "↗"} {item.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 收入趋势图 */}
            <div style={{
              padding: "24px",
              borderRadius: "16px",
              background: "#1A1D24",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              marginBottom: "32px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px"
              }}>
                <div>
                  <h3 style={{ color: "#F1F5F9", fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
                    收入趋势分析
                  </h3>
                  <p style={{ color: "#8E96A5", fontSize: "13px" }}>最近30天数据</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["日", "周", "月", "年"].map((period) => (
                    <button key={period} style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: period === "月" ? "rgba(59,130,246,0.15)" : "transparent",
                      border: period === "月" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
                      color: period === "月" ? "#3B82F6" : "#8E96A5",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}>
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "240px" }}>
                {[45, 52, 48, 65, 70, 68, 75, 80, 78, 85, 90, 88, 95, 92, 98].map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    position: "relative"
                  }}>
                    <div style={{
                      width: "100%",
                      height: `${h}%`,
                      background: `linear-gradient(180deg, ${h > 80 ? "#10B981" : "#3B82F6"} 0%, ${h > 80 ? "#059669" : "#2563EB"} 100%)`,
                      borderRadius: "6px 6px 0 0",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                      const tooltip = e.currentTarget.querySelector('div') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      const tooltip = e.currentTarget.querySelector('div') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = "0";
                    }}
                    >
                      <div style={{
                        position: "absolute",
                        top: "-40px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        background: "#1E2129",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontSize: "11px",
                        color: "#F1F5F9",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        opacity: 0,
                        transition: "opacity 0.2s",
                        pointerEvents: "none"
                      }}>
                        ¥{(h * 100).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === "withdrawals" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {withdrawals.filter(w => w.status === "pending").length === 0 ? (
              <div style={{
                padding: "80px 20px",
                textAlign: "center",
                borderRadius: "16px",
                background: "#1A1D24",
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
                <p style={{ color: "#8E96A5", fontSize: "16px" }}>暂无待审核提现申请</p>
              </div>
            ) : (
              withdrawals.filter(w => w.status === "pending").map((w) => (
                <div key={w.id} style={{
                  padding: "24px",
                  borderRadius: "16px",
                  background: "#1A1D24",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                >
                  {/* 用户头像 */}
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "20px",
                    fontWeight: "700",
                    flexShrink: 0
                  }}>
                    {w.nickname.charAt(0)}
                  </div>

                  {/* 信息区 */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px"
                    }}>
                      <span style={{
                        color: "#F1F5F9",
                        fontSize: "16px",
                        fontWeight: "600"
                      }}>
                        {w.nickname}
                      </span>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "rgba(245,158,11,0.15)",
                        color: "#F59E0B",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        待审核
                      </span>
                      {w.is_auto_approved && (
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: "rgba(59,130,246,0.15)",
                          color: "#3B82F6",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          自动审核
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: "#8E96A5",
                      fontSize: "13px",
                      marginBottom: "4px"
                    }}>
                      支付宝账号：{w.alipay_account}
                    </div>
                    <div style={{
                      color: "#8E96A5",
                      fontSize: "12px"
                    }}>
                      申请时间：{new Date(w.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  {/* 金额和操作 */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "12px"
                  }}>
                    <div style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#10B981",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      ¥{w.amount.toLocaleString()}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setRejectingId(w.id)}
                        disabled={approving === w.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                        }}
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => handleApprove(w.id)}
                        disabled={approving === w.id}
                        style={{
                          padding: "8px 20px",
                          borderRadius: "10px",
                          background: approving === w.id ? "#6B7280" : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                          border: "none",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: approving === w.id ? "not-allowed" : "pointer",
                          boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          if (approving !== w.id) {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16,185,129,0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
                        }}
                      >
                        {approving === w.id ? "处理中..." : "批准"}
                      </button>
                    </div>
                  </div>

                  {/* 拒绝弹窗 */}
                  {rejectingId === w.id && (
                    <div style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0,0,0,0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1000
                    }}
                    onClick={() => setRejectingId(null)}
                    >
                      <div style={{
                        padding: "32px",
                        borderRadius: "16px",
                        background: "#1A1D24",
                        border: "1px solid rgba(255,255,255,0.1)",
                        maxWidth: "500px",
                        width: "90%"
                      }}
                      onClick={(e) => e.stopPropagation()}
                      >
                        <h3 style={{
                          color: "#F1F5F9",
                          fontSize: "18px",
                          fontWeight: "600",
                          marginBottom: "16px"
                        }}>
                          拒绝提现申请
                        </h3>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="请输入拒绝原因..."
                          style={{
                            width: "100%",
                            height: "120px",
                            padding: "12px",
                            borderRadius: "12px",
                            background: "#0A0C10",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F1F5F9",
                            fontSize: "14px",
                            resize: "none",
                            marginBottom: "16px"
                          }}
                        />
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "10px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#8E96A5",
                              fontSize: "14px",
                              fontWeight: "500",
                              cursor: "pointer"
                            }}
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleReject(w.id)}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                              border: "none",
                              color: "#fff",
                              fontSize: "14px",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            确认拒绝
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{
            padding: "24px",
            borderRadius: "16px",
            background: "#1A1D24",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
          }}>
            <div style={{
              padding: "80px 20px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <p style={{ color: "#8E96A5", fontSize: "16px" }}>交易流水功能开发中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
