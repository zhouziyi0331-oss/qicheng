/**
 * 认证模块 E2E 测试
 * 覆盖: 注册/登录/角色锁定/JWT刷新/联系方式过滤
 */
import request from 'supertest';
import app from '../../src/app';

const STUDENT_PHONE = '13900000001';
const COMPANY_PHONE = '13900000002';
let studentToken = '';
let studentRefreshToken = '';

describe('Auth — 注册与登录', () => {
  describe('POST /api/v1/auth/send-code', () => {
    it('应返回开发模式验证码', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-code')
        .send({ phone: STUDENT_PHONE });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body._dev_code).toMatch(/^\d{6}$/);
    });

    it('手机号格式非法时拒绝', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-code')
        .send({ phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('学生注册成功返回 JWT + nextStep=onboarding', async () => {
      // 先拿验证码
      const codeRes = await request(app)
        .post('/api/v1/auth/send-code')
        .send({ phone: STUDENT_PHONE });
      const code = codeRes.body._dev_code;

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phone: STUDENT_PHONE, code, password: 'Test1234!', role: 'student', nickname: '测试学生' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('student');
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
      expect(res.body.data.nextStep).toBe('onboarding');

      studentToken = res.body.data.accessToken;
      studentRefreshToken = res.body.data.refreshToken;
    });

    it('同一手机号重复注册应失败', async () => {
      const codeRes = await request(app)
        .post('/api/v1/auth/send-code')
        .send({ phone: STUDENT_PHONE });
      const code = codeRes.body._dev_code;

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phone: STUDENT_PHONE, code, password: 'Test1234!', role: 'student', nickname: '重复' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('验证码错误应失败', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phone: '13900000099', code: '000000', password: 'Test1234!', role: 'student', nickname: '无效' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CODE');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('正确密码登录成功', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: STUDENT_PHONE, password: 'Test1234!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeTruthy();
    });

    it('错误密码登录失败', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: STUDENT_PHONE, password: 'WrongPass!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('有效 refreshToken 应换回新 accessToken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: studentRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
    });

    it('无效 refreshToken 应拒绝', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
    });
  });
});

describe('Auth — 角色锁定 (RBAC)', () => {
  let companyToken = '';

  beforeAll(async () => {
    const codeRes = await request(app)
      .post('/api/v1/auth/send-code')
      .send({ phone: COMPANY_PHONE });
    const code = codeRes.body._dev_code;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: COMPANY_PHONE, code, password: 'Test1234!', role: 'company', nickname: '测试企业', companyName: '测试科技有限公司', contactName: '张三' });
    companyToken = res.body.data.accessToken;
  });

  it('学生 token 无法访问管理员接口', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('学生 token 无法发布企业任务', async () => {
    const res = await request(app)
      .post('/api/v1/company/tasks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: '攻击测试' });

    expect(res.status).toBe(403);
  });

  it('企业 token 无法访问学生接单接口', async () => {
    const res = await request(app)
      .post('/api/v1/tasks/student/accept')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ taskId: 'fake-id' });

    expect(res.status).toBe(403);
  });

  it('无 token 访问受保护接口返回 401', async () => {
    const res = await request(app).get('/api/v1/student/onboarding');
    expect(res.status).toBe(401);
  });
});

describe('Auth — Onboarding & 测试题', () => {
  it('注册后 onboarding 状态为 J1_test_start', async () => {
    const res = await request(app)
      .get('/api/v1/student/onboarding')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.current_step).toBe('J1_test_start');
    expect(res.body.data.is_completed).toBe(false);
    expect(res.body.data.completed_steps).toEqual([]);
  });

  it('获取 25 道测试题', async () => {
    const res = await request(app)
      .get('/api/v1/student/test/questions')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(25);
    const q = res.body.data[0];
    expect(q).toHaveProperty('question_num');
    expect(q).toHaveProperty('question_text');
    expect(q).toHaveProperty('dimension');
  });
});
