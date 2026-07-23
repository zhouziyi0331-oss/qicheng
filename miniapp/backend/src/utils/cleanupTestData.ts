import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from '../models/User'
import { PracticeProject } from '../models/PracticeProject'
import { PracticeReport } from '../models/PracticeReport'
import { Collaboration } from '../models/Collaboration'
import { RealProject } from '../models/RealProject'
import { Assessment } from '../models/Assessment'
import { AbilityRadar } from '../models/AbilityRadar'
import { Income } from '../models/Income'
import { Withdrawal } from '../models/Withdrawal'
import { SecretSpace } from '../models/SecretSpace'
import { Achievement } from '../models/Achievement'

dotenv.config()

/**
 * 清理测试数据脚本
 * 删除所有标记为测试数据的记录
 */

export const cleanupTestData = async () => {
  try {
    // 生产环境警告
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  警告: 正在生产环境中运行清理脚本')
      console.log('请确认要删除测试数据...')
    }

    console.log('🗑️  开始清理测试数据...')

    // 查找所有测试用户
    const testUsers = await User.find({ isTestData: true })
    const testUserIds = testUsers.map(u => u._id)

    console.log(`找到 ${testUsers.length} 个测试用户`)

    if (testUserIds.length === 0) {
      console.log('✓ 没有测试数据需要清理')
      return
    }

    // 删除测试用户相关的所有数据
    const results = await Promise.all([
      // 删除测试用户
      User.deleteMany({ isTestData: true }),

      // 删除测试用户的项目
      PracticeProject.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的报告
      PracticeReport.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的协作
      Collaboration.deleteMany({
        $or: [
          { fromUserId: { $in: testUserIds } },
          { toUserId: { $in: testUserIds } }
        ]
      }),

      // 删除测试用户的真实项目
      RealProject.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的测评
      Assessment.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的能力雷达
      AbilityRadar.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的收入
      Income.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的提现
      Withdrawal.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的秘密空间
      SecretSpace.deleteMany({ userId: { $in: testUserIds } }),

      // 删除测试用户的成就
      Achievement.deleteMany({ userId: { $in: testUserIds } })
    ])

    console.log('\n📊 清理结果:')
    console.log(`  - 用户: ${results[0].deletedCount}`)
    console.log(`  - 练习项目: ${results[1].deletedCount}`)
    console.log(`  - 练习报告: ${results[2].deletedCount}`)
    console.log(`  - 协作记录: ${results[3].deletedCount}`)
    console.log(`  - 真实项目: ${results[4].deletedCount}`)
    console.log(`  - 测评记录: ${results[5].deletedCount}`)
    console.log(`  - 能力雷达: ${results[6].deletedCount}`)
    console.log(`  - 收入记录: ${results[7].deletedCount}`)
    console.log(`  - 提现记录: ${results[8].deletedCount}`)
    console.log(`  - 秘密空间: ${results[9].deletedCount}`)
    console.log(`  - 成就记录: ${results[10].deletedCount}`)

    const totalDeleted = results.reduce((sum: number, r: any) => sum + r.deletedCount, 0)
    console.log(`\n✓ 总共清理了 ${totalDeleted} 条测试数据`)

  } catch (error: any) {
    console.error('❌ 清理测试数据失败:', error.message)
    throw error
  }
}

// 直接运行
if (require.main === module) {
  const run = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng')
      console.log('✓ 已连接到数据库')

      await cleanupTestData()

      await mongoose.connection.close()
      console.log('\n✓ 数据库连接已关闭')
      process.exit(0)
    } catch (error) {
      console.error('执行失败:', error)
      process.exit(1)
    }
  }

  run()
}
