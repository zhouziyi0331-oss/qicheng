import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { RealProject } from '../models/RealProject'
import { realProjectsData } from './seedData/realProjects.data'

dotenv.config()

/**
 * 导入真实可接单项目
 */
const seedRealProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc')
    console.log('✓ 数据库连接成功\n')

    console.log('开始导入真实项目...')

    // 清空现有的available项目（可选）
    const existingCount = await RealProject.countDocuments({ status: 'available' })
    console.log(`现有可接单项目: ${existingCount}个`)

    const realProjects = await RealProject.insertMany(realProjectsData)
    console.log(`✓ 成功导入 ${realProjects.length} 个真实项目\n`)

    console.log('项目列表:')
    realProjects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.category}, ${p.difficulty}, ¥${p.budget})`)
    })

    console.log('\n✅ 真实项目导入完成！')
  } catch (error) {
    console.error('❌ 导入失败:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n✓ 数据库连接已关闭')
    process.exit(0)
  }
}

seedRealProjects()
