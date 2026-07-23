"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOPCQuestions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const OPCQuestion_1 = require("../models/OPCQuestion");
dotenv_1.default.config();
/**
 * OPC测试题库初始化脚本
 * 36道工作场景测试题
 */
const questions = [
    // 视觉维度 (1-4题)
    {
        questionId: 1,
        questionText: '在项目汇报时，你更倾向于：',
        dimension: 'visual',
        options: [
            { label: '用图表和可视化数据展示结果', value: 'A', score: 100 },
            { label: '用详细的文字报告说明', value: 'B', score: 40 },
            { label: '简单口头说明关键点', value: 'C', score: 60 },
            { label: '让数据自己说话', value: 'D', score: 70 }
        ]
    },
    {
        questionId: 2,
        questionText: '当需要解释一个复杂概念时，你会：',
        dimension: 'visual',
        options: [
            { label: '画图或做示意图', value: 'A', score: 100 },
            { label: '用类比和比喻', value: 'B', score: 70 },
            { label: '逐步分解讲解', value: 'C', score: 60 },
            { label: '给出实际案例', value: 'D', score: 80 }
        ]
    },
    {
        questionId: 3,
        questionText: '在设计界面或PPT时，你通常：',
        dimension: 'visual',
        options: [
            { label: '花很多时间打磨视觉效果', value: 'A', score: 100 },
            { label: '使用模板快速完成', value: 'B', score: 50 },
            { label: '注重内容，样式简单即可', value: 'C', score: 40 },
            { label: '找专业设计师帮忙', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 4,
        questionText: '你更喜欢哪种学习方式：',
        dimension: 'visual',
        options: [
            { label: '看视频教程和图解', value: 'A', score: 100 },
            { label: '阅读文档和书籍', value: 'B', score: 50 },
            { label: '直接动手实践', value: 'C', score: 60 },
            { label: '听别人讲解', value: 'D', score: 70 }
        ]
    },
    // 系统维度 (5-8题)
    {
        questionId: 5,
        questionText: '接到新任务时，你的第一反应是：',
        dimension: 'systematic',
        options: [
            { label: '先搭建整体框架和流程', value: 'A', score: 100 },
            { label: '先做最紧急的部分', value: 'B', score: 50 },
            { label: '边做边调整', value: 'C', score: 40 },
            { label: '参考类似项目的做法', value: 'D', score: 70 }
        ]
    },
    {
        questionId: 6,
        questionText: '在多任务处理时，你会：',
        dimension: 'systematic',
        options: [
            { label: '制定详细的优先级和时间表', value: 'A', score: 100 },
            { label: '按截止日期先后处理', value: 'B', score: 60 },
            { label: '哪个紧急先做哪个', value: 'C', score: 40 },
            { label: '同时推进多个任务', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 7,
        questionText: '你如何管理项目文件和资料：',
        dimension: 'systematic',
        options: [
            { label: '建立清晰的文件夹分类体系', value: 'A', score: 100 },
            { label: '按时间顺序存放', value: 'B', score: 60 },
            { label: '用搜索功能查找', value: 'C', score: 40 },
            { label: '存在常用的几个文件夹', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 8,
        questionText: '在规划长期项目时，你倾向于：',
        dimension: 'systematic',
        options: [
            { label: '制定详细的阶段目标和里程碑', value: 'A', score: 100 },
            { label: '设定最终目标，过程灵活调整', value: 'B', score: 60 },
            { label: '先做起来再说', value: 'C', score: 40 },
            { label: '参考行业标准流程', value: 'D', score: 80 }
        ]
    },
    // 创意维度 (9-12题)
    {
        questionId: 9,
        questionText: '面对常规任务，你会：',
        dimension: 'creative',
        options: [
            { label: '尝试用新方法和新工具', value: 'A', score: 100 },
            { label: '按照已有流程完成', value: 'B', score: 40 },
            { label: '优化现有方法提高效率', value: 'C', score: 70 },
            { label: '寻求他人建议', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 10,
        questionText: '在头脑风暴时，你通常：',
        dimension: 'creative',
        options: [
            { label: '提出很多新奇的想法', value: 'A', score: 100 },
            { label: '完善别人的想法', value: 'B', score: 60 },
            { label: '评估想法的可行性', value: 'C', score: 50 },
            { label: '记录和整理所有想法', value: 'D', score: 70 }
        ]
    },
    {
        questionId: 11,
        questionText: '遇到限制条件时，你会：',
        dimension: 'creative',
        options: [
            { label: '把限制当作创意挑战', value: 'A', score: 100 },
            { label: '想办法绕过限制', value: 'B', score: 80 },
            { label: '在限制内尽力而为', value: 'C', score: 50 },
            { label: '寻求更多资源', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 12,
        questionText: '你更喜欢的工作环境是：',
        dimension: 'creative',
        options: [
            { label: '充满变化和新挑战', value: 'A', score: 100 },
            { label: '稳定可预测', value: 'B', score: 40 },
            { label: '有一定自由度', value: 'C', score: 70 },
            { label: '明确的目标和方向', value: 'D', score: 50 }
        ]
    },
    // 逻辑维度 (13-16题)
    {
        questionId: 13,
        questionText: '解决问题时，你的思路是：',
        dimension: 'logical',
        options: [
            { label: '分析原因，找出根本问题', value: 'A', score: 100 },
            { label: '尝试不同方法看哪个有效', value: 'B', score: 60 },
            { label: '参考类似问题的解决方案', value: 'C', score: 70 },
            { label: '咨询专家意见', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 14,
        questionText: '在做决策时，你依靠：',
        dimension: 'logical',
        options: [
            { label: '数据分析和逻辑推理', value: 'A', score: 100 },
            { label: '直觉和经验', value: 'B', score: 50 },
            { label: '多方意见综合', value: 'C', score: 70 },
            { label: '试错和快速调整', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 15,
        questionText: '面对复杂信息时，你会：',
        dimension: 'logical',
        options: [
            { label: '提炼关键要素，建立逻辑关系', value: 'A', score: 100 },
            { label: '全面了解所有细节', value: 'B', score: 70 },
            { label: '抓住核心要点即可', value: 'C', score: 60 },
            { label: '制作思维导图整理', value: 'D', score: 80 }
        ]
    },
    {
        questionId: 16,
        questionText: '在评估方案时，你注重：',
        dimension: 'logical',
        options: [
            { label: '逻辑严密性和可行性', value: 'A', score: 100 },
            { label: '创新性和吸引力', value: 'B', score: 60 },
            { label: '实施难度和成本', value: 'C', score: 80 },
            { label: '团队接受度', value: 'D', score: 50 }
        ]
    },
    // 稳定维度 (17-20题)
    {
        questionId: 17,
        questionText: '在项目中，你更看重：',
        dimension: 'stable',
        options: [
            { label: '按时交付和质量稳定', value: 'A', score: 100 },
            { label: '创新和突破', value: 'B', score: 50 },
            { label: '团队协作', value: 'C', score: 70 },
            { label: '个人成长', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 18,
        questionText: '面对不确定性时，你会：',
        dimension: 'stable',
        options: [
            { label: '制定风险预案和备选方案', value: 'A', score: 100 },
            { label: '保持灵活，随机应变', value: 'B', score: 50 },
            { label: '尽可能收集更多信息', value: 'C', score: 80 },
            { label: '相信自己的判断力', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 19,
        questionText: '在工作节奏上，你倾向于：',
        dimension: 'stable',
        options: [
            { label: '稳定持续推进', value: 'A', score: 100 },
            { label: '集中爆发突击', value: 'B', score: 40 },
            { label: '根据状态调整', value: 'C', score: 60 },
            { label: '跟随团队节奏', value: 'D', score: 70 }
        ]
    },
    {
        questionId: 20,
        questionText: '对待规则和流程，你的态度是：',
        dimension: 'stable',
        options: [
            { label: '严格遵守，确保规范', value: 'A', score: 100 },
            { label: '灵活变通，注重结果', value: 'B', score: 40 },
            { label: '理解意义后执行', value: 'C', score: 70 },
            { label: '优化改进现有流程', value: 'D', score: 60 }
        ]
    },
    // 探索维度 (21-24题)
    {
        questionId: 21,
        questionText: '接触新领域时，你的反应是：',
        dimension: 'exploratory',
        options: [
            { label: '兴奋，迫不及待想尝试', value: 'A', score: 100 },
            { label: '谨慎，先了解再决定', value: 'B', score: 50 },
            { label: '评估是否对自己有价值', value: 'C', score: 70 },
            { label: '看看别人怎么做', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 22,
        questionText: '在学习新技能时，你会：',
        dimension: 'exploratory',
        options: [
            { label: '主动探索，边学边试', value: 'A', score: 100 },
            { label: '系统学习，掌握基础', value: 'B', score: 60 },
            { label: '用到哪学到哪', value: 'C', score: 70 },
            { label: '跟着教程一步步来', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 23,
        questionText: '面对未知的项目类型，你会：',
        dimension: 'exploratory',
        options: [
            { label: '把它当作学习机会，积极尝试', value: 'A', score: 100 },
            { label: '评估风险后再决定', value: 'B', score: 60 },
            { label: '找有经验的人合作', value: 'C', score: 70 },
            { label: '优先选择熟悉的项目', value: 'D', score: 40 }
        ]
    },
    {
        questionId: 24,
        questionText: '在职业发展上，你更倾向于：',
        dimension: 'exploratory',
        options: [
            { label: '尝试不同领域，寻找可能性', value: 'A', score: 100 },
            { label: '深耕一个领域成为专家', value: 'B', score: 50 },
            { label: '根据机会灵活调整', value: 'C', score: 70 },
            { label: '跟随行业发展趋势', value: 'D', score: 60 }
        ]
    },
    // 执行维度 (25-28题)
    {
        questionId: 25,
        questionText: '拿到任务后，你会：',
        dimension: 'execution',
        options: [
            { label: '立即开始行动', value: 'A', score: 100 },
            { label: '先充分规划再执行', value: 'B', score: 70 },
            { label: '了解背景和目标', value: 'C', score: 60 },
            { label: '和团队讨论方案', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 26,
        questionText: '在项目推进中，你更关注：',
        dimension: 'execution',
        options: [
            { label: '任务完成进度和效率', value: 'A', score: 100 },
            { label: '方案优化和改进', value: 'B', score: 60 },
            { label: '团队协作和沟通', value: 'C', score: 50 },
            { label: '质量和细节', value: 'D', score: 80 }
        ]
    },
    {
        questionId: 27,
        questionText: '遇到障碍时，你会：',
        dimension: 'execution',
        options: [
            { label: '想办法快速解决继续推进', value: 'A', score: 100 },
            { label: '分析原因寻找根本解决方案', value: 'B', score: 70 },
            { label: '寻求帮助和资源', value: 'C', score: 60 },
            { label: '调整计划或目标', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 28,
        questionText: '对于deadline，你的习惯是：',
        dimension: 'execution',
        options: [
            { label: '提前完成，留出buffer', value: 'A', score: 100 },
            { label: '按时完成即可', value: 'B', score: 70 },
            { label: '最后冲刺完成', value: 'C', score: 40 },
            { label: '根据重要性调整', value: 'D', score: 60 }
        ]
    },
    // 沟通维度 (29-32题)
    {
        questionId: 29,
        questionText: '在团队讨论中，你通常：',
        dimension: 'communication',
        options: [
            { label: '主动分享观点和想法', value: 'A', score: 100 },
            { label: '倾听为主，关键时发言', value: 'B', score: 60 },
            { label: '总结大家的观点', value: 'C', score: 80 },
            { label: '提出问题引发思考', value: 'D', score: 70 }
        ]
    },
    {
        questionId: 30,
        questionText: '需要说服他人时，你会：',
        dimension: 'communication',
        options: [
            { label: '用数据和案例论证', value: 'A', score: 80 },
            { label: '讲清楚利益和价值', value: 'B', score: 100 },
            { label: '站在对方角度思考', value: 'C', score: 90 },
            { label: '展示实际效果', value: 'D', score: 70 }
        ]
    },
    {
        questionId: 31,
        questionText: '在协作冲突中，你倾向于：',
        dimension: 'communication',
        options: [
            { label: '主动沟通，寻求共识', value: 'A', score: 100 },
            { label: '分析问题，找出根源', value: 'B', score: 70 },
            { label: '先避免冲突，再私下解决', value: 'C', score: 50 },
            { label: '寻求第三方调解', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 32,
        questionText: '你更喜欢的沟通方式是：',
        dimension: 'communication',
        options: [
            { label: '面对面交流', value: 'A', score: 100 },
            { label: '文字记录和文档', value: 'B', score: 50 },
            { label: '语音或视频会议', value: 'C', score: 80 },
            { label: '根据情况灵活选择', value: 'D', score: 70 }
        ]
    },
    // 学习维度 (33-36题)
    {
        questionId: 33,
        questionText: '学习新知识时，你更喜欢：',
        dimension: 'learning',
        options: [
            { label: '快速上手，在实践中学习', value: 'A', score: 100 },
            { label: '系统学习，打好基础', value: 'B', score: 70 },
            { label: '针对性学习，用到什么学什么', value: 'C', score: 80 },
            { label: '向专家请教', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 34,
        questionText: '遇到不懂的问题时，你会：',
        dimension: 'learning',
        options: [
            { label: '自己查资料研究', value: 'A', score: 100 },
            { label: '请教有经验的人', value: 'B', score: 70 },
            { label: '在实践中摸索', value: 'C', score: 80 },
            { label: '参加培训或课程', value: 'D', score: 60 }
        ]
    },
    {
        questionId: 35,
        questionText: '对于反馈和建议，你的态度是：',
        dimension: 'learning',
        options: [
            { label: '虚心接受，快速改进', value: 'A', score: 100 },
            { label: '分析判断，有选择地采纳', value: 'B', score: 80 },
            { label: '感谢接受，逐步调整', value: 'C', score: 70 },
            { label: '保留自己的判断', value: 'D', score: 50 }
        ]
    },
    {
        questionId: 36,
        questionText: '你认为最有效的成长方式是：',
        dimension: 'learning',
        options: [
            { label: '在真实项目中解决实际问题', value: 'A', score: 100 },
            { label: '系统学习理论知识', value: 'B', score: 60 },
            { label: '向优秀的人学习', value: 'C', score: 80 },
            { label: '不断尝试和反思', value: 'D', score: 90 }
        ]
    }
];
const initOPCQuestions = async () => {
    try {
        console.log('开始初始化OPC测试题库...');
        // 清空现有题库
        await OPCQuestion_1.OPCQuestion.deleteMany({});
        console.log('✓ 清空现有题库');
        // 插入新题库
        await OPCQuestion_1.OPCQuestion.insertMany(questions);
        console.log(`✓ 成功插入 ${questions.length} 道测试题`);
        console.log('\n题库按维度分布:');
        const dimensions = ['visual', 'systematic', 'creative', 'logical', 'stable', 'exploratory', 'execution', 'communication', 'learning'];
        for (const dim of dimensions) {
            const count = questions.filter(q => q.dimension === dim).length;
            console.log(`  - ${dim}: ${count}题`);
        }
        console.log('\n✓ OPC测试题库初始化完成！');
    }
    catch (error) {
        console.error('❌ 初始化失败:', error.message);
        throw error;
    }
};
exports.initOPCQuestions = initOPCQuestions;
// 直接运行
if (require.main === module) {
    const run = async () => {
        try {
            await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng');
            console.log('✓ 已连接到数据库');
            await (0, exports.initOPCQuestions)();
            await mongoose_1.default.connection.close();
            console.log('\n✓ 数据库连接已关闭');
            process.exit(0);
        }
        catch (error) {
            console.error('执行失败:', error);
            process.exit(1);
        }
    };
    run();
}
//# sourceMappingURL=initOPCQuestions.js.map