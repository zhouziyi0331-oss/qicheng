import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { openai } from '../config/openai'
import { Tag } from '../models/Tag'
import { log } from '../utils/logger'

/**
 * 测试OpenAI API并导入10个标签
 */

const TEST_TAGS = [
  { name: '平面设计', category: 'advantage', description: '擅长平面设计、视觉设计' },
  { name: '视觉叙事', category: 'advantage', description: '擅长用图像讲故事' },
  { name: '配色能力', category: 'advantage', description: '对色彩搭配敏感' },
  { name: '用户研究', category: 'skill', description: '用户调研和需求分析' },
  { name: '原型设计', category: 'skill', description: '快速原型制作' },
  { name: '前端开发', category: 'advantage', description: '擅长前端开发' },
  { name: '后端开发', category: 'advantage', description: '擅长后端开发' },
  { name: '数据分析', category: 'skill', description: '数据分析能力' },
  { name: '项目管理', category: 'skill', description: '项目管理和协调' },
  { name: '沟通协作', category: 'skill', description: '团队沟通和协作' }
]

async function testOpenAIAndImport() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  测试OpenAI API并导入10个标签')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 1. 连接数据库
    console.log('[1/4] 连接数据库...')
    await connectDatabase()
    console.log('✓ 数据库连接成功\n')

    // 2. 初始化Qdrant
    console.log('[2/4] 初始化Qdrant...')
    await qdrantVectorService.initializeCollections()
    console.log('✓ Qdrant初始化完成\n')

    // 3. 测试OpenAI API
    console.log('[3/4] 测试OpenAI API...')
    try {
      const testEmbedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: '测试文本'
      })
      console.log(`✓ OpenAI API连接成功！向量维度: ${testEmbedding.data[0].embedding.length}\n`)
    } catch (error: any) {
      console.error('✗ OpenAI API连接失败:', error.message)
      throw error
    }

    // 4. 导入10个测试标签
    console.log('[4/4] 导入10个测试标签...')
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < TEST_TAGS.length; i++) {
      const tagData = TEST_TAGS[i]

      try {
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

        // 生成向量
        const text = `${tagData.name}: ${tagData.description}`
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text
        })

        // 插入Qdrant
        const qdrantId = (i + 1001).toString() // 使用数字ID
        await qdrantVectorService.upsertVector(
          'qicheng_tags',
          qdrantId,
          embedding.data[0].embedding,
          {
            mongoId: tag._id.toString(),
            name: tag.name,
            category: tag.category,
            description: tag.description,
            weight: tag.weight
          }
        )

        successCount++
        console.log(`  ✓ [${i + 1}/10] ${tagData.name}`)

      } catch (error: any) {
        failCount++
        console.error(`  ✗ [${i + 1}/10] ${tagData.name} - ${error.message}`)
      }

      // 延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  导入完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`成功: ${successCount}个`)
    console.log(`失败: ${failCount}个`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 5. 测试向量检索
    if (successCount > 0) {
      console.log('测试向量检索...')

      // 生成一个查询向量
      const queryEmbedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: '设计能力'
      })

      const results = await qdrantVectorService.searchSimilar(
        'qicheng_tags',
        queryEmbedding.data[0].embedding,
        5
      )

      console.log(`找到${results.length}个相似标签:`)
      results.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.payload?.name} (距离: ${r.score.toFixed(4)})`)
      })
    }

    console.log('\n✅ 所有测试通过！OpenAI API和向量数据库功能正常！\n')
    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 测试失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testOpenAIAndImport()
