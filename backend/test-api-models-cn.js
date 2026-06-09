#!/usr/bin/env node
/**
 * 测试中国区常见的模型名称
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk').default;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const modelsToTest = [
  'claude-3.5-sonnet',
  'claude-3-5-sonnet-latest',
  'claude-sonnet-3.5',
  'claude-sonnet',
  'claude-3.5',
  'gpt-4',  // 有些代理会转换
  'claude',
  'anthropic.claude-3-5-sonnet-20241022-v2:0'  // AWS Bedrock格式
];

async function testModel(modelName) {
  try {
    console.log(`\n测试模型: ${modelName}`);
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 50,
      messages: [{ role: 'user', content: '你好，请回复"测试成功"' }]
    });
    console.log(`✅ ${modelName} - 成功！`);
    console.log(`   回复: ${response.content[0].text}`);
    return modelName;
  } catch (error) {
    console.log(`❌ ${modelName} - 失败: ${error.message.substring(0, 100)}`);
    return null;
  }
}

async function main() {
  console.log('========================================');
  console.log('测试中国区/代理常见模型名称');
  console.log('========================================');

  const workingModels = [];

  for (const model of modelsToTest) {
    const result = await testModel(model);
    if (result) {
      workingModels.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n========================================');
  if (workingModels.length > 0) {
    console.log('✅ 找到可用的模型:');
    workingModels.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log('❌ 没有找到可用的模型');
    console.log('\n建议：');
    console.log('1. 检查API密钥是否正确');
    console.log('2. 如果使用代理服务，查看其文档了解支持的模型名称');
    console.log('3. 尝试联系API提供商获取支持的模型列表');
  }
  console.log('========================================');
}

main().catch(console.error);
