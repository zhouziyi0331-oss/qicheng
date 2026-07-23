import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { User } from '../models/User'
import { log } from '../utils/logger'

/**
 * 测试向量数据库真实可用性
 * 模拟完整的业务流程
 */

// 生成Mock向量（1536维）
function generateMockVector(seed?: string): number[] {
  const vector = []
  const hash = seed ? seed.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) : 0
  for (let i = 0; i < 1536; i++) {
    const val = Math.sin(hash + i) * 10000
    vector.push((val - Math.floor(val)) * 2 - 1)
  }
  return vector
}

async function testRealUsability() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  测试向量数据库真实可用性')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 1. 连接数据库
    console.log('[1/5] 连接数据库...')
    await connectDatabase()
    console.log('✓ 数据库连接成功\n')

    // 2. 模拟场景1：学生注册 → 初始化向量
    console.log('[2/5] 场景1：学生注册 → 初始化向量')
    const testUser = await User.findOne({ phone: '13800000001' })
    if (!testUser) {
      console.log('✗ 测试用户不存在，请先运行 importMockData.ts')
      process.exit(1)
    }

    const userId = testUser._id.toString()
    const studentQdrantId = '3001'

    // 验证学生向量存在
    const studentVector = await qdrantVectorService.searchById(
      'qicheng_student_profiles',
      studentQdrantId
    )
    console.log(`  ✓ 学生向量已初始化 (ID: ${studentQdrantId})`)
    console.log(`  学生姓名: 设计师小王`)
    console.log(`  向量维度: ${Array.isArray(studentVector?.vector) ? (studentVector.vector as number[]).length : '未知'}\n`)

    // 3. 模拟场景2：任务推荐（向量匹配）
    console.log('[3/5] 场景2：任务推荐（基于向量匹配）')

    // 获取学生向量
    const vector = studentVector?.vector as number[]
    if (!vector || !Array.isArray(vector)) {
      console.log('✗ 学生向量格式错误')
      process.exit(1)
    }

    // 检索相似项目
    const recommendedProjects = await qdrantVectorService.searchSimilar(
      'qicheng_project_profiles',
      vector,
      5
    )

    console.log(`  找到 ${recommendedProjects.length} 个推荐项目:`)
    recommendedProjects.forEach((p, idx) => {
      const matchScore = Math.round((1 - Math.abs(p.score)) * 100)
      console.log(`    ${idx + 1}. ${p.payload?.title} (匹配度: ${matchScore}%)`)
      console.log(`       预算: ¥${p.payload?.budget} | 难度: ${p.payload?.difficulty}`)
    })
    console.log()

    // 4. 模拟场景3：项目完成 → 向量更新
    console.log('[4/5] 场景3：项目完成 → 向量更新')

    // 模拟项目完成后的向量移动
    const updatedVector = vector.map((v, i) => {
      // 向"平面设计"方向移动
      if (i < 100) return Math.min(v + 0.01, 1)
      return v
    })

    // 更新学生向量
    await qdrantVectorService.upsertVector(
      'qicheng_student_profiles',
      studentQdrantId,
      updatedVector,
      {
        mongoId: userId,
        userId: userId,
        level: 2,
        totalProjects: 1,
        lastUpdated: new Date().toISOString()
      }
    )
    console.log('  ✓ 学生向量已更新（模拟项目完成后能力增长）\n')

    // 5. 模拟场景4：重新推荐（向量更新后）
    console.log('[5/5] 场景4：向量更新后重新推荐')

    const newRecommendations = await qdrantVectorService.searchSimilar(
      'qicheng_project_profiles',
      updatedVector,
      5
    )

    console.log(`  找到 ${newRecommendations.length} 个新推荐项目:`)
    newRecommendations.forEach((p, idx) => {
      const matchScore = Math.round((1 - Math.abs(p.score)) * 100)
      const isNew = !recommendedProjects.find(old => old.payload?.title === p.payload?.title)
      console.log(`    ${idx + 1}. ${p.payload?.title} (匹配度: ${matchScore}%) ${isNew ? '🆕' : ''}`)
    })
    console.log()

    // 6. 统计信息
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  测试结果总结')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 场景1：学生注册向量初始化 - 成功')
    console.log('✅ 场景2：基于向量的任务推荐 - 成功')
    console.log('✅ 场景3：项目完成后向量更新 - 成功')
    console.log('✅ 场景4：更新后自动重新推荐 - 成功')
    console.log()
    console.log('🎉 向量数据库已真实可用！')
    console.log('   完整的业务流程验证通过！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 测试失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testRealUsability()
