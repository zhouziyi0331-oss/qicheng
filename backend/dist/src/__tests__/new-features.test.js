"use strict";
/**
 * 新增API接口测试
 * 测试5个新增的API功能
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
const db_1 = require("../utils/db");
describe('New Features API Tests', () => {
    let studentToken;
    let companyToken;
    let adminToken;
    let testTaskId;
    let testStudentId;
    let testAssignmentId;
    // 测试前准备
    beforeAll(async () => {
        // 创建测试用户并获取token
        const studentRes = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/auth/register')
            .send({
            phone: '13800000001',
            password: 'test123456',
            role: 'student',
            nickname: 'Test Student'
        });
        studentToken = studentRes.body.data.token;
        testStudentId = studentRes.body.data.user.id;
        const companyRes = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/auth/register')
            .send({
            phone: '13800000002',
            password: 'test123456',
            role: 'company',
            companyName: 'Test Company'
        });
        companyToken = companyRes.body.data.token;
        // 创建测试任务
        const taskRes = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/tasks/company')
            .set('Authorization', `Bearer ${companyToken}`)
            .send({
            title: 'Test Task',
            description: 'Test task description',
            budgetGross: 100,
            acceptanceCriteria: 'Test criteria',
            levelRequired: 1,
            publishType: 'normal'
        });
        testTaskId = taskRes.body.data.taskId;
        // 学生接受任务
        const acceptRes = await (0, supertest_1.default)(app_1.app)
            .post(`/api/v1/tasks/${testTaskId}/accept`)
            .set('Authorization', `Bearer ${studentToken}`);
        // 获取assignment ID
        const assignment = await (0, db_1.queryOne)('SELECT id FROM task_assignments WHERE task_id = $1 AND student_id = $2', [testTaskId, testStudentId]);
        testAssignmentId = assignment?.id || '';
    });
    // 测试后清理
    afterAll(async () => {
        // 清理测试数据
        await (0, db_1.query)('DELETE FROM task_assignments WHERE student_id = $1', [testStudentId]);
        await (0, db_1.query)('DELETE FROM tasks WHERE id = $1', [testTaskId]);
        await (0, db_1.query)('DELETE FROM users WHERE phone IN ($1, $2)', ['13800000001', '13800000002']);
    });
    // ============================================================
    // 1. AI拆解指导API测试
    // ============================================================
    describe('GET /api/v1/tasks/:id/breakdown', () => {
        it('应该成功获取任务拆解指导', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/${testTaskId}/breakdown`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('steps');
            expect(res.body.data).toHaveProperty('tips');
            expect(res.body.data).toHaveProperty('resources');
            expect(Array.isArray(res.body.data.steps)).toBe(true);
            expect(res.body.data.steps.length).toBeGreaterThan(0);
        });
        it('未接单的任务应该返回404', async () => {
            // 创建另一个任务但不接单
            const taskRes = await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/tasks/company')
                .set('Authorization', `Bearer ${companyToken}`)
                .send({
                title: 'Another Task',
                description: 'Test',
                budgetGross: 100,
                acceptanceCriteria: 'Test',
                levelRequired: 1,
                publishType: 'normal'
            });
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/${taskRes.body.data.taskId}/breakdown`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);
            expect(res.body.success).toBe(false);
        });
        it('未登录应该返回401', async () => {
            await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/${testTaskId}/breakdown`)
                .expect(401);
        });
    });
    // ============================================================
    // 2. 跳级挑战API测试
    // ============================================================
    describe('POST /api/v1/student/level-challenge', () => {
        it('应该成功提交跳级挑战', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/student/level-challenge')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                answers: {
                    q1: ['ChatGPT', 'Claude'],
                    q2: '我完成过3个AI辅助的内容创作项目，包括文章撰写、社交媒体内容生成等。',
                    q3: 'B',
                    q4: 'A',
                    q5: '通过分析用户需求，使用AI工具生成初稿，然后人工优化和调整。'
                }
            })
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('passed');
            expect(res.body.data).toHaveProperty('score');
            expect(res.body.data).toHaveProperty('old_level');
            expect(res.body.data).toHaveProperty('new_level');
            expect(res.body.data).toHaveProperty('level_up');
            expect(typeof res.body.data.score).toBe('number');
            expect(res.body.data.score).toBeGreaterThanOrEqual(0);
            expect(res.body.data.score).toBeLessThanOrEqual(100);
        });
        it('答案格式错误应该返回400', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/student/level-challenge')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                answers: 'invalid'
            })
                .expect(400);
            expect(res.body.success).toBe(false);
        });
        it('7天内重复挑战应该返回400', async () => {
            // 第一次挑战
            await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/student/level-challenge')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                answers: {
                    q1: ['ChatGPT'],
                    q2: 'Test answer',
                    q3: 'A',
                    q4: 'B',
                    q5: 'Test answer'
                }
            });
            // 立即第二次挑战
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/student/level-challenge')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                answers: {
                    q1: ['ChatGPT'],
                    q2: 'Test answer',
                    q3: 'A',
                    q4: 'B',
                    q5: 'Test answer'
                }
            })
                .expect(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('7天');
        });
    });
    // ============================================================
    // 3. 学生能力画像API测试
    // ============================================================
    describe('GET /api/v1/tasks/student-profile/:studentId', () => {
        it('企业应该能查看学生能力画像', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/student-profile/${testStudentId}`)
                .set('Authorization', `Bearer ${companyToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('nickname');
            expect(res.body.data).toHaveProperty('opc_label');
            expect(res.body.data).toHaveProperty('level');
            expect(res.body.data).toHaveProperty('abilities');
            expect(res.body.data).toHaveProperty('tags');
            expect(res.body.data).toHaveProperty('contact_unlocked');
            expect(res.body.data.nickname).toContain('学生');
            expect(typeof res.body.data.abilities).toBe('object');
        });
        it('学生不能查看其他学生画像', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/student-profile/${testStudentId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
            expect(res.body.success).toBe(false);
        });
        it('不存在的学生应该返回404', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get('/api/v1/tasks/student-profile/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${companyToken}`)
                .expect(404);
            expect(res.body.success).toBe(false);
        });
    });
    // ============================================================
    // 4. 任务进度查看API测试
    // ============================================================
    describe('GET /api/v1/tasks/:taskId/progress/:assigneeId', () => {
        it('学生应该能查看自己的任务进度', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/${testTaskId}/progress/${testAssignmentId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('status');
            expect(res.body.data).toHaveProperty('progress');
            expect(res.body.data).toHaveProperty('steps');
            expect(Array.isArray(res.body.data.steps)).toBe(true);
            expect(typeof res.body.data.progress).toBe('number');
            expect(res.body.data.progress).toBeGreaterThanOrEqual(0);
            expect(res.body.data.progress).toBeLessThanOrEqual(100);
        });
        it('企业应该能查看自己发布任务的进度', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/${testTaskId}/progress/${testAssignmentId}`)
                .set('Authorization', `Bearer ${companyToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('progress');
        });
        it('无权限查看应该返回403', async () => {
            // 创建另一个学生
            const otherStudentRes = await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/auth/register')
                .send({
                phone: '13800000003',
                password: 'test123456',
                role: 'student'
            });
            const res = await (0, supertest_1.default)(app_1.app)
                .get(`/api/v1/tasks/${testTaskId}/progress/${testAssignmentId}`)
                .set('Authorization', `Bearer ${otherStudentRes.body.data.token}`)
                .expect(403);
            expect(res.body.success).toBe(false);
        });
    });
    // ============================================================
    // 5. 管理端数据分析API测试
    // ============================================================
    describe('GET /api/v1/admin/dashboard', () => {
        beforeAll(async () => {
            // 创建管理员账号
            const adminRes = await (0, supertest_1.default)(app_1.app)
                .post('/api/v1/auth/register')
                .send({
                phone: '13800000004',
                password: 'admin123456',
                role: 'admin'
            });
            adminToken = adminRes.body.data.token;
        });
        it('管理员应该能获取看板数据（包含图表）', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('users');
            expect(res.body.data).toHaveProperty('tasks');
            expect(res.body.data).toHaveProperty('finance');
            expect(res.body.data).toHaveProperty('charts');
            // 验证图表数据
            expect(res.body.data.charts).toHaveProperty('userGrowth');
            expect(res.body.data.charts).toHaveProperty('taskStatus');
            expect(res.body.data.charts).toHaveProperty('monthlyRevenue');
            expect(Array.isArray(res.body.data.charts.userGrowth)).toBe(true);
            expect(Array.isArray(res.body.data.charts.taskStatus)).toBe(true);
            expect(Array.isArray(res.body.data.charts.monthlyRevenue)).toBe(true);
        });
        it('非管理员不能访问', async () => {
            const res = await (0, supertest_1.default)(app_1.app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
            expect(res.body.success).toBe(false);
        });
    });
});
//# sourceMappingURL=new-features.test.js.map