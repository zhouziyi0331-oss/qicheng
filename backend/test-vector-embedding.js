/**
 * 测试向量生成服务
 */

const vectorEmbeddingService = require('./src/services/vectorEmbeddingService').default;

async function testVectorEmbedding() {
  console.log('='.repeat(60));
  console.log('向量生成服务测试');
  console.log('='.repeat(60));
  console.log();

  // 1. 检查配置
  console.log('【步骤1】检查配置');
  console.log('-'.repeat(60));
  const config = vectorEmbeddingService.getConfigStatus();
  console.log('配置状态:', config);
  console.log();

  if (!config.configured) {
    console.log('⚠️  Embedding API未配置');
    console.log('   需要设置环境变量：');
    console.log('   - EMBEDDING_API_URL: Embedding API的URL');
    console.log('   - EMBEDDING_API_KEY: API密钥');
    console.log();
    console.log('   示例：');
    console.log('   export EMBEDDING_API_URL="https://api.example.com/v1/embeddings"');
    console.log('   export EMBEDDING_API_KEY="your-api-key"');
    console.log();
    console.log('   如果没有Embedding API，系统会跳过向量生成，');
    console.log('   仍然可以使用规则匹配功能。');
    console.log();
    return;
  }

  // 2. 测试健康检查
  console.log('【步骤2】测试API健康检查');
  console.log('-'.repeat(60));
  const isHealthy = await vectorEmbeddingService.checkApiHealth();
  console.log(`API状态: ${isHealthy ? '✅ 正常' : '❌ 异常'}`);
  console.log();

  if (!isHealthy) {
    console.log('❌ Embedding API不可用，请检查配置');
    return;
  }

  // 3. 测试单个文本向量生成
  console.log('【步骤3】测试单个文本向量生成');
  console.log('-'.repeat(60));

  const testText = '视觉叙事者。工作风格：习惯先理解各部分之间的联系再动手，善于从整体框架出发。';
  console.log(`测试文本: ${testText}`);
  console.log();

  const embedding = await vectorEmbeddingService.generateEmbedding(testText);

  if (embedding) {
    console.log('✅ 向量生成成功！');
    console.log(`   维度: ${embedding.length}`);
    console.log(`   前10个值: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`);
  } else {
    console.log('❌ 向量生成失败');
  }
  console.log();

  // 4. 测试学生画像向量生成
  console.log('【步骤4】测试学生画像向量生成');
  console.log('-'.repeat(60));

  const studentProfileText = `视觉叙事者。工作风格：习惯先理解各部分之间的联系再动手，善于从整体框架出发。创作偏好：灵感来源于视觉元素，对色彩和构图敏感，善于用画面传递情绪。工具习惯：拿到新工具直接上手试，通过实践快速掌握，遇到问题喜欢先自己探索。执行节奏：喜欢先出一个快速版本看看方向，再一轮轮打磨优化，而不是一开始就追求完美。协作倾向：在团队中最舒服的状态是自己负责一个完整模块，独立完成后再和他人对接。风险态度：喜欢尝试新事物，愿意接受不确定性，享受探索的过程。核心优势：品牌视觉设计、社交媒体创意内容、产品宣传图制作。`;

  const studentVector = await vectorEmbeddingService.generateStudentProfileVector(studentProfileText);

  if (studentVector) {
    console.log('✅ 学生画像向量生成成功！');
    console.log(`   维度: ${studentVector.length}`);
  } else {
    console.log('❌ 学生画像向量生成失败');
  }
  console.log();

  // 5. 测试项目需求向量生成
  console.log('【步骤5】测试项目需求向量生成');
  console.log('-'.repeat(60));

  const projectRequirementText = `品牌视觉升级项目。需求特征：执行者需要能从整体框架出发，先理解品牌调性和整体方向，再拆解到具体执行。审美要求：执行者需要从视觉创作中获得动力，对色彩、构图、视觉表现力敏感。工具适配：执行者可以直接上手，边做边学，不需要大量前期学习。交付节奏：执行者需要习惯快速迭代的工作方式，先出初稿再打磨。协作方式：执行者需要能独立执行，同时在关键节点主动同步进度。项目确定性：执行者需要能按照既定方向执行，追求稳定的高质量产出。`;

  const projectVector = await vectorEmbeddingService.generateProjectRequirementVector(projectRequirementText);

  if (projectVector) {
    console.log('✅ 项目需求向量生成成功！');
    console.log(`   维度: ${projectVector.length}`);
  } else {
    console.log('❌ 项目需求向量生成失败');
  }
  console.log();

  // 6. 测试余弦相似度计算
  if (studentVector && projectVector) {
    console.log('【步骤6】测试余弦相似度计算');
    console.log('-'.repeat(60));

    const similarity = vectorEmbeddingService.calculateCosineSimilarity(studentVector, projectVector);
    console.log(`余弦相似度: ${similarity.toFixed(4)}`);
    console.log(`相似度百分比: ${(similarity * 100).toFixed(2)}%`);
    console.log();

    if (similarity > 0.8) {
      console.log('✅ 高度相似 - 学生和项目非常匹配');
    } else if (similarity > 0.6) {
      console.log('✅ 中度相似 - 学生和项目较为匹配');
    } else {
      console.log('⚠️  低度相似 - 学生和项目匹配度较低');
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('✅ 测试完成！');
  console.log('='.repeat(60));
  console.log();
  console.log('说明：');
  console.log('  - 如果API未配置，系统会跳过向量生成');
  console.log('  - 向量生成失败不影响规则匹配功能');
  console.log('  - 向量相似度和规则匹配会综合使用（60%规则 + 40%向量）');
  console.log();
}

testVectorEmbedding().catch(console.error);
