const axios = require('axios');
const BASE_URL = 'http://localhost:3517';

async function getRealTask() {
  try {
    // 查询真实存在的任务
    const response = await axios.get(`${BASE_URL}/api/v1/tasks?limit=1`);
    if (response.data.tasks && response.data.tasks.length > 0) {
      const taskId = response.data.tasks[0].id;
      console.log('找到真实任务ID:', taskId);
      return taskId;
    } else {
      console.log('没有找到任务，使用测试用户ID作为taskId');
      return '00000000-0000-0000-0000-000000000001';
    }
  } catch (error) {
    console.error('获取任务失败:', error.message);
    return null;
  }
}

getRealTask();
