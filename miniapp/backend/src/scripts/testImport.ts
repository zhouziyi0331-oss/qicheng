import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { vectorMatchService } from '../services/vectorMatch.service'

async function testImport() {
  try {
    console.log('开始测试标签导入...')
    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? '已配置' : '未配置')

    await connectDatabase()
    console.log('✓ MongoDB连接成功')

    // 测试创建一个标签
    console.log('测试创建标签...')
    const tag = await vectorMatchService.createTag(
      '测试标签',
      'test',
      '这是一个测试标签',
      1.0
    )

    console.log('✓ 标签创建成功:', tag._id)
    console.log('完成！')
    process.exit(0)
  } catch (error: any) {
    console.error('✗ 测试失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testImport()
