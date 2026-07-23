/**
 * 项目推荐学生服务
 * 业务逻辑：给项目推荐最合适的3-5个学生
 */

import { qdrantVectorService } from './qdrantVector.service'
import { User } from '../models/User'
import { StudentTagProfile } from '../models/Tag'
import { scientificRecommendationService } from './scientificRecommendation.service'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

interface StudentRecommendation {
  student: {
    userId: string
    name: string
    phone: string
    level: number
  }
  scores: {
    overall: number
    skillMatch: number
    difficultyFit: number
    successProb: number
  }
  matchedSkills: string[]
  challengeLevel: string
  explanation: string[]
}

class ProjectRecommendationService {

  /**
   * 给项目推荐学生（核心方法）
   * @param projectId 项目ID
   * @param limit 推荐学生数量（默认5个）
   */
  async recommendStudentsForProject(
    projectId: string,
    limit: number = 5
  ): Promise<StudentRecommendation[]> {
    try {
      // 1. 获取项目向量
      const projectVectorData = await qdrantVectorService.searchById(
        'qicheng_project_profiles',
        projectId
      )

      if (!projectVectorData || !Array.isArray(projectVectorData.vector)) {
        throw new Error('项目向量不存在')
      }

      const projectVector = projectVectorData.vector as number[]
      const projectPayload = projectVectorData.payload

      // 2. 向量检索相似学生（主策略）
      const vectorCandidates = await qdrantVectorService.searchSimilar(
        'qicheng_student_profiles',
        projectVector,
        50  // 检索50个候选
      )

      log.info('向量检索结果', {
        projectId,
        vectorCandidates: vectorCandidates.length
      })

      // 3. 获取所有学生（全量筛选，辅助策略）
      const allStudents = await User.find({})

      log.info('全量学生数', { total: allStudents.length })

      // 4. 合并候选（向量检索的 + 全量学生）
      const candidateUserIds = new Set<string>()

      // 4.1 添加向量检索的学生
      vectorCandidates.forEach(c => {
        if (c.payload?.userId) {
          candidateUserIds.add(c.payload.userId as string)
        }
      })

      // 4.2 添加全量学生（确保覆盖所有）
      allStudents.forEach(s => {
        candidateUserIds.add(s._id.toString())
      })

      log.info('候选学生总数', { total: candidateUserIds.size })

      // 5. 对每个学生，反向计算匹配度
      const studentRecommendations: StudentRecommendation[] = []

      for (const userId of candidateUserIds) {
        try {
          // 获取该学生对该项目的推荐分数
          // 这里调用现有的推荐算法，但从项目视角看
          const studentRecs = await scientificRecommendationService.getRecommendations(
            userId,
            1000  // 获取所有推荐
          )

          // 找到该项目在学生推荐中的得分
          const projectRec = studentRecs.find(r =>
            r.project?.projectId === projectId ||
            r.project?.id === projectId
          )

          if (projectRec && !projectRec.shouldFilter) {
            // 获取学生信息
            const student = await User.findById(userId)
            if (!student) continue

            studentRecommendations.push({
              student: {
                userId: userId,
                name: (student as any).name || student.phone || '未知',
                phone: student.phone || '',
                level: student.level || 1
              },
              scores: {
                overall: projectRec.scores.overall,
                skillMatch: projectRec.scores.skillMatch,
                difficultyFit: projectRec.scores.difficultyFit,
                successProb: projectRec.scores.successProb
              },
              matchedSkills: projectRec.matchedSkills,
              challengeLevel: projectRec.challengeLevel,
              explanation: projectRec.explanation
            })
          }
        } catch (error: any) {
          log.error('计算学生匹配度失败', {
            userId,
            projectId,
            error: error.message
          })
        }
      }

      // 6. 排序并返回Top N
      studentRecommendations.sort((a, b) => b.scores.overall - a.scores.overall)

      const topN = studentRecommendations.slice(0, limit)

      log.info('项目推荐结果', {
        projectId,
        totalCandidates: studentRecommendations.length,
        recommended: topN.length,
        avgScore: topN.length > 0
          ? topN.reduce((sum, s) => sum + s.scores.overall, 0) / topN.length
          : 0
      })

      return topN

    } catch (error: any) {
      log.error('项目推荐学生失败', { projectId, error: error.message })
      throw error
    }
  }

  /**
   * 批量：给多个项目推荐学生
   */
  async recommendStudentsForProjects(
    projectIds: string[],
    limitPerProject: number = 5
  ): Promise<Map<string, StudentRecommendation[]>> {
    const results = new Map<string, StudentRecommendation[]>()

    for (const projectId of projectIds) {
      try {
        const recommendations = await this.recommendStudentsForProject(
          projectId,
          limitPerProject
        )
        results.set(projectId, recommendations)
      } catch (error: any) {
        log.error('项目推荐失败', { projectId, error: error.message })
        results.set(projectId, [])
      }
    }

    return results
  }
}

export const projectRecommendationService = new ProjectRecommendationService()
