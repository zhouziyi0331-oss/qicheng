import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { openai } from '../config/openai'
import { log } from '../utils/logger'

/**
 * 预生成所有静态向量
 * 这些向量在向量空间中作为锚点，学生向量会与它们计算距离
 */

// 成就定义（带向量）
const ACHIEVEMENTS = [
  { id: 'design_master', name: '设计大师', description: '擅长平面设计、UI设计、品牌设计', unlockThreshold: 0.3 },
  { id: 'visual_storyteller', name: '视觉叙事者', description: '擅长用图像讲故事、视觉叙事、对色彩敏感', unlockThreshold: 0.35 },
  { id: 'brand_designer', name: '品牌设计师', description: '擅长品牌设计、Logo设计、VI设计', unlockThreshold: 0.35 },
  { id: 'full_stack_developer', name: '全栈开发者', description: '擅长前端开发、后端开发、数据库设计', unlockThreshold: 0.3 },
  { id: 'frontend_expert', name: '前端专家', description: '擅长前端开发、UI界面设计、响应式设计', unlockThreshold: 0.35 },
  { id: 'system_architect', name: '系统架构师', description: '擅长架构设计、系统思考、从全局思考', unlockThreshold: 0.3 },
  { id: 'content_creator', name: '内容创作者', description: '擅长原创内容、短视频创作、文案策划', unlockThreshold: 0.35 },
  { id: 'video_master', name: '视频制作大师', description: '擅长短视频创作、视频剪辑', unlockThreshold: 0.3 },
  { id: 'growth_hacker', name: '增长黑客', description: '擅长数据分析、用户增长', unlockThreshold: 0.35 },
  { id: 'operation_expert', name: '运营专家', description: '擅长内容运营、用户运营、活动运营', unlockThreshold: 0.3 },
  { id: 'creative_executor', name: '创意执行者', description: '既有想法又能落地、快速原型能力、擅长创意发散', unlockThreshold: 0.35 },
  { id: 'problem_solver', name: '问题解决者', description: '擅长问题诊断、解决过技术难题', unlockThreshold: 0.35 },
  { id: 'fast_learner', name: '快速学习者', description: '擅长快速上手、知识迁移、从不会到精通某技能', unlockThreshold: 0.35 },
  { id: 'team_player', name: '团队协作者', description: '擅长团队协作、跨部门协作', unlockThreshold: 0.4 },
  { id: 'innovator', name: '创新者', description: '擅长跨界探索、敢于尝试未知、好奇心强', unlockThreshold: 0.35 }
]

// 职业路径定义
const CAREER_PATHS = [
  { id: 'brand_designer', name: '品牌设计师', description: '擅长品牌设计、视觉叙事、创意发散、平面设计' },
  { id: 'ui_designer', name: 'UI设计师', description: '擅长UI设计、界面设计、交互设计、用户体验' },
  { id: 'visual_designer', name: '视觉设计师', description: '擅长视觉设计、平面设计、色彩搭配、排版设计' },
  { id: 'product_designer', name: '产品设计师', description: '擅长产品设计、用户体验、交互设计、需求分析' },
  { id: 'frontend_engineer', name: '前端工程师', description: '擅长前端开发、JavaScript、React、Vue' },
  { id: 'fullstack_engineer', name: '全栈工程师', description: '擅长前端开发、后端开发、数据库设计、系统架构' },
  { id: 'backend_engineer', name: '后端工程师', description: '擅长后端开发、数据库设计、系统架构、API设计' },
  { id: 'content_operator', name: '内容运营', description: '擅长内容运营、文案策划、新媒体运营、用户运营' },
  { id: 'product_operator', name: '产品运营', description: '擅长产品运营、用户运营、数据分析、活动策划' },
  { id: 'growth_pm', name: '增长产品经理', description: '擅长用户增长、数据分析、AB测试、产品优化' }
]

// 技能定义
const SKILLS = [
  { id: 'user_research', name: '用户调研', description: '用户访谈、需求挖掘、用户分析' },
  { id: 'data_analysis', name: '数据分析', description: '数据分析、数据可视化、数据驱动决策' },
  { id: 'prototyping', name: '原型设计', description: '快速原型、低保真原型、高保真原型' },
  { id: 'design_system', name: '设计系统', description: '设计规范、组件库、设计体系' },
  { id: 'animation', name: '动效设计', description: '界面动画、交互动效、微动效' },
  { id: 'illustration', name: '插画', description: '手绘、数字插画、商业插画' },
  { id: 'copywriting', name: '文案撰写', description: '营销文案、产品文案、创意文案' },
  { id: 'video_editing', name: '视频剪辑', description: '视频剪辑、后期制作、特效' },
  { id: 'api_design', name: 'API设计', description: 'RESTful API、接口设计、API文档' },
  { id: 'database_design', name: '数据库设计', description: '关系型数据库、NoSQL、数据建模' },
  { id: 'system_design', name: '系统设计', description: '系统架构、分布式系统、高并发' },
  { id: 'testing', name: '测试', description: '单元测试、集成测试、自动化测试' },
  { id: 'agile', name: '敏捷开发', description: 'Scrum、看板、敏捷实践' },
  { id: 'communication', name: '沟通协作', description: '团队协作、跨部门沟通、会议主持' },
  { id: 'project_management', name: '项目管理', description: '项目规划、进度管理、风险控制' }
]

// 导师建议定义
const MENTOR_ADVICE = [
  {
    id: 'beginner_design',
    targetAudience: '设计新手',
    description: '刚开始学习设计、擅长视觉表达、需要提升系统化思维',
    message: '你在视觉表达上很有天赋！接下来建议你多做一些完整的项目，学习如何系统化地思考设计问题。',
    suggestions: [
      '尝试完成一个完整的品牌设计项目',
      '学习设计规范和设计系统',
      '多看优秀设计作品，分析背后的逻辑'
    ],
    nextSteps: [
      '找一个品牌设计项目实践',
      '学习Figma或Sketch的系统化使用',
      '建立自己的设计作品集'
    ]
  },
  {
    id: 'beginner_dev',
    targetAudience: '开发新手',
    description: '刚开始学习编程、擅长逻辑思维、需要提升实践能力',
    message: '你的逻辑思维很清晰！现在最重要的是多动手实践，把理论知识转化为实际项目经验。',
    suggestions: [
      '从小项目开始，完整走完开发流程',
      '学习Git版本控制',
      '多看优秀开源项目的代码'
    ],
    nextSteps: [
      '完成一个Todo List项目',
      '学习前端或后端框架',
      '在GitHub上建立个人项目'
    ]
  },
  {
    id: 'intermediate_design',
    targetAudience: '设计进阶者',
    description: '有一定设计经验、擅长视觉设计、需要提升用户体验思维',
    message: '你的设计作品已经很不错了！现在可以开始思考更深层次的用户体验和商业价值。',
    suggestions: [
      '学习用户调研方法',
      '深入理解业务需求',
      '培养数据驱动的设计思维'
    ],
    nextSteps: [
      '做一次完整的用户调研',
      '学习数据分析工具',
      '参与产品从0到1的全流程'
    ]
  },
  {
    id: 'intermediate_dev',
    targetAudience: '开发进阶者',
    description: '有一定开发经验、擅长功能实现、需要提升架构能力',
    message: '你已经能很好地实现功能了！接下来可以开始学习系统架构和代码质量的提升。',
    suggestions: [
      '学习设计模式',
      '重构已有代码',
      '学习系统架构设计'
    ],
    nextSteps: [
      '重构一个历史项目',
      '学习微服务架构',
      '阅读《代码大全》等经典书籍'
    ]
  },
  {
    id: 'advanced_all',
    targetAudience: '高级学习者',
    description: '有丰富经验、能力全面、需要找到专精方向',
    message: '你已经具备了很强的综合能力！现在可以考虑选择一个方向深入专精，或者尝试带领团队。',
    suggestions: [
      '确定自己的职业发展方向',
      '在某个领域深入研究',
      '尝试指导新人或分享经验'
    ],
    nextSteps: [
      '参与更有挑战性的项目',
      '建立个人品牌',
      '考虑转向管理或专家路线'
    ]
  }
]

async function generateStaticVectors() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  开始生成所有静态向量')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await connectDatabase()
    await qdrantVectorService.initializeCollections()

    // 1. 生成成就向量
    console.log('[1/4] 生成成就向量...')
    for (const achievement of ACHIEVEMENTS) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `成就：${achievement.name}。描述：${achievement.description}`
      })

      await qdrantVectorService.upsertVector(
        'qicheng_achievement_profiles',
        achievement.id,
        embedding.data[0].embedding,
        {
          name: achievement.name,
          description: achievement.description,
          unlockThreshold: achievement.unlockThreshold
        }
      )

      console.log(`  ✓ ${achievement.name}`)
    }

    // 2. 生成职业向量
    console.log('\n[2/4] 生成职业路径向量...')
    for (const career of CAREER_PATHS) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `职业：${career.name}。能力要求：${career.description}`
      })

      await qdrantVectorService.upsertVector(
        'qicheng_career_profiles',
        career.id,
        embedding.data[0].embedding,
        {
          name: career.name,
          description: career.description
        }
      )

      console.log(`  ✓ ${career.name}`)
    }

    // 3. 生成技能向量
    console.log('\n[3/4] 生成技能向量...')
    for (const skill of SKILLS) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `技能：${skill.name}。描述：${skill.description}`
      })

      await qdrantVectorService.upsertVector(
        'qicheng_skill_profiles',
        skill.id,
        embedding.data[0].embedding,
        {
          name: skill.name,
          description: skill.description
        }
      )

      console.log(`  ✓ ${skill.name}`)
    }

    // 4. 生成导师建议向量
    console.log('\n[4/4] 生成导师建议向量...')
    for (const advice of MENTOR_ADVICE) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `目标受众：${advice.targetAudience}。描述：${advice.description}`
      })

      await qdrantVectorService.upsertVector(
        'qicheng_mentor_advice',
        advice.id,
        embedding.data[0].embedding,
        {
          targetAudience: advice.targetAudience,
          description: advice.description,
          message: advice.message,
          suggestions: advice.suggestions,
          nextSteps: advice.nextSteps
        }
      )

      console.log(`  ✓ ${advice.targetAudience}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  所有静态向量生成完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  - 成就：${ACHIEVEMENTS.length}个`)
    console.log(`  - 职业：${CAREER_PATHS.length}个`)
    console.log(`  - 技能：${SKILLS.length}个`)
    console.log(`  - 导师建议：${MENTOR_ADVICE.length}个`)
    console.log(`  总计：${ACHIEVEMENTS.length + CAREER_PATHS.length + SKILLS.length + MENTOR_ADVICE.length}个向量`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (error: any) {
    console.error('✗ 生成静态向量失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

generateStaticVectors()
