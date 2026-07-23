import dotenv from 'dotenv'
import { connectDatabase } from '../config/database'
import { seedDatabase } from '../utils/seed'
import mongoose from 'mongoose'

dotenv.config()

const runSeed = async () => {
  try {
    console.log('连接数据库...')
    await connectDatabase()

    console.log('开始填充测试数据...')
    await seedDatabase()

    console.log('\n✅ 全部完成！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

runSeed()
