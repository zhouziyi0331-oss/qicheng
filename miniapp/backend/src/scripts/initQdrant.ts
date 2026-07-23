import { connectDatabase } from '../config/database'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { QdrantConfig } from '../config/qdrant'

/**
 * 初始化Qdrant向量数据库
 * 创建所有必需的Collections
 */
async function initializeQdrant() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Qdrant向量数据库初始化')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 连接MongoDB
    await connectDatabase()

    // 检查Qdrant连接
    console.log('[1/3] 检查Qdrant连接...')
    const isConnected = await QdrantConfig.healthCheck()

    if (!isConnected) {
      console.error('✗ Qdrant连接失败！')
      console.error('\n请确保Qdrant正在运行：')
      console.error('docker run -p 6333:6333 -p 6334:6334 \\')
      console.error('  -v $(pwd)/qdrant_storage:/qdrant/storage \\')
      console.error('  qdrant/qdrant')
      process.exit(1)
    }
    console.log('✓ Qdrant连接成功\n')

    // 初始化Collections
    console.log('[2/3] 创建Collections...')
    await qdrantVectorService.initializeCollections()
    console.log('✓ Collections创建完成\n')

    // 获取统计信息
    console.log('[3/3] 获取统计信息...')
    const stats = await qdrantVectorService.getAllStats()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Collection统计信息')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`标签向量:     ${stats.tags.vectorsCount} 个`)
    console.log(`学生画像:     ${stats.studentProfiles.vectorsCount} 个`)
    console.log(`项目画像:     ${stats.projectProfiles.vectorsCount} 个`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✓ Qdrant初始化完成！\n')
    console.log('接下来可以运行：')
    console.log('  npm run import:tags    # 导入标签数据')
    console.log('')

    process.exit(0)
  } catch (error: any) {
    console.error('✗ Qdrant初始化失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 执行初始化
initializeQdrant()
