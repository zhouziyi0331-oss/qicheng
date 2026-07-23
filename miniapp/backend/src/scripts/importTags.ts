import { connectDatabase } from '../config/database'
import { vectorMatchService } from '../services/vectorMatch.service'
import { qdrantVectorService } from '../services/qdrantVector.service'
import { tagSeeds } from '../data/tagSeeds'
import { log } from '../utils/logger'

/**
 * 导入标签种子数据
 * 批量创建标签并生成向量，存入MongoDB和Qdrant
 */
async function importTagSeeds() {
  try {
    console.log('开始导入标签种子数据...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await connectDatabase()

    // 初始化Qdrant Collections
    console.log('[0/8] 初始化Qdrant Collections...')
    await qdrantVectorService.initializeCollections()
    console.log('✓ Qdrant Collections初始化完成\n')

    let totalCreated = 0

    // 1. 导入技能标签
    console.log('\n[1/8] 导入技能标签...')
    const skills = await vectorMatchService.batchCreateTags(tagSeeds.skills)
    totalCreated += skills.length
    console.log(`✓ 技能标签导入完成: ${skills.length}个`)

    // 2. 导入行业标签
    console.log('\n[2/8] 导入行业标签...')
    const industries = await vectorMatchService.batchCreateTags(tagSeeds.industries)
    totalCreated += industries.length
    console.log(`✓ 行业标签导入完成: ${industries.length}个`)

    // 3. 导入人格标签
    console.log('\n[3/8] 导入人格标签...')
    const personalities = await vectorMatchService.batchCreateTags(tagSeeds.personalities)
    totalCreated += personalities.length
    console.log(`✓ 人格标签导入完成: ${personalities.length}个`)

    // 4. 导入兴趣标签
    console.log('\n[4/8] 导入兴趣标签...')
    const interests = await vectorMatchService.batchCreateTags(tagSeeds.interests)
    totalCreated += interests.length
    console.log(`✓ 兴趣标签导入完成: ${interests.length}个`)

    // 5. 导入工具标签
    console.log('\n[5/8] 导入工具标签...')
    const tools = await vectorMatchService.batchCreateTags(tagSeeds.tools)
    totalCreated += tools.length
    console.log(`✓ 工具标签导入完成: ${tools.length}个`)

    // 6. 导入领域标签
    console.log('\n[6/8] 导入领域标签...')
    const domains = await vectorMatchService.batchCreateTags(tagSeeds.domains)
    totalCreated += domains.length
    console.log(`✓ 领域标签导入完成: ${domains.length}个`)

    // 7. 导入软技能标签
    console.log('\n[7/8] 导入软技能标签...')
    const softSkills = await vectorMatchService.batchCreateTags(tagSeeds.softSkills)
    totalCreated += softSkills.length
    console.log(`✓ 软技能标签导入完成: ${softSkills.length}个`)

    // 8. 导入项目类型标签
    console.log('\n[8/8] 导入项目类型标签...')
    const projectTypes = await vectorMatchService.batchCreateTags(tagSeeds.projectTypes)
    totalCreated += projectTypes.length
    console.log(`✓ 项目类型标签导入完成: ${projectTypes.length}个`)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`✓ 标签导入完成！`)
    console.log(`总计创建: ${totalCreated}个标签`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (error: any) {
    console.error('✗ 标签导入失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 执行导入
importTagSeeds()
