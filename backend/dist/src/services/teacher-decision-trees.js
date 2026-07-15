"use strict";
/**
 * 导师决策树
 * 不是每次都调用GPT-4，而是用规则引擎快速响应常见场景
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qichengDecisionTree = exports.orangeDecisionTree = exports.QiChengDecisionTree = exports.OrangeDecisionTree = void 0;
/**
 * 橙子的决策树
 */
class OrangeDecisionTree {
    /**
     * 主决策函数：判断是否需要调用AI
     */
    decide(message, context) {
        // 1. 情绪检测（规则引擎）
        const emotionDetection = this.detectEmotionByRules(message);
        if (emotionDetection.needsIntervention) {
            return this.handleEmotionalCrisis(message, emotionDetection, context);
        }
        // 2. 常见问题检测
        const commonQuestion = this.matchCommonQuestion(message, context);
        if (commonQuestion) {
            return {
                shouldUseAI: false,
                response: commonQuestion.response,
                action: commonQuestion.action,
                emotionalTone: 'supportive',
                nextSteps: commonQuestion.nextSteps,
                reason: 'matched_common_question'
            };
        }
        // 3. 阶段特定引导
        const stageGuidance = this.getStageSpecificGuidance(message, context);
        if (stageGuidance) {
            return {
                shouldUseAI: false,
                ...stageGuidance,
                reason: 'stage_specific_guidance'
            };
        }
        // 4. 进度鼓励
        const progressEncouragement = this.checkProgressMilestone(context);
        if (progressEncouragement) {
            return {
                shouldUseAI: false,
                ...progressEncouragement,
                reason: 'progress_milestone'
            };
        }
        // 5. 复杂问题 → 调用AI
        return {
            shouldUseAI: true,
            reason: 'complex_question_needs_ai'
        };
    }
    /**
     * 规则引擎：情绪检测
     */
    detectEmotionByRules(message) {
        const msg = message.toLowerCase();
        // 挫败感关键词
        const frustrationKeywords = [
            '做不出来', '不会', '太难', '放弃', '不想做',
            '搞不懂', '看不懂', '学不会', '没思路', '不知道怎么'
        ];
        // 焦虑关键词
        const anxietyKeywords = [
            '来不及', '时间不够', '赶不上', '担心', '害怕',
            '紧张', '压力', '焦虑'
        ];
        // 困惑关键词
        const confusionKeywords = [
            '什么意思', '不理解', '不明白', '为什么', '怎么',
            '是什么', '有什么区别', '不懂'
        ];
        // 检测挫败感
        for (const keyword of frustrationKeywords) {
            if (msg.includes(keyword)) {
                const severity = msg.includes('完全') || msg.includes('根本') ? 'severe' : 'moderate';
                return {
                    emotion: 'frustration',
                    severity,
                    needsIntervention: severity === 'severe'
                };
            }
        }
        // 检测焦虑
        for (const keyword of anxietyKeywords) {
            if (msg.includes(keyword)) {
                return {
                    emotion: 'anxiety',
                    severity: 'moderate',
                    needsIntervention: true
                };
            }
        }
        // 检测困惑
        for (const keyword of confusionKeywords) {
            if (msg.includes(keyword)) {
                return {
                    emotion: 'confusion',
                    severity: 'mild',
                    needsIntervention: false
                };
            }
        }
        return {
            emotion: 'neutral',
            severity: 'none',
            needsIntervention: false
        };
    }
    /**
     * 处理情绪危机
     */
    handleEmotionalCrisis(message, emotion, context) {
        if (emotion.emotion === 'frustration') {
            return {
                shouldUseAI: false,
                response: `我理解你现在的感受，遇到困难很正常。我们一起来看看卡在哪里了。能告诉我具体是哪个部分让你觉得难吗？我们可以把它拆解成更小的步骤。`,
                action: 'break_down_task',
                emotionalTone: 'understanding',
                nextSteps: [
                    '告诉我具体卡在哪个步骤',
                    '我们一起把任务拆小',
                    '先完成最简单的部分'
                ],
                reason: 'frustration_intervention'
            };
        }
        if (emotion.emotion === 'anxiety') {
            return {
                shouldUseAI: false,
                response: `别担心，这个任务的时间安排是合理的。我们先看看你已经完成了什么，然后规划一下剩下的部分。一步一步来，不着急。`,
                action: 'time_management',
                emotionalTone: 'calming',
                nextSteps: [
                    '列出已完成的部分',
                    '估算剩余时间',
                    '制定简单的计划'
                ],
                reason: 'anxiety_intervention'
            };
        }
        return { shouldUseAI: true };
    }
    /**
     * 匹配常见问题
     */
    matchCommonQuestion(message, context) {
        const msg = message.toLowerCase();
        // 问题库
        const commonQuestions = [
            {
                patterns: ['什么是痛点', '痛点是什么', '怎么找痛点'],
                response: '痛点就是用户遇到的具体困扰。比如"手机电量不够用"就是一个痛点。你可以想想：你的目标用户每天会遇到什么麻烦？什么事情让他们觉得烦？',
                action: 'provide_example',
                nextSteps: [
                    '想想你自己遇到过什么困扰',
                    '观察身边人的抱怨',
                    '列出3-5个具体的困扰'
                ]
            },
            {
                patterns: ['怎么用chatgpt', 'chatgpt怎么用', 'gpt怎么用'],
                response: '用ChatGPT很简单：1) 打开chat.openai.com，2) 在对话框输入你的问题或需求，3) 看回复，如果不满意就继续追问。关键是把你的需求说清楚、具体。',
                action: 'provide_template',
                nextSteps: [
                    '试着问一个具体的问题',
                    '如果回复不满意，追问"能更具体吗"',
                    '多试几次，找到感觉'
                ]
            },
            {
                patterns: ['怎么写prompt', 'prompt怎么写', '提示词怎么写'],
                response: 'Prompt就是给AI的指令。好的prompt要包含：1) 角色（你是谁），2) 任务（做什么），3) 要求（什么标准）。比如："你是文案专家，帮我写一个手表广告，要突出续航长，30字以内"。',
                action: 'provide_template',
                nextSteps: [
                    '先说清楚角色',
                    '再说清楚任务',
                    '最后说清楚要求'
                ]
            },
            {
                patterns: ['怎么开始', '从哪开始', '第一步做什么'],
                response: `现在你在${context.currentStage}阶段。第一步很简单：${this.getFirstStepForStage(context.currentStage)}。不用想太复杂，先动手做起来。`,
                action: 'break_down_task',
                nextSteps: this.getStageFirstSteps(context.currentStage)
            },
            {
                patterns: ['这样对吗', '这样可以吗', '这样行吗', '我这个怎么样'],
                response: '把你做的发给我看看，我帮你看看哪里做得好，哪里可以改进。',
                action: 'request_work',
                nextSteps: [
                    '把你的作品发给我',
                    '我会指出具体的优点和改进点',
                    '然后你可以针对性地修改'
                ]
            },
            {
                patterns: ['没灵感', '想不出来', '没思路', '不知道写什么'],
                response: '没灵感很正常。试试这个方法：1) 先不管好坏，写3个版本，2) 从这3个里挑一个最不讨厌的，3) 在这个基础上改。不要追求完美，先有再好。',
                action: 'provide_method',
                nextSteps: [
                    '快速写3个版本（不管好坏）',
                    '挑一个最不讨厌的',
                    '在这个基础上改进'
                ]
            }
        ];
        for (const q of commonQuestions) {
            for (const pattern of q.patterns) {
                if (msg.includes(pattern)) {
                    return q;
                }
            }
        }
        return null;
    }
    /**
     * 阶段特定引导
     */
    getStageSpecificGuidance(message, context) {
        const stage = context.currentStage;
        const msg = message.toLowerCase();
        // Context阶段
        if (stage === 'context' && msg.includes('场景')) {
            return {
                response: '场景就是"谁在什么情况下遇到什么问题"。比如："小红书博主在拍视频时，发现自己的声音不好听"。试着用这个格式描述你的场景。',
                action: 'provide_template',
                emotionalTone: 'guiding',
                nextSteps: [
                    '想一个具体的人（谁）',
                    '想一个具体的情况（什么时候）',
                    '想一个具体的问题（遇到什么困扰）'
                ]
            };
        }
        // Decompose阶段
        if (stage === 'decompose' && (msg.includes('拆解') || msg.includes('分解'))) {
            return {
                response: '拆解就是把大任务变成小步骤。每个步骤要具体到"能直接动手做"。比如"做视频"太大，拆成"1.写脚本 2.录音 3.找素材 4.剪辑"就清楚了。',
                action: 'provide_example',
                emotionalTone: 'guiding',
                nextSteps: [
                    '把任务写下来',
                    '问自己：第一步具体做什么？',
                    '每一步都要能直接动手'
                ]
            };
        }
        // Knowledge阶段
        if (stage === 'knowledge' && (msg.includes('工具') || msg.includes('怎么用'))) {
            return {
                response: '学工具最快的方法：1) 看一个5分钟的教程视频，2) 立刻打开工具试一次，3) 遇到问题再查。不要想着全学会再动手，边做边学最快。',
                action: 'provide_method',
                emotionalTone: 'encouraging',
                nextSteps: [
                    '找一个最简单的教程（5分钟内）',
                    '立刻打开工具试一次',
                    '遇到问题再来问我'
                ]
            };
        }
        // Iterate阶段
        if (stage === 'iterate' && (msg.includes('改') || msg.includes('优化'))) {
            return {
                response: '改进的方法：1) 先列出3个最明显的问题，2) 每次只改1个，3) 改完对比一下。不要一次改太多，容易乱。',
                action: 'provide_method',
                emotionalTone: 'guiding',
                nextSteps: [
                    '列出3个最明显的问题',
                    '先改最简单的那个',
                    '改完对比一下效果'
                ]
            };
        }
        return null;
    }
    /**
     * 检查进度里程碑
     */
    checkProgressMilestone(context) {
        const progress = context.learningProgress;
        // 第一次完成某个阶段
        if (progress.firstTimeCompleting) {
            return {
                response: `太棒了！你完成了第一个${context.currentStage}阶段。这个能力在实际工作中很有用，继续加油！`,
                action: 'celebrate',
                emotionalTone: 'celebrating',
                nextSteps: [
                    '休息一下',
                    '回顾一下学到了什么',
                    '准备进入下一阶段'
                ]
            };
        }
        // 连续完成多个任务
        if (progress.consecutiveCompletions >= 3) {
            return {
                response: `你已经连续完成${progress.consecutiveCompletions}个任务了，学习状态很好！保持这个节奏。`,
                action: 'encourage',
                emotionalTone: 'encouraging',
                nextSteps: [
                    '继续保持',
                    '可以尝试更有挑战的任务'
                ]
            };
        }
        return null;
    }
    /**
     * 获取阶段的第一步
     */
    getFirstStepForStage(stage) {
        const firstSteps = {
            'context': '读一遍场景描述，想象你就是那个遇到问题的人',
            'decompose': '把任务写下来，然后问自己：第一步具体做什么？',
            'knowledge': '打开需要用的工具，先随便试试，熟悉一下界面',
            'iterate': '看看你的第一版，找出3个最明显的问题',
            'reflect': '回想一下整个过程，哪个部分最难？学到了什么？'
        };
        return firstSteps[stage] || '先读一遍任务要求，理解要做什么';
    }
    /**
     * 获取阶段的具体步骤
     */
    getStageFirstSteps(stage) {
        const steps = {
            'context': [
                '读场景描述',
                '想象自己是那个人',
                '理解他的困扰'
            ],
            'decompose': [
                '写下任务',
                '列出3-5个步骤',
                '确保每步都具体'
            ],
            'knowledge': [
                '打开工具',
                '试着操作一次',
                '遇到问题再查'
            ],
            'iterate': [
                '找出3个问题',
                '先改最简单的',
                '改完对比效果'
            ],
            'reflect': [
                '回顾整个过程',
                '总结学到的',
                '想想如何应用'
            ]
        };
        return steps[stage] || ['开始动手', '遇到问题随时问我'];
    }
    /**
     * 判断是否需要严格要求
     */
    shouldBeStrict(context) {
        const progress = context.learningProgress;
        // 学生已经多次犯同样的错误
        if (progress.repeatedMistakes && progress.repeatedMistakes.length >= 2) {
            return true;
        }
        // 学生在Iterate阶段，但没有真正改进
        if (context.currentStage === 'iterate' && progress.iterationCount >= 3) {
            return true;
        }
        // 学生完成率很低
        if (progress.completionRate < 0.5 && progress.coursesAttempted >= 3) {
            return true;
        }
        return false;
    }
    /**
     * 判断是否需要鼓励
     */
    shouldEncourage(context) {
        const progress = context.learningProgress;
        // 新学生
        if (progress.coursesCompleted === 0) {
            return true;
        }
        // 最近遇到困难
        if (progress.recentFailures >= 2) {
            return true;
        }
        // 学习时间很长但还没完成
        if (progress.timeSpentHours > 5 && !progress.currentStageCompleted) {
            return true;
        }
        return false;
    }
}
exports.OrangeDecisionTree = OrangeDecisionTree;
/**
 * 启程老师的决策树
 */
class QiChengDecisionTree {
    /**
     * 判断任务是否适合学生（规则引擎）
     */
    quickMatchTask(taskRequirements, studentProfile) {
        // 规则1：技能匹配度
        const requiredSkills = taskRequirements.skills || [];
        const studentSkills = studentProfile.skills || {};
        let matchedSkills = 0;
        let totalSkills = requiredSkills.length;
        for (const skill of requiredSkills) {
            if (studentSkills[skill] && studentSkills[skill] >= 0.6) {
                matchedSkills++;
            }
        }
        const skillMatchRate = totalSkills > 0 ? matchedSkills / totalSkills : 0;
        // 规则2：难度匹配
        const taskDifficulty = taskRequirements.difficulty || 5;
        const studentLevel = studentProfile.level || 5;
        const difficultyGap = Math.abs(taskDifficulty - studentLevel);
        // 规则3：时间匹配
        const taskHours = taskRequirements.estimatedHours || 4;
        const studentAvailableHours = studentProfile.availableHours || 10;
        // 快速判断
        if (skillMatchRate >= 0.8 && difficultyGap <= 1 && taskHours <= studentAvailableHours) {
            return {
                suitable: true,
                confidence: 0.9,
                reason: '技能匹配度高，难度适中，时间充足',
                needsAI: false
            };
        }
        if (skillMatchRate < 0.3 || difficultyGap > 3) {
            return {
                suitable: false,
                confidence: 0.9,
                reason: skillMatchRate < 0.3 ? '缺少关键技能' : '难度差距太大',
                needsAI: false
            };
        }
        // 边界情况 → 需要AI判断
        return {
            suitable: false,
            confidence: 0.5,
            reason: '需要详细分析',
            needsAI: true
        };
    }
    /**
     * 快速翻译常见术语
     */
    quickTranslateTerm(term) {
        const termDict = {
            'ROI': {
                translation: '投资回报率',
                explanation: '简单说就是花1块钱能赚回多少钱'
            },
            'CTR': {
                translation: '点击率',
                explanation: '100个人看到广告，有多少人点击'
            },
            'conversion': {
                translation: '转化',
                explanation: '访客变成付费客户'
            },
            'engagement': {
                translation: '互动率',
                explanation: '用户点赞、评论、分享的比例'
            },
            'retention': {
                translation: '留存率',
                explanation: '用户第二天还会回来的比例'
            },
            'KPI': {
                translation: '关键指标',
                explanation: '衡量工作成果的核心数据'
            },
            'MVP': {
                translation: '最小可行产品',
                explanation: '用最少的功能验证想法是否可行'
            },
            'A/B测试': {
                translation: 'A/B测试',
                explanation: '做两个版本，看哪个效果更好'
            },
            'SEO': {
                translation: '搜索引擎优化',
                explanation: '让你的内容在搜索结果中排名更高'
            },
            'UGC': {
                translation: '用户生成内容',
                explanation: '用户自己创作的内容，比如评论、晒单'
            }
        };
        const termLower = term.toLowerCase();
        for (const [key, value] of Object.entries(termDict)) {
            if (termLower.includes(key.toLowerCase())) {
                return value;
            }
        }
        return null;
    }
    /**
     * 判断是否需要详细翻译
     */
    needsDetailedTranslation(message) {
        // 包含多个专业术语
        const professionalTerms = ['ROI', 'CTR', 'KPI', 'conversion', 'engagement', 'retention'];
        let termCount = 0;
        for (const term of professionalTerms) {
            if (message.toLowerCase().includes(term.toLowerCase())) {
                termCount++;
            }
        }
        if (termCount >= 3) {
            return true;
        }
        // 包含复杂的业务逻辑
        const complexPatterns = [
            '漏斗', '转化路径', '用户旅程', '增长模型',
            '商业模式', '盈利模式', '成本结构'
        ];
        for (const pattern of complexPatterns) {
            if (message.includes(pattern)) {
                return true;
            }
        }
        return false;
    }
}
exports.QiChengDecisionTree = QiChengDecisionTree;
// 导出实例
exports.orangeDecisionTree = new OrangeDecisionTree();
exports.qichengDecisionTree = new QiChengDecisionTree();
//# sourceMappingURL=teacher-decision-trees.js.map