import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { PracticeProject } from '../models/PracticeProject'
import { PracticeReport } from '../models/PracticeReport'
import { User } from '../models/User'
import { Collaboration } from '../models/Collaboration'
import { RealProject } from '../models/RealProject'
import { realProjectsData } from './seedData/realProjects.data'

dotenv.config()

/**
 * 数据库初始化脚本
 * 创建测试数据用于开发和演示
 */

export const seedDatabase = async () => {
  try {
    // 生产环境保护：禁止在生产环境运行seed脚本
    if (process.env.NODE_ENV === 'production') {
      throw new Error('🚫 禁止在生产环境运行seed脚本！这会创建测试数据污染生产数据库。')
    }

    console.log('⚠️  开始初始化数据库（仅开发/测试环境）...')
    console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`)

    // 清空现有数据（可选，生产环境请注释掉）
    // await User.deleteMany({})
    // await PracticeProject.deleteMany({})
    // await PracticeReport.deleteMany({})
    // await Collaboration.deleteMany({})

    // 创建测试用户（⚠️ 演示数据 - 仅用于开发测试）
    const testUsers = [
      {
        openId: 'admin_001',
        nickname: '系统管理员',
        avatar: '👑',
        role: 'admin',
        company: '启程OPC',
        level: 99,
        exp: 999999,
        totalIncome: 0,
        totalProjects: 0,
        rating: 5.0,
        isTestData: true  // 标记为测试数据
      },
      {
        openId: 'test_user_001',
        nickname: '张小白',
        avatar: '◆',
        company: '某互联网公司',
        track: 'content' as const,
        role: 'user',
        level: 3,
        exp: 1500,
        totalIncome: 25000,
        totalProjects: 5,
        rating: 4.8,
        wechatId: 'zhangxiaobai',
        phone: '13800138000',
        isTestData: true
      },
      {
        openId: 'test_user_002',
        nickname: '李开发',
        avatar: '○',
        company: '某科技公司',
        track: 'dev' as const,
        role: 'user',
        level: 4,
        exp: 2800,
        totalIncome: 45000,
        totalProjects: 9,
        rating: 4.9,
        wechatId: 'likaifa',
        phone: '13900139000',
        isTestData: true
      },
      {
        openId: 'test_user_003',
        nickname: '王运营',
        avatar: '▲',
        company: '某品牌公司',
        track: 'content' as const,
        role: 'user',
        level: 2,
        exp: 800,
        totalIncome: 12000,
        totalProjects: 3,
        rating: 4.5,
        wechatId: 'wangyunying',
        isTestData: true
      }
    ]

    const users = await User.insertMany(testUsers)
    console.log(`✓ 创建了 ${users.length} 个测试用户（包含1个管理员）[⚠️ 演示数据]`)

    // 创建测试项目
    const testProjects = [
      {
        userId: users[0]._id.toString(),
        title: '小红书美妆账号冷启动方案',
        company: '美妆品牌A',
        track: 'content' as const,
        status: 'completed' as const,
        tags: ['内容策略', '数据分析', '用户画像'],
        budget: 5000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-20'),
        progress: 100,
        description: '为美妆品牌设计小红书账号的0-1冷启动策略，通过精准人群定位和内容矩阵设计，实现快速起号',
        deliverables: [
          '目标人群画像分析报告（25-35岁职场女性）',
          '内容策略规划（60%科普+30%测评+10%生活）',
          '竞品对标分析（5个头部账号）',
          '前30天内容日历',
          '数据追踪看板'
        ],
        companyFeedback: '方案执行后，账号在第3周实现首次破千，转化率达到8%，超出预期。团队对人群定位和内容规划的准确性非常认可。',
        processData: {
          iterations: 3,
          revisionCount: 2,
          communicationCount: 8,
          toolsUsed: ['小红书数据分析工具', 'Figma', '问卷星']
        },
        scores: {
          execution: 92,
          problemSolving: 88,
          replicability: 90
        }
      },
      {
        userId: users[0]._id.toString(),
        title: '健身博主视频号变现策略',
        company: '健身工作室B',
        track: 'content' as const,
        status: 'completed' as const,
        tags: ['视频号运营', '私域转化', '变现设计'],
        budget: 6500,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-04-10'),
        progress: 100,
        description: '为健身教练设计视频号内容+私域转化+训练营变现的完整闭环',
        deliverables: [
          '视频号内容定位方案',
          '30条视频脚本库',
          '私域转化话术体系',
          '7天训练营产品设计',
          '引流-转化-留存全流程SOP'
        ],
        companyFeedback: '执行第一个月，通过视频号引流私域500+人，首期训练营成交率达35%，ROI达到1:4.2',
        processData: {
          iterations: 4,
          revisionCount: 3,
          communicationCount: 12,
          toolsUsed: ['剪映', '企业微信', '石墨文档']
        },
        scores: {
          execution: 95,
          problemSolving: 92,
          replicability: 88
        }
      },
      {
        userId: users[0]._id.toString(),
        title: '母婴品牌抖音内容矩阵搭建',
        company: '母婴品牌C',
        track: 'content' as const,
        status: 'ongoing' as const,
        tags: ['抖音运营', '矩阵账号', '品牌传播'],
        budget: 8000,
        startDate: new Date('2024-05-15'),
        expectedEndDate: new Date('2024-07-15'),
        progress: 65,
        description: '为母婴品牌设计1个品牌主账号+3个垂类分账号的矩阵体系，实现品牌曝光+精准转化双目标',
        deliverables: [
          '矩阵账号架构设计',
          '4个账号的定位和人设',
          '内容选题库（100+）',
          '投放策略建议',
          '数据监测体系'
        ],
        processData: {
          iterations: 2,
          revisionCount: 1,
          communicationCount: 6,
          toolsUsed: ['飞瓜数据', '抖音创作者平台']
        }
      },
      {
        userId: users[1]._id.toString(),
        title: '企业官网前端重构项目',
        company: '科技公司D',
        track: 'dev' as const,
        status: 'completed' as const,
        tags: ['React', 'TypeScript', '性能优化'],
        budget: 15000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-20'),
        progress: 100,
        description: '使用React+TypeScript重构企业官网，提升性能和用户体验',
        deliverables: [
          '响应式前端页面（5个核心页面）',
          '组件库搭建（20+组件）',
          '性能优化方案（首屏加载<1.5s）',
          'SEO优化',
          '后台管理系统'
        ],
        companyFeedback: '重构后网站首屏加载速度从4.2s降至1.3s，跳出率下降40%，客户咨询转化率提升25%',
        processData: {
          iterations: 5,
          revisionCount: 4,
          communicationCount: 15,
          toolsUsed: ['React', 'TypeScript', 'Vite', 'Tailwind CSS']
        },
        scores: {
          execution: 94,
          problemSolving: 90,
          replicability: 92
        }
      }
    ]

    const projects = await PracticeProject.insertMany(testProjects)
    console.log(`✓ 创建了 ${projects.length} 个测试项目`)

    // 为已完成的项目创建报告
    const completedProjects = projects.filter(p => p.status === 'completed')

    const testReports = [
      {
        projectId: completedProjects[0]._id.toString(),
        userId: users[0]._id.toString(),
        whatDid: {
          description: '通过系统化的内容策略和精准的人群定位，帮助美妆品牌从0搭建小红书账号',
          items: [
            '深度分析目标人群（25-35岁职场女性），挖掘其护肤痛点和消费决策路径',
            '设计60%科普+30%测评+10%生活的内容矩阵，平衡专业性与亲和力',
            '对标5个头部账号，找到差异化切入点（专注敏感肌+职场场景）',
            '制定前30天内容日历，确保话题多样性和发布节奏',
            '搭建数据追踪看板，实时监控阅读、互动、转化等核心指标'
          ]
        },
        problemSolved: {
          coreIssue: '品牌在小红书投放2个月没起色，内容同质化严重，不知道如何差异化定位',
          rootCause: '缺少清晰的人群定位，内容跟风头部博主，没有找到自己的差异化价值点。同时缺少数据驱动的优化机制。',
          improvement: {
            label: '账号互动率',
            before: 1.2,
            after: 6.8
          }
        },
        replicability: {
          description: '这套"人群定位→内容矩阵→数据优化"的方法论，可以快速复制到其他垂直领域的账号冷启动场景',
          industries: [
            { name: '护肤品牌', icon: '◆', level: 'high' as const },
            { name: '健身博主', icon: '▲', level: 'high' as const },
            { name: '家居品牌', icon: '○', level: 'medium' as const },
            { name: '教育机构', icon: '◈', level: 'medium' as const },
            { name: '宠物博主', icon: '✦', level: 'high' as const }
          ]
        },
        learned: {
          highlight: '掌握了从0到1搭建内容账号的完整方法论，学会用数据驱动内容优化',
          items: [
            '垂直人群定位能力：能够通过画像分析找到精准人群的真实痛点',
            '内容策略规划能力：能够设计符合平台算法和用户偏好的内容矩阵',
            '竞品分析能力：能够通过对标找到市场空白和差异化机会',
            '数据分析能力：能够搭建数据看板并根据数据优化策略',
            '项目管理能力：能够制定执行计划并跟进落地效果'
          ]
        },
        rewards: {
          exp: 500,
          income: 5000,
          cases: 1
        }
      },
      {
        projectId: completedProjects[1]._id.toString(),
        userId: users[0]._id.toString(),
        whatDid: {
          description: '为健身教练设计从视频号引流到私域转化再到训练营变现的完整商业闭环',
          items: [
            '定位视频号内容方向（办公室健身+碎片化训练）',
            '编写30条视频脚本库，覆盖不同场景和人群痛点',
            '设计私域转化话术体系（钩子-价值-促单）',
            '打磨7天训练营产品（课程内容+社群运营+转化设计）',
            '梳理完整的引流-转化-留存SOP，可快速复制'
          ]
        },
        problemSolved: {
          coreIssue: '教练有专业能力但不会做流量，线下获客成本高（200元/人），转化率低',
          rootCause: '缺少线上流量渠道，没有私域运营经验，产品设计不够标准化，无法规模化复制。',
          improvement: {
            label: '获客成本',
            before: 200,
            after: 45
          }
        },
        replicability: {
          description: '这套"短视频引流+私域转化+训练营变现"的闭环模式，适用于所有技能型个人IP',
          industries: [
            { name: '瑜伽教练', icon: '◆', level: 'high' as const },
            { name: '营养师', icon: '▲', level: 'high' as const },
            { name: '心理咨询师', icon: '○', level: 'medium' as const },
            { name: '理财规划师', icon: '◈', level: 'medium' as const }
          ]
        },
        learned: {
          highlight: '学会了设计完整的商业闭环，不只是做内容，而是从流量到变现的全链路思考',
          items: [
            '短视频内容策划：能够设计符合平台推荐机制的爆款选题',
            '私域转化设计：能够设计钩子、价值、促单的完整话术体系',
            '产品设计能力：能够把服务标准化成可交付的产品',
            'SOP流程化：能够把复杂业务拆解成可复制的标准流程',
            '商业闭环思维：从流量、转化、留存全链路思考商业模式'
          ]
        },
        rewards: {
          exp: 650,
          income: 6500,
          cases: 1
        }
      },
      {
        projectId: completedProjects[2]._id.toString(),
        userId: users[1]._id.toString(),
        whatDid: {
          description: '使用React+TypeScript对企业官网进行全面重构，提升性能和用户体验',
          items: [
            '搭建React+TypeScript+Vite现代化前端架构',
            '开发20+可复用组件库（按钮、表单、卡片等）',
            '实现响应式布局，适配移动端和桌面端',
            '首屏加载优化：代码分割、懒加载、图片压缩',
            'SEO优化：SSR渲染、meta标签、sitemap',
            '开发后台管理系统，支持内容动态更新'
          ]
        },
        problemSolved: {
          coreIssue: '旧官网技术栈老旧（jQuery），加载慢（4.2s），跳出率高（65%），难以维护',
          rootCause: '技术债积累导致代码冗余，缺少组件化和模块化设计，未做性能优化，SEO效果差。',
          improvement: {
            label: '首屏加载时间',
            before: 4.2,
            after: 1.3
          }
        },
        replicability: {
          description: '这套React+TypeScript的现代化前端架构，可以应用到任何企业官网或营销站点',
          industries: [
            { name: 'B2B企业官网', icon: '◆', level: 'high' as const },
            { name: 'SaaS产品站', icon: '▲', level: 'high' as const },
            { name: '品牌展示站', icon: '○', level: 'high' as const },
            { name: '电商官网', icon: '◈', level: 'medium' as const }
          ]
        },
        learned: {
          highlight: '掌握了现代化前端架构设计和性能优化的完整技能体系',
          items: [
            'React架构设计：组件化、状态管理、路由设计',
            'TypeScript类型系统：提升代码质量和可维护性',
            '性能优化：代码分割、懒加载、缓存策略',
            'SEO优化：SSR、meta优化、结构化数据',
            '工程化能力：构建工具、代码规范、自动化测试'
          ]
        },
        rewards: {
          exp: 1500,
          income: 15000,
          cases: 1
        }
      }
    ]

    const reports = await PracticeReport.insertMany(testReports)
    console.log(`✓ 创建了 ${reports.length} 个测试报告`)

    // 创建合作记录
    const testCollaborations = [
      {
        projectId: projects[0]._id.toString(),
        masterId: users[1]._id.toString(),
        studentId: users[0]._id.toString(),
        role: 'student' as const,
        status: 'completed' as const,
        rating: 5,
        review: '非常专业，方案落地效果超出预期',
        completedAt: new Date('2024-02-20')
      },
      {
        projectId: projects[1]._id.toString(),
        masterId: users[1]._id.toString(),
        studentId: users[0]._id.toString(),
        role: 'student' as const,
        status: 'completed' as const,
        rating: 5,
        review: '执行力强，商业思维清晰',
        completedAt: new Date('2024-04-10')
      },
      {
        projectId: projects[3]._id.toString(),
        masterId: users[2]._id.toString(),
        studentId: users[1]._id.toString(),
        role: 'student' as const,
        status: 'completed' as const,
        rating: 5,
        review: '技术能力扎实，交付质量高',
        completedAt: new Date('2024-03-20')
      }
    ]

    const collaborations = await Collaboration.insertMany(testCollaborations)
    console.log(`✓ 创建了 ${collaborations.length} 个合作记录`)

    // 创建真实可接单项目
    const realProjects = await RealProject.insertMany(realProjectsData)
    console.log(`✓ 创建了 ${realProjects.length} 个可接单的真实项目`)

    console.log('\n✅ 数据库初始化完成！')
    console.log('\n测试账号:')
    console.log(`  管理员ID: ${users[0]._id} (系统管理员 - admin权限)`)
    console.log(`  用户ID: ${users[1]._id} (张小白 - 内容赛道)`)
    console.log(`  用户ID: ${users[2]._id} (李开发 - 开发赛道)`)
    console.log(`  用户ID: ${users[3]._id} (王运营 - 内容赛道)`)
    console.log(`\n测试项目ID:`)
    projects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p._id} - ${p.title}`)
    })
    console.log(`\n真实可接单项目: ${realProjects.length}个`)
    console.log('可以开始测试API了！')

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  }
}

// 执行seed
const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc')
    console.log('✓ 数据库连接成功\n')

    await seedDatabase()
  } catch (error) {
    console.error('运行失败:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n✓ 数据库连接已关闭')
    process.exit(0)
  }
}

runSeed()
