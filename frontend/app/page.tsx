"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  { icon: "🧠", title: "看见真实的自己", desc: "25道题，不是测试，是一次对话。AI帮你发现那些你自己都没注意到的闪光点", color: "#D4A5F9", link: "/onboarding" },
  { icon: "🎯", title: "不是抢单，是遇见", desc: "我们不会让你盲目竞争。每个任务推荐，都基于你此刻的能力和状态", color: "#A8D8EA", link: "/tasks" },
  { icon: "💰", title: "第一步，我们陪你", desc: "首单24小时到账，平台先垫付。因为我们知道，开始有多难", color: "#D4F291", link: "/register" },
  { icon: "📈", title: "成长看得见", desc: "六维能力雷达，记录每一次进步。你的OPC档案，是你自己写的故事", color: "#FFE082", link: "/ability" },
  { icon: "🤝", title: "真实的项目经验", desc: "不是练习，是真实企业的真实需求。每一单，都是你作品集的一部分", color: "#F9C6D9", link: "/story" },
  { icon: "🚀", title: "终点是独立", desc: "我们的目标，是让你有一天不再需要平台，成为真正独立的创造者", color: "#FFB84D", link: "/reports" },
];

const steps = [
  { num: "01", title: "先聊聊", desc: "10分钟，25道题。不是考试，是让我们了解你的一次对话" },
  { num: "02", title: "遇见第一个任务", desc: "AI会为你找到最适合现在的你的那一个。不用担心，永远是你能做到的" },
  { num: "03", title: "完成，然后收获", desc: "提交作品，24小时内到账。这不只是钱，是对你能力的第一次确认" },
  { num: "04", title: "看见自己在成长", desc: "每完成一单，能力雷达更新。你会看到，自己真的在变强" },
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
            <Image src="/cat-logo.png" alt="启程" width={32} height={32} /> 启程
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
      <section className="container" style={{ paddingTop: '100px', paddingBottom: '80px', textAlign: 'center' }}>
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
          fontSize: 'clamp(48px, 6vw, 72px)',
          fontWeight: '900',
          marginBottom: '32px',
          lineHeight: '1.15',
          color: '#2D3436',
          letterSpacing: '-0.02em'
        }}>
          乘着问题，<br />
          <span style={{
            background: 'linear-gradient(135deg, #F9C6D9 0%, #D4A5F9 50%, #A8D8EA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>飞跃山峰</span>
        </h1>

        <p style={{
          fontSize: '20px',
          marginBottom: '48px',
          maxWidth: '700px',
          margin: '0 auto 48px',
          color: '#636E72',
          lineHeight: '1.8',
          fontWeight: '400'
        }}>
          你的能力，值得被看见。<br />
          启程陪你从第一个真实项目开始，一步步成为独立的创造者。
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

      {/* 核心功能快速入口 */}
      <section className="container" style={{ paddingTop: '60px', paddingBottom: '60px', background: 'linear-gradient(180deg, rgba(249, 198, 217, 0.1) 0%, rgba(168, 216, 234, 0.1) 100%)', borderRadius: '32px', margin: '60px auto' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '16px',
          color: '#2D3436'
        }}>
          探索启程平台
        </h2>
        <p style={{
          fontSize: '16px',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#636E72'
        }}>
          点击了解每个功能如何帮助你成长
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { icon: "🎯", title: "OPC能力测评", desc: "25道题发现你的潜力", color: "#D4A5F9", link: "/register" },
            { icon: "📋", title: "任务大厅", desc: "AI智能匹配适合你的任务", color: "#A8D8EA", link: "/tasks" },
            { icon: "🤖", title: "AI导师", desc: "24小时在线引导和答疑", color: "#FFE082", link: "/mentor" },
            { icon: "📊", title: "六维能力", desc: "可视化你的成长轨迹", color: "#D4F291", link: "/ability" },
            { icon: "💰", title: "收入管理", desc: "查看收益和提现记录", color: "#F9C6D9", link: "/profile" },
            { icon: "📖", title: "故事墙", desc: "分享你的OPC成长故事", color: "#FFB84D", link: "/story" },
            { icon: "👥", title: "组队接单", desc: "和伙伴一起完成大任务", color: "#A8D8EA", link: "/tasks" },
            { icon: "🎓", title: "OPC报告", desc: "深度分析你的职业方向", color: "#D4A5F9", link: "/reports" },
          ].map((item) => (
            <Link key={item.title} href={item.link} style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'white',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s',
              cursor: 'pointer',
              border: '2px solid transparent',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: item.color + '30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>{item.icon}</div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#2D3436'
                }}>{item.title}</h3>
                <p style={{
                  fontSize: '13px',
                  color: '#636E72',
                  lineHeight: '1.5'
                }}>{item.desc}</p>
              </div>
              <div style={{
                fontSize: '13px',
                color: item.color,
                fontWeight: '600',
                marginTop: 'auto'
              }}>
                立即体验 →
              </div>
            </Link>
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
          我们懂你
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {features.map((f) => (
            <Link key={f.title} href={f.link} className="fade-in" style={{
              padding: '32px',
              borderRadius: '24px',
              background: 'white',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s',
              cursor: 'pointer',
              border: '1px solid #E5D4E8',
              textDecoration: 'none',
              display: 'block'
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
                lineHeight: '1.6',
                marginBottom: '12px'
              }}>{f.desc}</p>
              <div style={{
                fontSize: '14px',
                color: f.color,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                了解更多 →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 用户旅程 */}
      <section className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '16px',
          color: '#2D3436'
        }}>
          你的OPC成长路径
        </h2>
        <p style={{
          fontSize: '16px',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#636E72',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          从新手到独立创造者，每一步都有AI导师陪伴
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '32px',
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative'
        }}>
          {[
            {
              step: "01",
              title: "注册并测评",
              desc: "10分钟了解你的能力和兴趣",
              icon: "🎯",
              color: "#F9C6D9",
              action: "开始测评",
              link: "/register"
            },
            {
              step: "02",
              title: "接收任务推荐",
              desc: "AI为你匹配2-3个适合的任务",
              icon: "📋",
              color: "#A8D8EA",
              action: "查看任务",
              link: "/tasks"
            },
            {
              step: "03",
              title: "AI导师辅导",
              desc: "遇到困难随时求助，启发式引导",
              icon: "🤖",
              color: "#D4F291",
              action: "咨询导师",
              link: "/mentor"
            },
            {
              step: "04",
              title: "完成并成长",
              desc: "24小时到账，六维能力更新",
              icon: "📈",
              color: "#FFE082",
              action: "查看成长",
              link: "/ability"
            },
          ].map((item, idx) => (
            <div key={item.step} style={{
              position: 'relative',
              padding: '28px',
              borderRadius: '24px',
              background: 'white',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '2px solid ' + item.color + '40',
              transition: 'all 0.3s'
            }}>
              {/* 连接线 */}
              {idx < 3 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-32px',
                  width: '32px',
                  height: '2px',
                  background: 'linear-gradient(90deg, ' + item.color + ' 0%, transparent 100%)',
                  transform: 'translateY(-50%)'
                }} className="hidden md:block" />
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: item.color + '30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>{item.icon}</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: item.color,
                  opacity: 0.6
                }}>{item.step}</div>
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#2D3436'
              }}>{item.title}</h3>

              <p style={{
                fontSize: '14px',
                color: '#636E72',
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>{item.desc}</p>

              <Link href={item.link} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: item.color + '20',
                color: item.color,
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: '1px solid ' + item.color + '40'
              }}>
                {item.action} →
              </Link>
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
          marginBottom: '16px',
          color: '#2D3436'
        }}>
          为什么选择启程？
        </h2>
        <p style={{
          fontSize: '16px',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#636E72'
        }}>
          我们不只是任务平台，更是你的成长伙伴
        </p>
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

      {/* 企业端入口 */}
      <section className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{
          padding: '48px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #A8D8EA 0%, #D4A5F9 100%)',
          textAlign: 'center',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            企业合作伙伴
          </h2>
          <p style={{
            fontSize: '16px',
            marginBottom: '32px',
            opacity: 0.9
          }}>
            寻找优质的AI人才？发布任务，让AI为你匹配最合适的学生
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/company/register"
              style={{
                padding: '14px 32px',
                borderRadius: '24px',
                background: 'white',
                color: '#2D3436',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s'
              }}
            >
              企业注册
            </Link>
            <Link
              href="/company/login"
              style={{
                padding: '14px 32px',
                borderRadius: '24px',
                border: '2px solid white',
                background: 'transparent',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                transition: 'all 0.3s'
              }}
            >
              企业登录
            </Link>
          </div>
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
            准备好了吗？
          </h2>
          <p style={{
            fontSize: '16px',
            marginBottom: '32px',
            color: '#636E72'
          }}>
            不用想太多。注册，聊聊天，今天就能接到第一个任务。
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
