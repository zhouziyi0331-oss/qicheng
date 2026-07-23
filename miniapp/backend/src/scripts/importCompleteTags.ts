import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { vectorMatchService } from '../services/vectorMatch.service'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { completeTagSystem } from '../data/completeTags'
import { log } from '../utils/logger'

/**
 * 导入完整的2000+标签体系
 * 学生端1000 + 企业端1000
 */
async function importCompleteTags() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  开始导入2000+完整标签体系')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await connectDatabase()

    // 初始化Qdrant Collections
    console.log('[0/10] 初始化Qdrant Collections...')
    await qdrantVectorService.initializeCollections()
    console.log('✓ Qdrant Collections初始化完成\n')

    let totalCreated = 0

    // ========== 学生端标签（1000+） ==========
    console.log('========== 学生端标签导入 ==========\n')

    // 1. 个人特质标签（300+）
    console.log('[1/10] 导入个人特质标签...')
    const traitTags = [
      ...completeTagSystem.student.traits.visualStoryteller,
      ...completeTagSystem.student.traits.systemBuilder,
      ...completeTagSystem.student.traits.creativeExecutor,
      ...completeTagSystem.student.traits.logicalAnalyzer,
      ...completeTagSystem.student.traits.reliableDeliverer,
      ...completeTagSystem.student.traits.exploratoryIntegrator,
      ...completeTagSystem.student.traits.hybrid
    ]
    const traits = await vectorMatchService.batchCreateTags(traitTags)
    totalCreated += traits.length
    console.log(`✓ 个人特质标签: ${traits.length}个\n`)

    // 2. 个人优势标签（300+）
    console.log('[2/10] 导入个人优势标签...')
    const advantageTags = [
      ...completeTagSystem.student.advantages.visual,
      ...completeTagSystem.student.advantages.systematic,
      ...completeTagSystem.student.advantages.creative,
      ...completeTagSystem.student.advantages.logical,
      ...completeTagSystem.student.advantages.stable,
      ...completeTagSystem.student.advantages.exploratory,
      ...completeTagSystem.student.advantages.execution,
      ...completeTagSystem.student.advantages.communication,
      ...completeTagSystem.student.advantages.learning
    ]
    const advantages = await vectorMatchService.batchCreateTags(advantageTags)
    totalCreated += advantages.length
    console.log(`✓ 个人优势标签: ${advantages.length}个\n`)

    // 3. 专业背景标签（200+）
    console.log('[3/10] 导入专业背景标签...')
    const majorTags = [
      ...completeTagSystem.student.majors.design,
      ...completeTagSystem.student.majors.technology,
      ...completeTagSystem.student.majors.business,
      ...completeTagSystem.student.majors.humanities,
      ...completeTagSystem.student.majors.interdisciplinary
    ]
    const majors = await vectorMatchService.batchCreateTags(majorTags)
    totalCreated += majors.length
    console.log(`✓ 专业背景标签: ${majors.length}个\n`)

    // 4. 过往经验标签（200+）
    console.log('[4/10] 导入过往经验标签...')
    const experienceTags = [
      ...completeTagSystem.student.experiences.projectTypes,
      ...completeTagSystem.student.experiences.scenarios,
      ...completeTagSystem.student.experiences.challenges,
      ...completeTagSystem.student.experiences.growth
    ]
    const experiences = await vectorMatchService.batchCreateTags(experienceTags)
    totalCreated += experiences.length
    console.log(`✓ 过往经验标签: ${experiences.length}个\n`)

    // ========== 企业端标签（1000+） ==========
    console.log('========== 企业端标签导入 ==========\n')

    // 5. 任务类型标签（200+）
    console.log('[5/10] 导入任务类型标签...')
    const taskTypeTags = [
      ...completeTagSystem.enterprise.taskTypes.design,
      ...completeTagSystem.enterprise.taskTypes.development,
      ...completeTagSystem.enterprise.taskTypes.content,
      ...completeTagSystem.enterprise.taskTypes.marketing
    ]
    const taskTypes = await vectorMatchService.batchCreateTags(taskTypeTags)
    totalCreated += taskTypes.length
    console.log(`✓ 任务类型标签: ${taskTypes.length}个\n`)

    // 6. 任务需求标签（200+）
    console.log('[6/10] 导入任务需求标签...')
    const requirementTags = [
      ...completeTagSystem.enterprise.taskRequirements.designNeeds,
      ...completeTagSystem.enterprise.taskRequirements.devNeeds,
      ...completeTagSystem.enterprise.taskRequirements.contentNeeds,
      ...completeTagSystem.enterprise.taskRequirements.marketingNeeds
    ]
    const requirements = await vectorMatchService.batchCreateTags(requirementTags)
    totalCreated += requirements.length
    console.log(`✓ 任务需求标签: ${requirements.length}个\n`)

    // 7. 难度等级标签（100+）
    console.log('[7/10] 导入难度等级标签...')
    const difficultyTags = [
      ...completeTagSystem.enterprise.difficulty.overall,
      ...completeTagSystem.enterprise.difficulty.timeRequirement,
      ...completeTagSystem.enterprise.difficulty.collaboration,
      ...completeTagSystem.enterprise.difficulty.skillRequirement,
      ...completeTagSystem.enterprise.difficulty.resourceSupport
    ]
    const difficulties = await vectorMatchService.batchCreateTags(difficultyTags)
    totalCreated += difficulties.length
    console.log(`✓ 难度等级标签: ${difficulties.length}个\n`)

    // 8. 行业领域标签（200+）
    console.log('[8/10] 导入行业领域标签...')
    const industryTags = [
      ...completeTagSystem.enterprise.industries.internet,
      ...completeTagSystem.enterprise.industries.consumer,
      ...completeTagSystem.enterprise.industries.traditional,
      ...completeTagSystem.enterprise.industries.emerging,
      ...completeTagSystem.enterprise.industries.scenarios
    ]
    const industries = await vectorMatchService.batchCreateTags(industryTags)
    totalCreated += industries.length
    console.log(`✓ 行业领域标签: ${industries.length}个\n`)

    // 9. 项目特征标签（200+）
    console.log('[9/10] 导入项目特征标签...')
    const featureTags = [
      ...completeTagSystem.enterprise.projectFeatures.scale,
      ...completeTagSystem.enterprise.projectFeatures.stage,
      ...completeTagSystem.enterprise.projectFeatures.userFeature,
      ...completeTagSystem.enterprise.projectFeatures.techFeature,
      ...completeTagSystem.enterprise.projectFeatures.businessFeature,
      ...completeTagSystem.enterprise.projectFeatures.teamFeature
    ]
    const features = await vectorMatchService.batchCreateTags(featureTags)
    totalCreated += features.length
    console.log(`✓ 项目特征标签: ${features.length}个\n`)

    // 10. 预算和周期标签
    console.log('[10/10] 导入预算和周期标签...')
    const otherTags = [
      ...completeTagSystem.enterprise.budget,
      ...completeTagSystem.enterprise.deliveryCycle
    ]
    const others = await vectorMatchService.batchCreateTags(otherTags)
    totalCreated += others.length
    console.log(`✓ 预算和周期标签: ${others.length}个\n`)

    // 统计
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  完整标签体系导入完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`总计创建: ${totalCreated}个标签`)
    console.log('\n学生端标签:')
    console.log(`  - 个人特质: ${traits.length}个`)
    console.log(`  - 个人优势: ${advantages.length}个`)
    console.log(`  - 专业背景: ${majors.length}个`)
    console.log(`  - 过往经验: ${experiences.length}个`)
    console.log(`  学生端小计: ${traits.length + advantages.length + majors.length + experiences.length}个`)
    console.log('\n企业端标签:')
    console.log(`  - 任务类型: ${taskTypes.length}个`)
    console.log(`  - 任务需求: ${requirements.length}个`)
    console.log(`  - 难度等级: ${difficulties.length}个`)
    console.log(`  - 行业领域: ${industries.length}个`)
    console.log(`  - 项目特征: ${features.length}个`)
    console.log(`  - 预算周期: ${others.length}个`)
    console.log(`  企业端小计: ${taskTypes.length + requirements.length + difficulties.length + industries.length + features.length + others.length}个`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (error: any) {
    console.error('✗ 标签导入失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 执行导入
importCompleteTags()
