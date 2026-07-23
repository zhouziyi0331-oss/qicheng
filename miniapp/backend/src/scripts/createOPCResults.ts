import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { User } from '../models/User'
import { OPCResult } from '../models/OPCResult'
import mongoose from 'mongoose'

/**
 * 为测试用户创建OPC测评结果
 */

async function createOPCResults() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  创建测试用户的OPC结果')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await connectDatabase()

    // 3个测试用户的OPC数据
    const testOPCData = [
      {
        phone: '13800000001',
        name: '设计师小王',
        dimensions: {
          visual: 85,
          systematic: 60,
          creative: 80,
          logical: 55,
          stable: 90,
          exploratory: 65,
          execution: 85,
          communication: 70,
          learning: 75
        },
        personalityTag: '创意执行者'
      },
      {
        phone: '13800000002',
        name: '前端开发小李',
        dimensions: {
          visual: 60,
          systematic: 85,
          creative: 65,
          logical: 90,
          stable: 80,
          exploratory: 75,
          execution: 85,
          communication: 70,
          learning: 80
        },
        personalityTag: '系统构建者'
      },
      {
        phone: '13800000003',
        name: '产品经理小张',
        dimensions: {
          visual: 70,
          systematic: 80,
          creative: 75,
          logical: 85,
          stable: 75,
          exploratory: 80,
          execution: 70,
          communication: 90,
          learning: 85
        },
        personalityTag: '探索整合者'
      }
    ]

    let created = 0
    let updated = 0

    for (const data of testOPCData) {
      const user = await User.findOne({ phone: data.phone })
      if (!user) {
        console.log(`⚠ 用户 ${data.phone} 不存在，跳过`)
        continue
      }

      // 检查是否已有OPC结果
      const existing = await OPCResult.findOne({ userId: user._id })

      if (existing) {
        console.log(`✓ ${data.name} 已有OPC结果，更新`)
        existing.result.dimensionScores = [
          { dimension: 'visual', score: data.dimensions.visual },
          { dimension: 'systematic', score: data.dimensions.systematic },
          { dimension: 'creative', score: data.dimensions.creative },
          { dimension: 'logical', score: data.dimensions.logical },
          { dimension: 'stable', score: data.dimensions.stable },
          { dimension: 'exploratory', score: data.dimensions.exploratory },
          { dimension: 'execution', score: data.dimensions.execution },
          { dimension: 'communication', score: data.dimensions.communication },
          { dimension: 'learning', score: data.dimensions.learning }
        ]
        existing.result.personalityTag = data.personalityTag
        await existing.save()
        updated++
      } else {
        console.log(`✓ ${data.name} 创建新OPC结果`)
        await OPCResult.create({
          userId: user._id,
          answers: [],  // 简化，不填答案
          result: {
            personalityTag: data.personalityTag,
            dimensionScores: [
              { dimension: 'visual', score: data.dimensions.visual },
              { dimension: 'systematic', score: data.dimensions.systematic },
              { dimension: 'creative', score: data.dimensions.creative },
              { dimension: 'logical', score: data.dimensions.logical },
              { dimension: 'stable', score: data.dimensions.stable },
              { dimension: 'exploratory', score: data.dimensions.exploratory },
              { dimension: 'execution', score: data.dimensions.execution },
              { dimension: 'communication', score: data.dimensions.communication },
              { dimension: 'learning', score: data.dimensions.learning }
            ],
            strengths: ['执行力强', '学习能力强'],
            suggestions: ['继续保持']
          },
          completedAt: new Date()
        })
        created++
      }

      // 显示维度分数
      console.log(`   维度分数:`)
      console.log(`   - visual(视觉): ${data.dimensions.visual}`)
      console.log(`   - systematic(系统化): ${data.dimensions.systematic}`)
      console.log(`   - creative(创意): ${data.dimensions.creative}`)
      console.log(`   - logical(逻辑): ${data.dimensions.logical}`)
      console.log(`   - stable(稳定): ${data.dimensions.stable}`)
      console.log(`   - exploratory(探索): ${data.dimensions.exploratory}`)
      console.log(`   - execution(执行): ${data.dimensions.execution}`)
      console.log(`   - communication(沟通): ${data.dimensions.communication}`)
      console.log(`   - learning(学习): ${data.dimensions.learning}`)
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`✅ OPC结果创建完成`)
    console.log(`   新建: ${created}`)
    console.log(`   更新: ${updated}`)
    console.log(`   总计: ${created + updated}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 创建失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

createOPCResults()
