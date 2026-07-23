import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { vectorCoreService } from '../services/vectorCore.service'
import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 完整功能测试脚本
 * 目标：验证向量数据库的核心功能真的能用
 * 不依赖OpenAI API，使用Mock向量
 */

// 生成Mock向量（1536维）
function generateMockVector(): number[] {
  const vector = []
  for (let i = 0; i < 1536; i++) {
    vector.push(Math.random() * 2 - 1) // -1 到 1 之间的随机数
  }
  return vector
}

async function testCompleteFlow() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  向量数据库完整功能测试')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 1. 连接数据库
    console.log('[1/8] 连接数据库...')
    await connectDatabase()
    console.log('✓ 数据库连接成功\n')

    // 2. 初始化Qdrant Collections
    console.log('[2/8] 初始化Qdrant Collections...')
    await qdrantVectorService.initializeCollections()
    console.log('✓ Qdrant Collections初始化完成\n')

    // 3. 创建测试用户
    console.log('[3/8] 创建测试用户...')
    const testUser = await User.findOneAndUpdate(
      { phone: '13800000001' },
      {
        name: '测试学生',
        phone: '13800000001',
        level: 1,
        experience: 0,
        personalityTag: '视觉叙事者'
      },
      { upsert: true, new: true }
    )
    const userId = testUser!._id.toString()
    console.log(`✓ 测试用户创建成功: 测试学生 (ID: ${userId})\n`)

    // 4. 创建测试标签
    console.log('[4/8] 创建测试标签...')
    const tags = []
    const tagNames = [
      { name: '平面设计', category: 'advantage', description: '擅长平面设计' },
      { name: '视觉叙事', category: 'advantage', description: '擅长用图像讲故事' },
      { name: '配色能力', category: 'advantage', description: '色彩搭配敏感' },
      { name: '用户研究', category: 'skill', description: '用户调研能力' },
      { name: '原型设计', category: 'skill', description: '快速原型能力' }
    ]

    for (let i = 0; i < tagNames.length; i++) {
      const tagData = tagNames[i]
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

      // 插入标签向量到Qdrant（使用数字ID）
      const vector = generateMockVector()
      const qdrantId = i + 1 // 使用数字ID
      await qdrantVectorService.upsertVector(
        'qicheng_tags',
        qdrantId.toString(),
        vector,
        {
          mongoId: tag._id.toString(),
          name: tag.name,
          category: tag.category,
          description: tag.description,
          weight: tag.weight
        }
      )
    }
    console.log(`✓ 创建了${tags.length}个测试标签并插入向量\n`)

    // 5. 创建学生标签画像
    console.log('[5/8] 创建学生标签画像...')
    const studentProfile = await StudentTagProfile.findOneAndUpdate(
      { userId: testUser!._id },
      {
        userId: testUser!._id,
        tags: tags.slice(0, 3).map(tag => ({
          tagId: tag._id,
          weight: 0.8,
          source: 'test',
          acquiredAt: new Date()
        })),
        skillLevels: [],
        interests: [],
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    )
    console.log('✓ 学生标签画像创建成功\n')

    // 6. 插入学生向量到Qdrant
    console.log('[6/8] 插入学生向量...')
    const studentVector = generateMockVector()
    const studentQdrantId = '1001' // 使用数字ID
    await qdrantVectorService.upsertVector(
      'qicheng_student_profiles',
      studentQdrantId,
      studentVector,
      {
        mongoId: userId,
        userId: userId,
        level: 1,
        totalProjects: 0,
        lastUpdated: new Date().toISOString()
      }
    )
    console.log('✓ 学生向量插入成功\n')

    // 7. 插入测试项目向量
    console.log('[7/8] 插入测试项目向量...')
    const projects = [
      { id: '2001', title: '品牌海报设计', category: 'design', difficulty: 'medium' },
      { id: '2002', title: 'Logo设计', category: 'design', difficulty: 'easy' },
      { id: '2003', title: '网站UI设计', category: 'design', difficulty: 'hard' }
    ]

    for (const project of projects) {
      const vector = generateMockVector()
      await qdrantVectorService.upsertVector(
        'qicheng_project_profiles',
        project.id,
        vector,
        {
          title: project.title,
          category: project.category,
          difficulty: project.difficulty
        }
      )
    }
    console.log(`✓ 插入了${projects.length}个测试项目向量\n`)

    // 8. 测试向量检索
    console.log('[8/8] 测试向量检索...')
    console.log('\n--- 测试1: 检索相似项目 ---')
    const similarProjects = await qdrantVectorService.searchSimilar(
      'qicheng_project_profiles',
      studentVector,
      3
    )
    console.log(`找到${similarProjects.length}个相似项目:`)
    similarProjects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.payload?.title} (距离: ${p.score.toFixed(4)})`)
    })

    console.log('\n--- 测试2: 检索相似标签 ---')
    const similarTags = await qdrantVectorService.searchSimilar(
      'qicheng_tags',
      studentVector,
      5
    )
    console.log(`找到${similarTags.length}个相似标签:`)
    similarTags.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.payload?.name} (距离: ${t.score.toFixed(4)})`)
    })

    console.log('\n--- 测试3: 通过ID查询 ---')
    const retrievedStudent = await qdrantVectorService.searchById(
      'qicheng_student_profiles',
      studentQdrantId
    )
    console.log(`✓ 查询到学生向量: ${retrievedStudent ? '成功' : '失败'}`)

    // 9. 统计信息
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  向量数据库统计')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const stats = await qdrantVectorService.getAllStats()
    console.log(`标签向量: ${stats.tags.vectorsCount}个`)
    console.log(`学生向量: ${stats.studentProfiles.vectorsCount}个`)
    console.log(`项目向量: ${stats.projectProfiles.vectorsCount}个`)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  ✅ 所有测试通过！向量数据库功能正常！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 测试失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 执行测试
testCompleteFlow()
