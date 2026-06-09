const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testAuthFlow() {
  console.log('=== 测试完整注册登录流程 ===\n');

  try {
    // 1. 发送验证码
    console.log('1. 发送验证码...');
    const phone = `139${Math.floor(10000000 + Math.random() * 90000000)}`; // 生成随机手机号
    const sendCodeRes = await axios.post(`${API_BASE}/auth/send-code`, {
      phone,
      type: 'login'
    });
    console.log('✓ 验证码发送成功:', sendCodeRes.data);
    const code = sendCodeRes.data._dev_code; // 使用开发环境返回的验证码
    console.log('');

    // 2. 注册新用户（学生）
    console.log('2. 注册新学生用户...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      phone,
      code,
      userType: 'student'
    });
    console.log('✓ 注册成功:', {
      accessToken: registerRes.data.data.accessToken.substring(0, 20) + '...',
      profileCompleted: registerRes.data.data.profileCompleted,
      nextStep: registerRes.data.data.nextStep
    });
    const token = registerRes.data.data.accessToken;
    console.log('');

    // 3. 检查资料状态
    console.log('3. 检查资料完善状态...');
    const statusRes = await axios.get(`${API_BASE}/auth/profile-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 资料状态:', statusRes.data.data);
    console.log('');

    // 4. 完善资料
    console.log('4. 完善学生资料...');
    const completeRes = await axios.post(`${API_BASE}/auth/complete-profile`, {
      nickname: '测试学生',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: '这是一个测试学生账号',
      university: '测试大学',
      major: '计算机科学',
      grade: '大三',
      city: '北京'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 资料完善成功:', completeRes.data);
    console.log('');

    // 5. 再次检查资料状态
    console.log('5. 再次检查资料状态...');
    const status2Res = await axios.get(`${API_BASE}/auth/profile-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 更新后的资料状态:', status2Res.data.data);
    console.log('');

    // 6. 登出后重新登录
    console.log('6. 使用验证码重新登录...');
    // 重新发送验证码
    const sendCode2Res = await axios.post(`${API_BASE}/auth/send-code`, {
      phone,
      type: 'login'
    });
    const code2 = sendCode2Res.data._dev_code;

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      phone,
      code: code2
    });
    console.log('✓ 登录成功:', {
      accessToken: loginRes.data.data.accessToken.substring(0, 20) + '...',
      profileCompleted: loginRes.data.data.profileCompleted
    });
    console.log('');

    // 7. 测试企业注册（等待避免速率限制）
    console.log('7. 等待5秒以避免速率限制...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('8. 注册企业用户...');
    const companyPhone = `138${Math.floor(10000000 + Math.random() * 90000000)}`; // 生成随机手机号
    const sendCode3Res = await axios.post(`${API_BASE}/auth/send-code`, {
      phone: companyPhone,
      type: 'login'
    });
    const code3 = sendCode3Res.data._dev_code;

    const companyRegRes = await axios.post(`${API_BASE}/auth/register`, {
      phone: companyPhone,
      code: code3,
      userType: 'company',
      companyName: '测试科技有限公司',
      contactName: '张经理'
    });
    console.log('✓ 企业注册成功:', {
      accessToken: companyRegRes.data.data.accessToken.substring(0, 20) + '...',
      profileCompleted: companyRegRes.data.data.profileCompleted
    });
    const companyToken = companyRegRes.data.data.accessToken;
    console.log('');

    // 9. 完善企业资料
    console.log('9. 完善企业资料...');
    const companyCompleteRes = await axios.post(`${API_BASE}/auth/complete-profile`, {
      nickname: '测试企业',
      companyName: '测试科技有限公司',
      contactName: '张经理',
      industry: '互联网',
      companySize: '100-500人',
      bio: '这是一个测试企业账号'
    }, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    console.log('✓ 企业资料完善成功:', companyCompleteRes.data);
    console.log('');

    console.log('=== 所有测试通过 ✓ ===');
    console.log('\n前端访问地址:');
    console.log('- 登录页面: http://localhost:3001/auth/login');
    console.log('- 注册页面: http://localhost:3001/auth/register');
    console.log('- 完善资料: http://localhost:3001/auth/complete-profile');

  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAuthFlow();
