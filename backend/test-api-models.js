#!/usr/bin/env node
/**
 * 测试API支持的模型
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk').default;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const modelsToTest = [
  'claude-3-5-sonnet',
  'claude-3-5-sonnet-20241022',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
  'claude-2.1',
  'claude-2',
  'claude-instant-1.2'
];

async function testModel(modelName) {
  try {
    console.log(`\n测试模型: ${modelName}`);
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 50,
      messages: [{ role: 'user', content: '你好' }]
    });
    console.log(`✅ ${modelName} - 成功`);
    console.log(`   回复: ${response.content[0].text}`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} - 失败: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('测试API支持的模型');
  console.log('========================================');

  for (const model of modelsToTest) {
    await testModel(model);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 避免限流
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

main().catch(console.error);
