import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { RealProject } from '../models/RealProject'
import { User } from '../models/User'

dotenv.config()

/**
 * 创建已完成项目的测试数据
 * 模拟用户接单并完成项目
 */
const seedCompletedProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc')
    console.log('✓ 数据库连接成功\n')

    console.log('开始创建已完成项目...')

    // 获取测试用户（排除管理员）
    const users = await User.find({
      $or: [
        { role: 'user' },
        { role: { $exists: false } } // 兼容旧数据没有role字段的情况
      ]
    }).limit(3)
    if (users.length === 0) {
      console.error('❌ 没有找到测试用户，请先运行 npm run seed')
      process.exit(1)
    }

    console.log(`找到 ${users.length} 个测试用户`)

    // 获取一些available项目
    const availableProjects = await RealProject.find({ status: 'available' }).limit(5)
    if (availableProjects.length === 0) {
      console.error('❌ 没有可接单的项目')
      process.exit(1)
    }

    console.log(`找到 ${availableProjects.length} 个可接单项目`)

    // 模拟用户接单并完成项目
    const completedProjects = []

    for (let i = 0; i < Math.min(3, availableProjects.length); i++) {
      const project = availableProjects[i]
      const user = users[i % users.length]

      // 模拟接单
      project.userId = user._id
      project.projectNumber = await RealProject.countDocuments({
        userId: user._id,
        status: { $in: ['completed', 'in_progress'] }
      }) + 1
      project.status = 'completed'
      project.acceptedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前接单
      project.startedAt = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) // 28天前开始
      project.completedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前完成

      // 添加交付物
      project.deliverables = [
        {
          type: '文档',
          url: 'https://example.com/deliverable1.pdf',
          description: '项目方案完整文档'
        },
        {
          type: '源文件',
          url: 'https://example.com/source.zip',
          description: '项目源文件和素材'
        }
      ]

      // 计算收入（平台抽成15%）
      project.actualEarnings = project.budget
      project.platformCommission = Math.round(project.budget * 0.15 * 100) / 100
      project.netIncome = Math.round((project.budget - project.platformCommission) * 100) / 100

      // 添加能力成长记录
      project.abilitiesGained = project.requiredAbilities.slice(0, 2)
      project.abilitiesImproved = project.requiredAbilities

      await project.save()
      completedProjects.push(project)

      console.log(`✓ ${user.nickname} 完成了项目: ${project.title}`)
    }

    console.log(`\n✅ 成功创建 ${completedProjects.length} 个已完成项目`)
    console.log('\n项目详情:')
    completedProjects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title}`)
      console.log(`     - 完成者: ${users[i % users.length].nickname}`)
      console.log(`     - 项目ID: ${p._id}`)
      console.log(`     - 预算: ¥${p.budget}, 净收入: ¥${p.netIncome}`)
      console.log(`     - 完成时间: ${p.completedAt?.toISOString().split('T')[0]}`)
      console.log(`     - 客户评价: ${p.clientRating?.score ? '已评价' : '待评价'}`)
    })

    console.log('\n可以使用管理员API为这些项目添加客户评价了！')

  } catch (error) {
    console.error('❌ 创建失败:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n✓ 数据库连接已关闭')
    process.exit(0)
  }
}

seedCompletedProjects()
