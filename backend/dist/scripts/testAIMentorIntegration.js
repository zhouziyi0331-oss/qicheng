"use strict";
/**
 * AI导师集成测试脚本
 *
 * 测试场景：
 * - T-02: stuck响应 + 真实案例引用
 * - T-04: 轻推消息 + 真实对话引用
 * - T-05: 里程碑见证 + 真实成长对比
 * - AI-07: 初心审核引擎
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mentorCoreService_1 = __importDefault(require("../src/services/mentorCoreService"));
const mentorAutoTriggerService_1 = __importDefault(require("../src/services/mentorAutoTriggerService"));
const mentorContextEnhancer_1 = __importDefault(require("../src/services/mentorContextEnhancer"));
const principleReviewService_1 = __importDefault(require("../src/services/principleReviewService"));
const db_1 = require("../src/utils/db");
const results = [];
/**
 * 测试T-02: Stuck响应 + 真实案例
 */
async function testT02StuckResponse() {
    console.log('\n=== 测试 T-02: Stuck响应 + 真实案例 ===\n');
    try {
        // 1. 找一个有历史数据的学生和任务
        const student = await (0, db_1.queryOne)(`SELECT id, nickname FROM users WHERE user_type = 'student' LIMIT 1`);
        if (!student) {
            results.push({
                scenario: 'T-02',
                passed: false,
                details: '没有找到测试学生'
            });
            return;
        }
        // 2. 创建测试会话
        const testMessage = '我卡住了，不知道怎么开始这个功能';
        console.log(`学生: ${student.nickname}`);
        console.log(`消息: ${testMessage}\n`);
        // 3. 调用chat方法（会自动检测stuck信号并获取真实案例）
        const response = await mentorCoreService_1.default.chat(student.id, testMessage);
        console.log('✅ AI导师回复:');
        console.log(response.response);
        console.log(`\n检测到的信号: ${JSON.stringify(response.detectedSignals)}`);
        console.log(`响应时间: ${response.responseTime}ms`);
        console.log(`Token使用: ${response.tokensUsed}`);
        // 4. 验证
        const isStuck = response.detectedSignals.stuckPoint;
        const responseLength = response.response.length;
        const hasGuidance = response.response.length > 300;
        results.push({
            scenario: 'T-02: Stuck响应',
            passed: isStuck && hasGuidance,
            details: `检测到stuck: ${isStuck}, 回复长度: ${responseLength}字`,
            data: {
                sessionId: response.sessionId,
                detectedSignals: response.detectedSignals
            }
        });
    }
    catch (error) {
        results.push({
            scenario: 'T-02',
            passed: false,
            details: `错误: ${error.message}`
        });
        console.error('❌ T-02测试失败:', error);
    }
}
/**
 * 测试T-04: 轻推消息 + 真实对话引用
 */
async function testT04NudgeMessage() {
    console.log('\n=== 测试 T-04: 轻推消息 + 真实对话引用 ===\n');
    try {
        // 1. 查找一个有对话历史的任务
        const taskWithHistory = await (0, db_1.queryOne)(`SELECT DISTINCT ms.task_id, ms.student_id, t.title as task_title
       FROM mentor_sessions ms
       JOIN tasks t ON ms.task_id = t.id
       WHERE ms.message_count > 0
       LIMIT 1`);
        if (!taskWithHistory) {
            results.push({
                scenario: 'T-04',
                passed: false,
                details: '没有找到有对话历史的任务'
            });
            return;
        }
        console.log(`任务: ${taskWithHistory.task_title}`);
        console.log(`任务ID: ${taskWithHistory.task_id}`);
        // 2. 测试获取最后一条消息
        const lastMessage = await mentorContextEnhancer_1.default.getLastStudentMessage(taskWithHistory.task_id);
        if (lastMessage) {
            console.log(`\n找到学生最后一条消息:`);
            console.log(`内容: ${lastMessage.content.substring(0, 100)}...`);
            console.log(`时间: ${lastMessage.created_at}`);
            const hoursSince = mentorContextEnhancer_1.default.getHoursSince(lastMessage.created_at);
            console.log(`间隔: ${hoursSince}小时\n`);
            // 3. 触发T-04轻推消息
            const nudgeMessage = await mentorAutoTriggerService_1.default.triggerT04(taskWithHistory.task_id, taskWithHistory.student_id);
            console.log('✅ 轻推消息生成成功:');
            console.log(nudgeMessage.content);
            // 4. 验证是否引用了真实对话
            const quotesRealMessage = nudgeMessage.content.includes(lastMessage.content.substring(0, 20));
            results.push({
                scenario: 'T-04: 轻推消息',
                passed: quotesRealMessage || nudgeMessage.content.length > 50,
                details: `引用真实对话: ${quotesRealMessage}, 消息长度: ${nudgeMessage.content.length}字`,
                data: {
                    lastMessagePreview: lastMessage.content.substring(0, 50),
                    hoursSince
                }
            });
        }
        else {
            results.push({
                scenario: 'T-04',
                passed: false,
                details: '无法获取学生最后一条消息'
            });
        }
    }
    catch (error) {
        results.push({
            scenario: 'T-04',
            passed: false,
            details: `错误: ${error.message}`
        });
        console.error('❌ T-04测试失败:', error);
    }
}
/**
 * 测试T-05: 里程碑见证 + 真实成长对比
 */
async function testT05MilestoneWitness() {
    console.log('\n=== 测试 T-05: 里程碑见证 + 真实成长对比 ===\n');
    try {
        // 1. 查找一个已完成的任务分配
        const completedAssignment = await (0, db_1.queryOne)(`SELECT
         ta.id,
         ta.student_id,
         ta.task_id,
         u.nickname as student_name,
         t.title as task_title
       FROM task_assignments ta
       JOIN users u ON ta.student_id = u.id
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.status = 'completed'
       LIMIT 1`);
        if (!completedAssignment) {
            results.push({
                scenario: 'T-05',
                passed: false,
                details: '没有找到已完成的任务分配'
            });
            return;
        }
        console.log(`学生: ${completedAssignment.student_name}`);
        console.log(`任务: ${completedAssignment.task_title}`);
        console.log(`任务分配ID: ${completedAssignment.id}\n`);
        // 2. 测试获取成长对比数据
        const growthComparison = await mentorContextEnhancer_1.default.getGrowthComparison(completedAssignment.student_id, completedAssignment.id);
        console.log('📊 成长对比数据:');
        console.log(`初始能力缺口: ${growthComparison.initial_gaps.length}个`);
        growthComparison.initial_gaps.forEach((gap) => console.log(`  - ${gap}`));
        console.log(`\n本单展示能力: ${growthComparison.current_skills.length}个`);
        growthComparison.current_skills.forEach((skill) => console.log(`  - ${skill}`));
        console.log(`\n已闭合缺口: ${growthComparison.gaps_closed.length}个`);
        growthComparison.gaps_closed.forEach((gap) => console.log(`  - ${gap}`));
        if (growthComparison.client_feedback) {
            console.log(`\n客户评价: ${growthComparison.client_feedback.rating}/5`);
            console.log(`评语: ${growthComparison.client_feedback.comment}`);
        }
        // 3. 触发T-05里程碑见证
        console.log('\n生成里程碑见证消息...\n');
        const witnessMessage = await mentorAutoTriggerService_1.default.triggerT05(completedAssignment.id);
        console.log('✅ 里程碑见证消息:');
        console.log(witnessMessage.content);
        // 4. 验证是否引用了真实成长数据
        const mentionsGaps = growthComparison.gaps_closed.length > 0 &&
            growthComparison.gaps_closed.some((gap) => witnessMessage.content.includes(gap.substring(0, 10)));
        results.push({
            scenario: 'T-05: 里程碑见证',
            passed: witnessMessage.content.length > 200,
            details: `引用成长数据: ${mentionsGaps}, 消息长度: ${witnessMessage.content.length}字`,
            data: {
                gapsClosedCount: growthComparison.gaps_closed.length,
                hasClientFeedback: !!growthComparison.client_feedback
            }
        });
    }
    catch (error) {
        results.push({
            scenario: 'T-05',
            passed: false,
            details: `错误: ${error.message}`
        });
        console.error('❌ T-05测试失败:', error);
    }
}
/**
 * 测试AI-07: 初心审核引擎
 */
async function testAI07PrincipleReview() {
    console.log('\n=== 测试 AI-07: 初心审核引擎 ===\n');
    try {
        // 测试案例1: 应该通过的回复
        const goodResponse = `我注意到你在这个功能上卡住了。之前有个同学也遇到过类似情况，他当时试了另一个思路：先做个最简单的版本，跑通流程，再慢慢加功能。

你可以试试这个方向吗？或者，你觉得是哪一步让你感觉困难？我们可以一起看看。`;
        console.log('测试案例1: 引导式回复（应该通过）');
        console.log(goodResponse);
        console.log();
        const review1 = await principleReviewService_1.default.reviewMentorResponse(goodResponse, {
            studentLevel: 2,
            hasRealCaseData: true
        });
        console.log(`结果: ${review1.pass ? '✅ 通过' : '❌ 不通过'}`);
        if (!review1.pass) {
            console.log(`原因: ${review1.reason}`);
        }
        // 测试案例2: 应该不通过的回复
        const badResponse = `你应该先学习React基础，必须掌握组件概念。别人都能做到，你怎么还不会？加油，你可以的！我建议你按照这个步骤做：第一步...第二步...`;
        console.log('\n测试案例2: 控制式回复（应该不通过）');
        console.log(badResponse);
        console.log();
        const review2 = await principleReviewService_1.default.reviewMentorResponse(badResponse, {
            studentLevel: 2,
            hasRealCaseData: false
        });
        console.log(`结果: ${review2.pass ? '✅ 通过' : '❌ 不通过'}`);
        if (!review2.pass) {
            console.log(`原因: ${review2.reason}`);
        }
        results.push({
            scenario: 'AI-07: 初心审核',
            passed: review1.pass && !review2.pass,
            details: `好回复通过: ${review1.pass}, 坏回复拒绝: ${!review2.pass}`,
            data: {
                review1,
                review2
            }
        });
    }
    catch (error) {
        results.push({
            scenario: 'AI-07',
            passed: false,
            details: `错误: ${error.message}`
        });
        console.error('❌ AI-07测试失败:', error);
    }
}
/**
 * 打印测试报告
 */
function printTestReport() {
    console.log('\n\n════════════════════════════════════════════════════');
    console.log('              AI导师集成测试报告');
    console.log('════════════════════════════════════════════════════\n');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${index + 1}. ${icon} ${result.scenario}`);
        console.log(`   ${result.details}`);
        if (result.data) {
            console.log(`   数据: ${JSON.stringify(result.data, null, 2)}`);
        }
        console.log();
    });
    console.log('────────────────────────────────────────────────────');
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('════════════════════════════════════════════════════\n');
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！AI导师真实数据集成成功！\n');
    }
    else {
        console.log('⚠️  部分测试失败，请检查日志\n');
    }
}
/**
 * 主测试流程
 */
async function main() {
    console.log('🚀 开始AI导师集成测试...\n');
    try {
        // 按顺序执行测试
        await testAI07PrincipleReview(); // 先测试审核引擎
        await testT02StuckResponse(); // T-02: stuck响应
        await testT04NudgeMessage(); // T-04: 轻推消息
        await testT05MilestoneWitness(); // T-05: 里程碑见证
        // 打印报告
        printTestReport();
    }
    catch (error) {
        console.error('❌ 测试执行失败:', error);
        process.exit(1);
    }
    process.exit(0);
}
// 执行测试
main();
//# sourceMappingURL=testAIMentorIntegration.js.map