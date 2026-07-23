import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { Tag } from '../models/Tag'
import { User } from '../models/User'
import { StudentTagProfile } from '../models/Tag'
import { log } from '../utils/logger'

/**
 * 使用Mock向量完整导入数据
 * 目标：让向量数据库真正可用
 */

// 生成Mock向量（1536维）
function generateMockVector(seed?: string): number[] {
  const vector = []
  // 使用种子生成一致的向量
  const hash = seed ? seed.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) : 0
  for (let i = 0; i < 1536; i++) {
    const val = Math.sin(hash + i) * 10000
    vector.push((val - Math.floor(val)) * 2 - 1) // -1 到 1
  }
  return vector
}

// 50个核心标签
const CORE_TAGS = [
  // 设计类
  { name: '平面设计', category: 'advantage', description: '擅长平面设计、视觉设计' },
  { name: '视觉叙事', category: 'advantage', description: '擅长用图像讲故事' },
  { name: '配色能力', category: 'advantage', description: '对色彩搭配敏感' },
  { name: 'UI设计', category: 'advantage', description: '用户界面设计' },
  { name: '品牌设计', category: 'advantage', description: '品牌视觉设计' },

  // 开发类
  { name: '前端开发', category: 'advantage', description: '擅长前端开发' },
  { name: '后端开发', category: 'advantage', description: '擅长后端开发' },
  { name: 'React开发', category: 'skill', description: 'React框架开发' },
  { name: 'Vue开发', category: 'skill', description: 'Vue框架开发' },
  { name: 'Node.js', category: 'skill', description: 'Node.js后端开发' },

  // 产品类
  { name: '用户研究', category: 'skill', description: '用户调研和需求分析' },
  { name: '原型设计', category: 'skill', description: '快速原型制作' },
  { name: '产品规划', category: 'skill', description: '产品策略和规划' },
  { name: '需求分析', category: 'skill', description: '业务需求分析' },
  { name: '用户体验', category: 'advantage', description: 'UX设计和优化' },

  // 数据类
  { name: '数据分析', category: 'skill', description: '数据分析能力' },
  { name: 'SQL', category: 'skill', description: '数据库查询' },
  { name: 'Python', category: 'skill', description: 'Python编程' },
  { name: '数据可视化', category: 'skill', description: '数据可视化' },

  // 营销类
  { name: '内容创作', category: 'advantage', description: '内容创作和编辑' },
  { name: '文案撰写', category: 'advantage', description: '文案撰写能力' },
  { name: '社交媒体运营', category: 'skill', description: '社交媒体运营' },
  { name: 'SEO优化', category: 'skill', description: '搜索引擎优化' },

  // 通用技能
  { name: '项目管理', category: 'skill', description: '项目管理和协调' },
  { name: '沟通协作', category: 'skill', description: '团队沟通和协作' },
  { name: '时间管理', category: 'skill', description: '时间规划和管理' },
  { name: '问题解决', category: 'skill', description: '问题分析和解决' },
  { name: '学习能力', category: 'advantage', description: '快速学习新技能' },
  { name: '创新思维', category: 'advantage', description: '创新和创意思维' },

  // 行业经验
  { name: '电商行业', category: 'industry', description: '电商行业经验' },
  { name: '教育行业', category: 'industry', description: '教育行业经验' },
  { name: '金融行业', category: 'industry', description: '金融行业经验' },
  { name: '医疗行业', category: 'industry', description: '医疗健康行业经验' },
  { name: '游戏行业', category: 'industry', description: '游戏行业经验' },
  { name: '企业服务', category: 'industry', description: 'B2B企业服务经验' },

  // 工具技能
  { name: 'Figma', category: 'tool', description: 'Figma设计工具' },
  { name: 'Photoshop', category: 'tool', description: 'PS图像处理' },
  { name: 'Illustrator', category: 'tool', description: 'AI矢量设计' },
  { name: 'Git', category: 'tool', description: '版本控制工具' },
  { name: 'Axure', category: 'tool', description: '原型设计工具' },

  // 软技能
  { name: '批判性思维', category: 'soft_skill', description: '批判性思维能力' },
  { name: '情商高', category: 'soft_skill', description: '高情商沟通' },
  { name: '抗压能力', category: 'soft_skill', description: '压力管理能力' },
  { name: '自驱力', category: 'soft_skill', description: '自我驱动能力' },
  { name: '团队协作', category: 'soft_skill', description: '团队合作精神' },

  // 专业深度
  { name: '系统架构', category: 'expertise', description: '系统架构设计' },
  { name: '算法能力', category: 'expertise', description: '算法和数据结构' },
  { name: '性能优化', category: 'expertise', description: '系统性能优化' },
  { name: '安全防护', category: 'expertise', description: '网络安全防护' }
]

async function importMockData() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  使用Mock向量导入完整数据')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 1. 连接数据库
    console.log('[1/5] 连接数据库...')
    await connectDatabase()
    console.log('✓ 数据库连接成功\n')

    // 2. 初始化Qdrant
    console.log('[2/5] 初始化Qdrant...')
    await qdrantVectorService.initializeCollections()
    console.log('✓ Qdrant初始化完成\n')

    // 3. 导入50个核心标签
    console.log('[3/5] 导入50个核心标签...')
    const tags = []
    for (let i = 0; i < CORE_TAGS.length; i++) {
      const tagData = CORE_TAGS[i]

      // 创建标签
      const tag = await Tag.findOneAndUpdate(
        { name: tagData.name },
        {
          ...tagData,
          weight: 1.0,
          type: 'student'
        },
        { upsert: true, new: true }
      )
      tags.push(tag)

      // 生成向量（基于标签名生成一致的向量）
      const vector = generateMockVector(tagData.name + tagData.description)

      // 插入Qdrant
      const qdrantId = (i + 2001).toString()
      await qdrantVectorService.upsertVector(
        'qicheng_tags',
        qdrantId,
        vector,
        {
          mongoId: tag._id.toString(),
          name: tag.name,
          category: tag.category,
          description: tag.description,
          weight: tag.weight
        }
      )

      if ((i + 1) % 10 === 0) {
        console.log(`  已导入 ${i + 1}/${CORE_TAGS.length} 个标签`)
      }
    }
    console.log(`✓ 导入完成: ${CORE_TAGS.length}个标签\n`)

    // 4. 创建测试学生
    console.log('[4/5] 创建测试学生...')
    const students = [
      {
        phone: '13800000001',
        name: '设计师小王',
        tags: ['平面设计', '视觉叙事', '配色能力', 'Photoshop', 'Figma']
      },
      {
        phone: '13800000002',
        name: '前端开发小李',
        tags: ['前端开发', 'React开发', 'Vue开发', 'Git', 'UI设计']
      },
      {
        phone: '13800000003',
        name: '产品经理小张',
        tags: ['用户研究', '原型设计', '产品规划', '需求分析', 'Axure']
      }
    ]

    for (let i = 0; i < students.length; i++) {
      const studentData = students[i]

      // 创建用户
      const user = await User.findOneAndUpdate(
        { phone: studentData.phone },
        {
          name: studentData.name,
          phone: studentData.phone,
          openId: `mock_openid_${studentData.phone}`, // 添加openId避免唯一索引冲突
          level: 1 + i,
          experience: i * 100,
          personalityTag: studentData.tags[0]
        },
        { upsert: true, new: true }
      )

      // 生成学生向量（基于标签组合）
      const vectorSeed = studentData.tags.join('_')
      const vector = generateMockVector(vectorSeed)

      // 插入Qdrant
      const qdrantId = (3001 + i).toString()
      await qdrantVectorService.upsertVector(
        'qicheng_student_profiles',
        qdrantId,
        vector,
        {
          mongoId: user._id.toString(),
          userId: user._id.toString(),
          level: user.level,
          totalProjects: i * 3,
          lastUpdated: new Date().toISOString()
        }
      )

      // 创建StudentTagProfile（MongoDB中的学生画像）
      const tagIds = await Promise.all(
        studentData.tags.map(async (tagName) => {
          const tag = await Tag.findOne({ name: tagName })
          return tag ? tag._id : null
        })
      )

      await StudentTagProfile.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          tags: tagIds
            .filter(Boolean)
            .map((tagId, idx) => ({
              tagId: tagId,
              weight: 0.8 - idx * 0.1, // 第一个技能权重0.8，依次递减
              source: 'system' as const,
              confidence: 0.8,
              addedAt: new Date()
            }))
        },
        { upsert: true, new: true }
      )

      console.log(`  ✓ ${studentData.name}`)
    }
    console.log(`✓ 创建完成: ${students.length}个测试学生\n`)

    // 5. 创建测试项目
    console.log('[5/5] 创建测试项目...')
    const projects = [
      { title: '品牌海报设计', tags: ['平面设计', '视觉叙事', '品牌设计'], difficulty: 'medium', budget: 500 },
      { title: 'Logo设计', tags: ['平面设计', '品牌设计', 'Illustrator'], difficulty: 'easy', budget: 300 },
      { title: '网站UI设计', tags: ['UI设计', 'Figma', '用户体验'], difficulty: 'hard', budget: 800 },
      { title: '电商小程序开发', tags: ['前端开发', 'React开发', '电商行业'], difficulty: 'hard', budget: 1500 },
      { title: '数据可视化大屏', tags: ['前端开发', '数据可视化', 'Vue开发'], difficulty: 'medium', budget: 1000 },
      { title: '产品原型设计', tags: ['原型设计', '用户研究', 'Axure'], difficulty: 'easy', budget: 400 },
      { title: '用户调研报告', tags: ['用户研究', '数据分析', '内容创作'], difficulty: 'medium', budget: 600 },
      { title: '小红书运营方案', tags: ['社交媒体运营', '内容创作', '文案撰写'], difficulty: 'easy', budget: 500 }
    ]

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]

      // 生成项目向量（基于标签组合）
      const vectorSeed = project.tags.join('_') + project.title
      const vector = generateMockVector(vectorSeed)

      // 插入Qdrant
      const qdrantId = (4001 + i).toString()
      await qdrantVectorService.upsertVector(
        'qicheng_project_profiles',
        qdrantId,
        vector,
        {
          projectId: qdrantId,
          title: project.title,
          tags: project.tags,
          difficulty: project.difficulty,
          budget: project.budget,
          status: 'available'
        }
      )

      console.log(`  ✓ ${project.title}`)
    }
    console.log(`✓ 创建完成: ${projects.length}个测试项目\n`)

    // 6. 测试向量检索
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  测试向量检索功能')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 获取第一个学生的向量
    const student1Vector = generateMockVector(students[0].tags.join('_'))

    console.log(`【学生】${students[0].name}`)
    console.log(`标签: ${students[0].tags.join(', ')}\n`)

    // 检索相似项目
    console.log('推荐项目:')
    const similarProjects = await qdrantVectorService.searchSimilar(
      'qicheng_project_profiles',
      student1Vector,
      5
    )
    similarProjects.forEach((p, idx) => {
      const match = Math.round((1 - Math.abs(p.score)) * 100)
      console.log(`  ${idx + 1}. ${p.payload?.title} (匹配度: ${match}%)`)
    })

    console.log('\n相似标签:')
    const similarTags = await qdrantVectorService.searchSimilar(
      'qicheng_tags',
      student1Vector,
      10
    )
    similarTags.forEach((t, idx) => {
      console.log(`  ${idx + 1}. ${t.payload?.name}`)
    })

    // 统计
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  数据统计')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`标签: ${CORE_TAGS.length}个`)
    console.log(`学生: ${students.length}个`)
    console.log(`项目: ${projects.length}个`)

    console.log('\n✅ 向量数据库已完整可用！\n')
    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 导入失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

importMockData()
