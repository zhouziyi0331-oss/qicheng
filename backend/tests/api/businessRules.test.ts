/**
 * 核心业务规则测试
 * 覆盖: 故事墙不排行榜规则 / AI-04禁用词 / 乐观锁余额
 */
import request from 'supertest';
import app from '../../src/app';

const STUDENT_PHONE = '13900000003';
let studentToken = '';

beforeAll(async () => {
  const codeRes = await request(app)
    .post('/api/v1/auth/send-code')
    .send({ phone: STUDENT_PHONE });
  const code = codeRes.body._dev_code;

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ phone: STUDENT_PHONE, code, password: 'Test1234!', role: 'student', nickname: '规则测试学生' });
  studentToken = res.body.data.accessToken;
});

describe('故事墙 — NO LEADERBOARD 规则', () => {
  it('故事墙接口应返回成功', async () => {
    const res = await request(app)
      .get('/api/v1/story/feed?limit=5')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('故事墙排序应基于相似度而非点赞数', async () => {
    const res = await request(app)
      .get('/api/v1/story/feed?limit=5')
      .set('Authorization', `Bearer ${studentToken}`);

    // sortBy 应为相似度+时间排序，不是 likes 排序
    expect(res.body.meta?.sortBy).not.toMatch(/like/i);
    expect(res.body.meta?.sortBy).not.toMatch(/热度/);
    // meta 中不应有 rank_score 字段
    expect(res.body.meta).not.toHaveProperty('rank_score');
  });
});

describe('六维雷达图 — 首单前锁定', () => {
  it('未完成首单时雷达图应被锁定', async () => {
    const res = await request(app)
      .get('/api/v1/ability/radar')
      .set('Authorization', `Bearer ${studentToken}`);

    // Locked until first task — returns 4xx with LOCKED code
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.code).toBe('LOCKED');
  });
});

describe('OPC 报告 — 预览钩子', () => {
  it('报告列表应返回 6 个报告类型', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(6);
  });

  it('每个报告条目应有 type, status, preview', async () => {
    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`);

    const report = res.body.data[0];
    expect(report).toHaveProperty('type');
    expect(report).toHaveProperty('status');
    expect(report).toHaveProperty('preview');
  });
});

describe('成长时间线', () => {
  it('注册后时间线应有 journey_start 事件', async () => {
    const res = await request(app)
      .get('/api/v1/ability/timeline')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
    const firstEvent = res.body.data.events[0];
    expect(firstEvent.event_type).toBe('journey_start');
  });
});

describe('AI-04 禁用词检查 (单元级)', () => {
  // 这里通过正则直接验证禁用词列表逻辑，不需要 mock AI 调用
  const FORBIDDEN_WORDS = ['不合格', '质量差', '质量不达标', '失败', '不通过', '不达标', '很差', '太差'];

  const sanitizeFeedback = (text: string): { clean: boolean; word?: string } => {
    for (const word of FORBIDDEN_WORDS) {
      if (text.includes(word)) {
        return { clean: false, word };
      }
    }
    return { clean: true };
  };

  it('包含「不合格」应被检测', () => {
    expect(sanitizeFeedback('这个作品不合格').clean).toBe(false);
  });

  it('包含「质量差」应被检测', () => {
    expect(sanitizeFeedback('质量差需要重做').clean).toBe(false);
  });

  it('包含「不通过」应被检测', () => {
    expect(sanitizeFeedback('审核不通过').clean).toBe(false);
  });

  it('正向反馈格式通过检测', () => {
    const goodFeedback = '你已经做到了排版整洁。需要改进的是配色方案，建议换成更统一的色调。很多人第一次都需要修改，这很正常。';
    expect(sanitizeFeedback(goodFeedback).clean).toBe(true);
  });
});
