import { QdrantClient } from '@qdrant/js-client-rest'
import { log } from '../utils/logger'

/**
 * Qdrant向量数据库配置
 */
export class QdrantConfig {
  private static instance: QdrantClient | null = null

  /**
   * 获取Qdrant客户端实例（单例）
   */
  static getClient(): QdrantClient {
    if (!this.instance) {
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333'
      const qdrantApiKey = process.env.QDRANT_API_KEY // 可选，生产环境使用

      this.instance = new QdrantClient({
        url: qdrantUrl,
        apiKey: qdrantApiKey
      })

      log.info('Qdrant客户端初始化成功', { url: qdrantUrl })
    }

    return this.instance
  }

  /**
   * 检查连接是否正常
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.getCollections()
      log.info('Qdrant连接正常')
      return true
    } catch (error: any) {
      log.error('Qdrant连接失败', { error: error.message })
      return false
    }
  }
}

/**
 * Collection名称常量
 */
export const QDRANT_COLLECTIONS = {
  TAGS: 'qicheng_tags',                       // 标签向量
  STUDENT_PROFILES: 'qicheng_student_profiles', // 学生画像向量
  PROJECT_PROFILES: 'qicheng_project_profiles'  // 项目画像向量
} as const

/**
 * 向量维度
 */
export const VECTOR_DIMENSION = 1536 // OpenAI text-embedding-3-small

/**
 * 距离度量
 */
export const DISTANCE_METRIC = 'Cosine' // 余弦相似度

export const qdrantClient = QdrantConfig.getClient()
