const axios = require('axios');

const BASE_URL = 'http://localhost:3517';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_TASK_ID = '00000000-0000-0000-0000-000000000002'; // 使用UUID格式

async function test() {
  // 1. 查看L2之前状态
  console.log('1. 查看L2之前状态...');
  const before = await axios.get(`${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}?taskId=${TEST_TASK_ID}`);
  console.log('L2存在:', !!before.data.memory.L2_task);
  console.log('卡点数量:', before.data.memory.L2_task?.stuckPoints?.length || 0);

  // 2. 触发卡点求助
  console.log('\n2. 触发卡点求助...');
  await axios.post(`${BASE_URL}/api/v1/orchestrator/test/mentor`, {
    userId: TEST_USER_ID,
    message: '我不知道怎么做这个任务',
    trigger: 'stuck_help_request',
    taskId: TEST_TASK_ID
  });

  // 3. 再次查看L2
  console.log('\n3. 查看L2更新后状态...');
  const after = await axios.get(`${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}?taskId=${TEST_TASK_ID}`);
  console.log('L2存在:', !!after.data.memory.L2_task);
  console.log('卡点数量:', after.data.memory.L2_task?.stuckPoints?.length || 0);

  if (after.data.memory.L2_task?.stuckPoints?.length > 0) {
    console.log('\n✅ L2卡点记录成功！');
    console.log('最新卡点:', after.data.memory.L2_task.stuckPoints.slice(-1)[0]);
  } else {
    console.log('\n❌ L2卡点未记录');
  }
}

test().catch(console.error);
