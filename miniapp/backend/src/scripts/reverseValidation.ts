import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { scientificRecommendationService } from '../services/scientificRecommendation.service'
import { User } from '../models/User'
import { qdrantVectorService } from '../services/qdrantVector.service'

/**
 * 反向验证：从项目端看，每个项目能匹配多少学生
 * 目标：确保每个项目至少能匹配3-5个学生
 */

async function reverseValidation() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  反向验证：项目匹配度分析')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await connectDatabase()

    // 1. 获取所有测试学生
    const students = await User.find({ phone: { $in: ['13800000001', '13800000002', '13800000003'] } })
    console.log(`找到 ${students.length} 个测试学生\n`)

    // 2. 获取所有测试项目
    const projectIds = ['4001', '4002', '4003', '4004', '4005', '4006', '4007', '4008']
    const projects: any[] = []

    for (const id of projectIds) {
      try {
        const result = await qdrantVectorService.searchById('qicheng_project_profiles', id)
        if (result && result.payload) {
          projects.push({
            id,
            ...result.payload
          })
        }
      } catch (e) {
        // 项目不存在
      }
    }

    console.log(`找到 ${projects.length} 个测试项目\n`)

    // 3. 对每个项目，检查能匹配多少学生
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  项目匹配分析')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const projectMatchResults: any[] = []

    for (const project of projects) {
      console.log(`\n【项目】${project.title}`)
      console.log(`难度: ${project.difficulty} | 预算: ¥${project.budget}`)
      console.log(`要求技能: ${(project.tags || []).join(', ')}`)
      console.log()

      const matchedStudents: any[] = []
      const filteredStudents: any[] = []

      // 对每个学生，检查是否匹配
      for (const student of students) {
        const userId = student._id.toString()

        try {
          // 获取该学生的所有推荐（包括被过滤的）
          const allRecs = await (scientificRecommendationService as any).getRecommendations(userId, 100)

          // 查找所有候选中的该项目（包括被过滤的）
          let found = false
          for (const rec of allRecs) {
            if (rec.project?.projectId === project.id || rec.project?.id === project.id) {
              found = true

              if (!rec.shouldFilter) {
                // 通过过滤
                matchedStudents.push({
                  name: (student as any).name || student.phone,
                  score: rec.scores.overall,
                  skillMatch: rec.scores.skillMatch,
                  difficultyFit: rec.scores.difficultyFit,
                  successProb: rec.scores.successProb,
                  matchedSkills: rec.matchedSkills
                })
              } else {
                // 被过滤
                filteredStudents.push({
                  name: (student as any).name || student.phone,
                  reason: rec.filterReason || '被硬性过滤',
                  scores: {
                    overall: rec.scores.overall,
                    skillMatch: rec.scores.skillMatch,
                    difficultyFit: rec.scores.difficultyFit
                  }
                })
              }
              break
            }
          }

          if (!found) {
            filteredStudents.push({
              name: (student as any).name || student.phone,
              reason: '未在候选列表中',
              scores: null
            })
          }
        } catch (e) {
          console.log(`  学生 ${student.phone} 推荐失败:`, (e as Error).message)
        }
      }

      console.log(`匹配学生数: ${matchedStudents.length}/${students.length}`)

      if (matchedStudents.length > 0) {
        console.log('\n✓ 匹配的学生:')
        matchedStudents.forEach(s => {
          console.log(`  - ${s.name}`)
          console.log(`    综合得分: ${(s.score * 100).toFixed(1)}分`)
          console.log(`    技能匹配: ${(s.skillMatch * 100).toFixed(1)}% (${s.matchedSkills.join(', ') || '无'})`)
          console.log(`    难度适配: ${(s.difficultyFit * 100).toFixed(1)}%`)
          console.log(`    成功概率: ${(s.successProb * 100).toFixed(1)}%`)
        })
      }

      if (filteredStudents.length > 0) {
        console.log('\n✗ 被过滤的学生:')
        filteredStudents.forEach(s => {
          console.log(`  - ${s.name}: ${s.reason}`)
          if (s.scores) {
            console.log(`    综合得分: ${(s.scores.overall * 100).toFixed(1)}分`)
            console.log(`    技能匹配: ${(s.scores.skillMatch * 100).toFixed(1)}%`)
            console.log(`    难度适配: ${(s.scores.difficultyFit * 100).toFixed(1)}%`)
          }
        })
      }

      projectMatchResults.push({
        project: project.title,
        matchedCount: matchedStudents.length,
        totalStudents: students.length,
        matchRate: matchedStudents.length / students.length,
        avgScore: matchedStudents.length > 0
          ? matchedStudents.reduce((sum, s) => sum + s.score, 0) / matchedStudents.length
          : 0
      })
    }

    // 4. 总结分析
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  总结分析')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const tooFewMatches = projectMatchResults.filter(p => p.matchedCount < 3)
    const goodMatches = projectMatchResults.filter(p => p.matchedCount >= 3)

    console.log(`总项目数: ${projectMatchResults.length}`)
    console.log(`匹配良好（≥3人）: ${goodMatches.length}个`)
    console.log(`匹配不足（<3人）: ${tooFewMatches.length}个`)
    console.log()

    if (tooFewMatches.length > 0) {
      console.log('⚠️  匹配不足的项目:')
      tooFewMatches.forEach(p => {
        console.log(`  - ${p.project}: 仅匹配${p.matchedCount}人`)
      })
      console.log()
      console.log('问题分析：')
      console.log('1. 过滤规则可能太严格')
      console.log('2. 学生样本量太小（只有3个）')
      console.log('3. 项目要求与学生技能差距大')
      console.log()
      console.log('建议：')
      console.log('- 放宽硬性过滤阈值')
      console.log('- 增加更多学生样本')
      console.log('- 调整项目难度评级')
    } else {
      console.log('✓ 所有项目都能匹配≥3个学生')
    }

    console.log()
    console.log('平均匹配率:',
      (projectMatchResults.reduce((sum, p) => sum + p.matchRate, 0) / projectMatchResults.length * 100).toFixed(1) + '%'
    )

    // 5. 规则冲突分析
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  规则冲突分析')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('当前硬性过滤规则:')
    console.log('1. 技能覆盖率 < 30% → 过滤')
    console.log('2. 能力差距 < -30分 → 过滤')
    console.log('3. 历史成功率 < 40%（老用户）→ 过滤')
    console.log('4. 时间匹配度 < 30% → 过滤')
    console.log('5. 综合得分 < 40% → 过滤')
    console.log()

    console.log('潜在冲突:')
    console.log('- 规则1+2：技能不足 且 能力不够 → 双重过滤')
    console.log('- 规则2+5：能力差距导致得分低 → 可能重复过滤')
    console.log()

    console.log('建议调整:')
    console.log('1. 放宽技能覆盖率阈值: 30% → 20%')
    console.log('2. 放宽能力差距阈值: -30 → -35')
    console.log('3. 综合得分阈值保持: 40%（作为最后防线）')
    console.log('4. 新用户不使用历史成功率过滤')

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 测试失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

reverseValidation()
