"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  { icon: "🧠", title: "25题能力测评", desc: "AI分析你的OPC人格标签，发现你的独特优势", color: "#D4A5F9" },
  { icon: "🎯", title: "智能任务匹配", desc: "基于你的能力与情绪状态，推荐最合适的企业任务", color: "#A8D8EA" },
  { icon: "💰", title: "首单24小时到账", desc: "平台垫付首单报酬，让你零风险完成第一步", color: "#D4F291" },
  { icon: "📈", title: "六维能力雷达", desc: "可视化追踪你的专业成长，积累属于你的OPC档案", color: "#FFE082" },
  { icon: "🤝", title: "真实企业需求", desc: "与有真实AI应用需求的企业直接对接，打造作品集", color: "#F9C6D9" },
  { icon: "🚀", title: "OPC独立之路", desc: "最终目标：成为可以独立接单的One-Person Creator", color: "#FFB84D" },
];

const steps = [
  { num: "01", title: "注册 & 测评", desc: "10分钟完成25题测评，获得你的OPC人格标签" },
  { num: "02", title: "接取首单", desc: "AI为你匹配最适合的入门任务，第一步永远是最小可行步骤" },
  { num: "03", title: "完成 & 收款", desc: "完成任务，平台24小时内垫付报酬，仪式感拉满" },
  { num: "04", title: "迭代成长", desc: "每完成一单，能力雷达更新，OPC档案积累" },
];

export default function HomePage() {
  const { isLoggedIn, role } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(role === "company" ? "/company/tasks" : "/tasks");
    }
  }, [isLoggedIn, role, router]);

  return (
    <div className="fade-in" style={{ background: 'linear-gradient(180deg, #F5E6F0 0%, #FEFEFE 100%)', minHeight: '100vh' }}>
      {/* 导航栏 */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #E5D4E8',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #F9C6D9 0%, #D4A5F9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🐱 启程
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/login"
              style={{
                padding: '10px 24px',
                borderRadius: '24px',
                border: '2px solid #F9C6D9',
                background: 'transparent',
                color: '#2D3436',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              登录
            </Link>
            <Link
              href="/register"
              style={{
                padding: '10px 24px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #F9C6D9 0%, #EC4899 100%)',
                color: 'white',
                fontWeight: '600',
                textDecoration: 'none',
                border: 'none',
                boxShadow: '0 4px 16px rgba(249, 198, 217, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              免费注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '24px',
          background: 'rgba(249, 198, 217, 0.2)',
          marginBottom: '32px',
          fontSize: '14px',
          color: '#EC4899',
          fontWeight: '600'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#EC4899',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          AI时代的大学生创业平台 · 现已开放
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: '800',
          marginBottom: '24px',
          lineHeight: '1.2',
          color: '#2D3436'
        }}>
          从第一单开始，<br />
          <span style={{
            background: 'linear-gradient(135deg, #F9C6D9 0%, #D4A5F9 50%, #A8D8EA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>成为真正的OPC</span>
        </h1>

        <p style={{
          fontSize: '18px',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px',
          color: '#636E72',
          lineHeight: '1.8'
        }}>
          启程连接有AI能力的高校生与有真实需求的企业。<br />
          完成第一单，改变你对自己的认知。
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/register"
            style={{
              padding: '16px 32px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #D4F291 0%, #A8E063 100%)',
              color: '#2D3436',
              fontWeight: '700',
              fontSize: '16px',
              textDecoration: 'none',
              border: 'none',
              boxShadow: '0 8px 24px rgba(212, 242, 145, 0.4)',
              transition: 'all 0.3s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            免费注册，10分钟开始 →
          </Link>
          <Link
            href="/login"
            style={{
              padding: '16px 32px',
              borderRadius: '28px',
              border: '2px solid #E5D4E8',
              background: 'white',
              color: '#2D3436',
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none',
              transition: 'all 0.3s'
            }}
          >
            已有账号，直接登录
          </Link>
        </div>

        {/* 数据展示 */}
        <div style={{
          display: 'flex',
          gap: '48px',
          justifyContent: 'center',
          marginTop: '64px',
          flexWrap: 'wrap'
        }}>
          {[
            { num: "2,400+", label: "注册学生", color: "#F9C6D9" },
            { num: "380+", label: "合作企业", color: "#A8D8EA" },
            { num: "¥1.2M+", label: "学生累计收入", color: "#D4F291" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                color: s.color,
                marginBottom: '8px'
              }}>{s.num}</div>
              <div style={{
                fontSize: '14px',
                color: '#636E72'
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#2D3436'
        }}>
          为什么选择启程
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {features.map((f) => (
            <div key={f.title} className="fade-in" style={{
              padding: '32px',
              borderRadius: '24px',
              background: 'white',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s',
              cursor: 'pointer',
              border: '1px solid #E5D4E8'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: f.color + '30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '16px'
              }}>{f.icon}</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#2D3436'
              }}>{f.title}</h3>
              <p style={{
                fontSize: '14px',
                color: '#636E72',
                lineHeight: '1.6'
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 如何开始 */}
      <section className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#2D3436'
        }}>
          四步开启OPC之路
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {steps.map((s, idx) => (
            <div key={s.num} className="fade-in" style={{
              display: 'flex',
              gap: '20px',
              padding: '28px',
              borderRadius: '24px',
              background: 'white',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s',
              border: '1px solid #E5D4E8'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '800',
                color: ['#F9C6D9', '#A8D8EA', '#D4F291', '#FFE082'][idx],
                flexShrink: 0,
                opacity: 0.9
              }}>{s.num}</div>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#2D3436'
                }}>{s.title}</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#636E72',
                  lineHeight: '1.6'
                }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container" style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '48px',
          borderRadius: '32px',
          background: 'white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5D4E8'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#2D3436'
          }}>
            准备好开始了吗？
          </h2>
          <p style={{
            fontSize: '16px',
            marginBottom: '32px',
            color: '#636E72'
          }}>
            现在注册，完成测评，今天就可以接到你的第一单。
          </p>
          <Link
            href="/register"
            style={{
              padding: '18px 40px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #F9C6D9 0%, #EC4899 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '18px',
              textDecoration: 'none',
              border: 'none',
              boxShadow: '0 8px 24px rgba(249, 198, 217, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            立即开始 — 完全免费 🚀
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #E5D4E8',
        padding: '32px 0',
        textAlign: 'center',
        fontSize: '14px',
        color: '#B2BEC3',
        background: 'white'
      }}>
        <div className="container">
          © 2026 启程 · 帮助高校生成为独立OPC ·
          <span style={{ marginLeft: '8px' }}>学生端 | 企业端</span>
        </div>
      </footer>
    </div>
  );
}
