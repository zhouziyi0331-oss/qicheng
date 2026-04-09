"use client";
import { useState } from "react";
import Link from "next/link";
import { taskApi } from "@/lib/api";

export default function PublishTaskPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    requirements: "",
    category: "development",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await taskApi.createTask({
        title: formData.title,
        description: formData.description,
        budget_gross: parseInt(formData.budget),
        deadline: formData.deadline,
        requirements: formData.requirements,
        category: formData.category,
      });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/enterprise/tasks";
      }, 2000);
    } catch (error) {
      alert("发布失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f7" }}>
      {/* 左侧导航栏 */}
      <aside style={{
        width: "240px",
        background: "#ffffff",
        borderRight: "1px solid #e5e5e7",
        padding: "24px 16px",
        position: "fixed",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          marginBottom: "24px",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}>
            🚀
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1d1d1f" }}>启程企业版</span>
        </div>

        <div style={{ fontSize: "12px", color: "#86868b", fontWeight: 600, padding: "8px 12px", marginTop: "8px" }}>
          主菜单
        </div>

        <Link href="/enterprise" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>📊</span>
          仪表盘
        </Link>

        <Link href="/enterprise/tasks" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>📋</span>
          任务管理
        </Link>

        <Link href="/enterprise/publish" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#1d1d1f",
          color: "#ffffff",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>➕</span>
          发布任务
        </Link>

        <Link href="/enterprise/payments" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>💰</span>
          付款管理
        </Link>

        <div style={{ fontSize: "12px", color: "#86868b", fontWeight: 600, padding: "8px 12px", marginTop: "24px" }}>
          工具
        </div>

        <Link href="/enterprise/analytics" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>📈</span>
          数据分析
        </Link>

        <Link href="/enterprise/settings" style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "transparent",
          color: "#86868b",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          <span style={{ fontSize: "18px" }}>⚙️</span>
          设置
        </Link>
      </aside>

      {/* 主内容区 */}
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* 顶部 */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#1d1d1f", marginBottom: "8px" }}>
              发布新任务
            </h1>
            <p style={{ fontSize: "14px", color: "#86868b" }}>
              填写任务详情，AI将为您匹配最合适的学生
            </p>
          </div>

          {success ? (
            <div style={{
              background: "#d4f4dd",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
              border: "1px solid #34c759",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                发布成功！
              </h2>
              <p style={{ fontSize: "14px", color: "#86868b" }}>
                正在跳转到任务管理页面...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid #e5e5e7",
            }}>
              {/* 任务标题 */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                  任务标题 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：开发响应式网页界面"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5e7",
                    fontSize: "14px",
                    color: "#1d1d1f",
                    outline: "none",
                  }}
                />
              </div>

              {/* 任务描述 */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                  任务描述 *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述任务内容、目标和期望成果..."
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5e7",
                    fontSize: "14px",
                    color: "#1d1d1f",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* 任务类别 */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                  任务类别 *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5e7",
                    fontSize: "14px",
                    color: "#1d1d1f",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="development">开发</option>
                  <option value="design">设计</option>
                  <option value="marketing">营销</option>
                  <option value="writing">写作</option>
                  <option value="other">其他</option>
                </select>
              </div>

              {/* 预算和截止日期 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                    预算（元）*
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="5000"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5e7",
                      fontSize: "14px",
                      color: "#1d1d1f",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                    截止日期 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5e7",
                      fontSize: "14px",
                      color: "#1d1d1f",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* 技能要求 */}
              <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#1d1d1f", marginBottom: "8px" }}>
                  技能要求
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="例如：熟悉React、TypeScript、响应式设计..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5e7",
                    fontSize: "14px",
                    color: "#1d1d1f",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* 提交按钮 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    borderRadius: "10px",
                    background: submitting ? "#86868b" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "发布中..." : "发布任务"}
                </button>
                <Link
                  href="/enterprise/tasks"
                  style={{
                    padding: "14px 24px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5e7",
                    background: "#ffffff",
                    color: "#1d1d1f",
                    fontSize: "16px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-block",
                    textAlign: "center",
                  }}
                >
                  取消
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
