import { qdrantClient, QDRANT_COLLECTIONS, VECTOR_DIMENSION, DISTANCE_METRIC } from '../config/qdrant'
import { log } from '../utils/logger'

/**
 * Qdrant向量存储服务
 * 真正的向量数据库实现，支持高效的ANN检索
 */
export class QdrantVectorService {

  /**
   * 初始化所有Collections
   */
  async initializeCollections() {
    try {
      log.info('开始初始化Qdrant Collections...')

      // 获取现有collections
      const { collections } = await qdrantClient.getCollections()
      const existingCollections = collections.map(c => c.name)

      // 1. 标签向量集合
      if (!existingCollections.includes(QDRANT_COLLECTIONS.TAGS)) {
        await qdrantClient.createCollection(QDRANT_COLLECTIONS.TAGS, {
          vectors: {
            size: VECTOR_DIMENSION,
            distance: DISTANCE_METRIC
          },
          optimizers_config: {
            default_segment_number: 2
          },
          replication_factor: 1
        })
        log.info('创建Collection成功', { name: QDRANT_COLLECTIONS.TAGS })
      }

      // 2. 学生画像向量集合
      if (!existingCollections.includes(QDRANT_COLLECTIONS.STUDENT_PROFILES)) {
        await qdrantClient.createCollection(QDRANT_COLLECTIONS.STUDENT_PROFILES, {
          vectors: {
            size: VECTOR_DIMENSION,
            distance: DISTANCE_METRIC
          },
          optimizers_config: {
            default_segment_number: 2
          },
          replication_factor: 1
        })
        log.info('创建Collection成功', { name: QDRANT_COLLECTIONS.STUDENT_PROFILES })
      }

      // 3. 项目画像向量集合
      if (!existingCollections.includes(QDRANT_COLLECTIONS.PROJECT_PROFILES)) {
        await qdrantClient.createCollection(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
          vectors: {
            size: VECTOR_DIMENSION,
            distance: DISTANCE_METRIC
          },
          optimizers_config: {
            default_segment_number: 2
          },
          replication_factor: 1
        })
        log.info('创建Collection成功', { name: QDRANT_COLLECTIONS.PROJECT_PROFILES })
      }

      log.info('Qdrant Collections初始化完成')
    } catch (error: any) {
      log.error('初始化Qdrant Collections失败', { error: error.message })
      throw error
    }
  }

  // ========== 标签向量操作 ==========

  /**
   * 插入标签向量
   */
  async upsertTagVector(tagId: string, vector: number[], metadata: any) {
    try {
      await qdrantClient.upsert(QDRANT_COLLECTIONS.TAGS, {
        wait: true,
        points: [{
          id: tagId,
          vector,
          payload: {
            tagId,
            name: metadata.name,
            category: metadata.category,
            description: metadata.description,
            weight: metadata.weight,
            createdAt: metadata.createdAt || new Date().toISOString()
          }
        }]
      })

      log.info('标签向量插入成功', { tagId, name: metadata.name })
    } catch (error: any) {
      log.error('标签向量插入失败', { tagId, error: error.message })
      throw error
    }
  }

  /**
   * 批量插入标签向量
   */
  async batchUpsertTagVectors(tags: Array<{
    tagId: string
    vector: number[]
    metadata: any
  }>) {
    try {
      const points = tags.map(tag => ({
        id: tag.tagId,
        vector: tag.vector,
        payload: {
          tagId: tag.tagId,
          name: tag.metadata.name,
          category: tag.metadata.category,
          description: tag.metadata.description,
          weight: tag.metadata.weight,
          createdAt: tag.metadata.createdAt || new Date().toISOString()
        }
      }))

      await qdrantClient.upsert(QDRANT_COLLECTIONS.TAGS, {
        wait: true,
        points
      })

      log.info('批量标签向量插入成功', { count: tags.length })
    } catch (error: any) {
      log.error('批量标签向量插入失败', { error: error.message })
      throw error
    }
  }

  /**
   * 搜索相似标签
   */
  async searchSimilarTags(queryVector: number[], limit: number = 10, filter?: any) {
    try {
      const result = await qdrantClient.search(QDRANT_COLLECTIONS.TAGS, {
        vector: queryVector,
        limit,
        filter,
        with_payload: true
      })

      return result.map(item => ({
        tagId: item.id,
        score: item.score,
        ...item.payload
      }))
    } catch (error: any) {
      log.error('搜索相似标签失败', { error: error.message })
      throw error
    }
  }

  /**
   * 删除标签向量
   */
  async deleteTagVector(tagId: string) {
    try {
      await qdrantClient.delete(QDRANT_COLLECTIONS.TAGS, {
        wait: true,
        points: [tagId]
      })

      log.info('标签向量删除成功', { tagId })
    } catch (error: any) {
      log.error('标签向量删除失败', { tagId, error: error.message })
      throw error
    }
  }

  // ========== 学生画像向量操作 ==========

  /**
   * 插入/更新学生画像向量
   */
  async upsertStudentProfile(userId: string, vector: number[], metadata: any) {
    try {
      await qdrantClient.upsert(QDRANT_COLLECTIONS.STUDENT_PROFILES, {
        wait: true,
        points: [{
          id: userId,
          vector,
          payload: {
            userId,
            personalityTag: metadata.personalityTag,
            level: metadata.level,
            totalProjects: metadata.totalProjects,
            tagCount: metadata.tagCount,
            skillLevelCount: metadata.skillLevelCount,
            interestCount: metadata.interestCount,
            updatedAt: new Date().toISOString()
          }
        }]
      })

      log.info('学生画像向量插入成功', { userId })
    } catch (error: any) {
      log.error('学生画像向量插入失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取学生画像向量
   */
  async getStudentProfile(userId: string) {
    try {
      const result = await qdrantClient.retrieve(QDRANT_COLLECTIONS.STUDENT_PROFILES, {
        ids: [userId],
        with_payload: true,
        with_vector: true
      })

      if (result.length === 0) {
        return null
      }

      return {
        userId: result[0].id,
        vector: result[0].vector as number[],
        ...result[0].payload
      }
    } catch (error: any) {
      log.error('获取学生画像向量失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 删除学生画像向量
   */
  async deleteStudentProfile(userId: string) {
    try {
      await qdrantClient.delete(QDRANT_COLLECTIONS.STUDENT_PROFILES, {
        wait: true,
        points: [userId]
      })

      log.info('学生画像向量删除成功', { userId })
    } catch (error: any) {
      log.error('学生画像向量删除失败', { userId, error: error.message })
      throw error
    }
  }

  // ========== 项目画像向量操作 ==========

  /**
   * 插入/更新项目画像向量
   */
  async upsertProjectProfile(projectId: string, vector: number[], metadata: any) {
    try {
      await qdrantClient.upsert(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
        wait: true,
        points: [{
          id: projectId,
          vector,
          payload: {
            projectId,
            projectType: metadata.projectType,
            title: metadata.title,
            category: metadata.category,
            difficulty: metadata.difficulty,
            budget: metadata.budget,
            status: metadata.status,
            tagCount: metadata.tagCount,
            requiredSkillCount: metadata.requiredSkillCount,
            updatedAt: new Date().toISOString()
          }
        }]
      })

      log.info('项目画像向量插入成功', { projectId })
    } catch (error: any) {
      log.error('项目画像向量插入失败', { projectId, error: error.message })
      throw error
    }
  }

  /**
   * 批量插入项目画像向量
   */
  async batchUpsertProjectProfiles(projects: Array<{
    projectId: string
    vector: number[]
    metadata: any
  }>) {
    try {
      const points = projects.map(proj => ({
        id: proj.projectId,
        vector: proj.vector,
        payload: {
          projectId: proj.projectId,
          projectType: proj.metadata.projectType,
          title: proj.metadata.title,
          category: proj.metadata.category,
          difficulty: proj.metadata.difficulty,
          budget: proj.metadata.budget,
          status: proj.metadata.status,
          tagCount: proj.metadata.tagCount,
          requiredSkillCount: proj.metadata.requiredSkillCount,
          updatedAt: new Date().toISOString()
        }
      }))

      await qdrantClient.upsert(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
        wait: true,
        points
      })

      log.info('批量项目画像向量插入成功', { count: projects.length })
    } catch (error: any) {
      log.error('批量项目画像向量插入失败', { error: error.message })
      throw error
    }
  }

  /**
   * 向量检索：为学生推荐项目（核心功能）
   */
  async searchRecommendedProjects(
    studentVector: number[],
    limit: number = 20,
    filter?: any
  ) {
    try {
      // 构建过滤条件
      const searchFilter = filter || {
        must: [
          {
            key: 'status',
            match: { value: 'available' }
          }
        ]
      }

      // 执行向量检索
      const result = await qdrantClient.search(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
        vector: studentVector,
        limit: limit * 2, // 多取一些，后续再过滤
        filter: searchFilter,
        with_payload: true,
        score_threshold: 0.5 // 相似度阈值，低于0.5的不返回
      })

      return result.map(item => ({
        projectId: item.id,
        vectorSimilarity: item.score, // Qdrant返回的score就是相似度
        ...item.payload
      }))
    } catch (error: any) {
      log.error('向量检索推荐项目失败', { error: error.message })
      throw error
    }
  }

  /**
   * 获取项目画像向量
   */
  async getProjectProfile(projectId: string) {
    try {
      const result = await qdrantClient.retrieve(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
        ids: [projectId],
        with_payload: true,
        with_vector: true
      })

      if (result.length === 0) {
        return null
      }

      return {
        projectId: result[0].id,
        vector: result[0].vector as number[],
        ...result[0].payload
      }
    } catch (error: any) {
      log.error('获取项目画像向量失败', { projectId, error: error.message })
      throw error
    }
  }

  /**
   * 批量获取项目画像向量
   */
  async batchGetProjectProfiles(projectIds: string[]) {
    try {
      const result = await qdrantClient.retrieve(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
        ids: projectIds,
        with_payload: true,
        with_vector: true
      })

      return result.map(item => ({
        projectId: item.id,
        vector: item.vector as number[],
        ...item.payload
      }))
    } catch (error: any) {
      log.error('批量获取项目画像向量失败', { error: error.message })
      throw error
    }
  }

  /**
   * 删除项目画像向量
   */
  async deleteProjectProfile(projectId: string) {
    try {
      await qdrantClient.delete(QDRANT_COLLECTIONS.PROJECT_PROFILES, {
        wait: true,
        points: [projectId]
      })

      log.info('项目画像向量删除成功', { projectId })
    } catch (error: any) {
      log.error('项目画像向量删除失败', { projectId, error: error.message })
      throw error
    }
  }

  // ========== 统计信息 ==========

  /**
   * 获取Collection统计信息
   */
  async getCollectionStats(collectionName: string) {
    try {
      const info = await qdrantClient.getCollection(collectionName) as any
      return {
        name: collectionName,
        vectorsCount: info.vectors_count || 0,
        pointsCount: info.points_count || 0,
        indexedVectorsCount: info.indexed_vectors_count || 0,
        status: info.status
      }
    } catch (error: any) {
      log.error('获取Collection统计失败', { collectionName, error: error.message })
      throw error
    }
  }

  /**
   * 获取所有Collection统计信息
   */
  async getAllStats() {
    try {
      const stats = await Promise.all([
        this.getCollectionStats(QDRANT_COLLECTIONS.TAGS),
        this.getCollectionStats(QDRANT_COLLECTIONS.STUDENT_PROFILES),
        this.getCollectionStats(QDRANT_COLLECTIONS.PROJECT_PROFILES)
      ])

      return {
        tags: stats[0],
        studentProfiles: stats[1],
        projectProfiles: stats[2]
      }
    } catch (error: any) {
      log.error('获取所有统计信息失败', { error: error.message })
      throw error
    }
  }

  /**
   * 清空Collection（危险操作，仅用于开发测试）
   */
  async clearCollection(collectionName: string) {
    try {
      await qdrantClient.deleteCollection(collectionName)
      log.warn('Collection已清空', { collectionName })
    } catch (error: any) {
      log.error('清空Collection失败', { collectionName, error: error.message })
      throw error
    }
  }

  // ========== 通用向量操作 ==========

  /**
   * 通用的向量插入方法（支持所有collection）
   */
  async upsertVector(collectionName: string, id: string, vector: number[], payload: any) {
    try {
      // Qdrant要求ID是数字或UUID
      // 尝试将字符串转换为数字，如果失败则使用原字符串作为UUID
      let qdrantId: number | string = id
      if (!isNaN(Number(id))) {
        qdrantId = Number(id)
      }

      await qdrantClient.upsert(collectionName, {
        wait: true,
        points: [{
          id: qdrantId,
          vector,
          payload
        }]
      })

      log.info('向量插入成功', { collectionName, id })
    } catch (error: any) {
      log.error('向量插入失败', { collectionName, id, error: error.message })
      throw error
    }
  }

  /**
   * 通用的向量检索方法（支持所有collection）
   */
  async searchSimilar(collectionName: string, vector: number[], limit: number = 10) {
    try {
      const results = await qdrantClient.search(collectionName, {
        vector,
        limit,
        with_payload: true
      })

      return results
    } catch (error: any) {
      log.error('向量检索失败', { collectionName, error: error.message })
      return []
    }
  }

  /**
   * 通过ID查询向量
   */
  async searchById(collectionName: string, id: string) {
    try {
      // 转换ID格式
      let qdrantId: number | string = id
      if (!isNaN(Number(id))) {
        qdrantId = Number(id)
      }

      const result = await qdrantClient.retrieve(collectionName, {
        ids: [qdrantId],
        with_vector: true
      })

      return result[0] || null
    } catch (error: any) {
      log.error('通过ID查询向量失败', { collectionName, id, error: error.message })
      return null
    }
  }
}

export const qdrantVectorService = new QdrantVectorService()
