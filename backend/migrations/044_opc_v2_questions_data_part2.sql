-- OPC能力画像测试题目数据 v2.0 - Part 2
-- 维度四、五、六的题目

-- ============================================
-- 维度四: 任务执行节奏 (6题, 题号21-26)
-- ============================================

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(21, 'choice', '开始一项新任务时，你通常：', 'task_execution',
 '[
   {"label": "A", "text": "先做一个详细计划，按步骤执行", "scoring": {"dimension": "task_execution", "value": 3, "direction": "planning"}},
   {"label": "B", "text": "先快速出一个粗糙版本，看看方向对不对", "scoring": {"dimension": "task_execution", "value": 3, "direction": "iterative"}},
   {"label": "C", "text": "先收集足够的信息和参考，再动手", "scoring": {"dimension": "task_execution", "value": 1, "direction": "planning"}},
   {"label": "D", "text": "先和需求方反复确认，确保理解一致", "scoring": {"dimension": "task_execution", "value": 2, "direction": "planning"}}
 ]'::jsonb, 21);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(22, 'choice', '任务进行到一半发现方向可能有问题，你通常：', 'task_execution',
 '[
   {"label": "A", "text": "停下来重新评估，调整计划后继续", "scoring": {"dimension": "task_execution", "value": 2, "direction": "planning"}},
   {"label": "B", "text": "先继续做，在过程中逐步修正", "scoring": {"dimension": "task_execution", "value": 3, "direction": "iterative"}},
   {"label": "C", "text": "先把当前版本做完，下一版再改", "scoring": {"dimension": "task_execution", "value": 1, "direction": "iterative"}},
   {"label": "D", "text": "立即和需求方沟通，确认是否需要调整", "scoring": {"dimension": "task_execution", "value": 1, "direction": "planning"}}
 ]'::jsonb, 22);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(23, 'choice', '面对多个任务并行时，你通常：', 'task_execution',
 '[
   {"label": "A", "text": "排好优先级，做完一个再做下一个", "scoring": {"dimension": "task_execution", "value": 3, "direction": "planning"}},
   {"label": "B", "text": "几个任务轮着做，保持新鲜感", "scoring": {"dimension": "task_execution", "value": 1, "direction": "iterative"}},
   {"label": "C", "text": "看哪个任务最有灵感就先做哪个", "scoring": {"dimension": "task_execution", "value": 3, "direction": "iterative"}},
   {"label": "D", "text": "把相似的任务批量处理", "scoring": {"dimension": "task_execution", "value": 2, "direction": "planning"}}
 ]'::jsonb, 23);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(24, 'choice', '交付前的时间压力下，你通常：', 'task_execution',
 '[
   {"label": "A", "text": "按既定计划推进，确保质量不降", "scoring": {"dimension": "task_execution", "value": 3, "direction": "planning"}},
   {"label": "B", "text": "聚焦最核心的部分，砍掉非必需内容", "scoring": {"dimension": "task_execution", "value": 2, "direction": "iterative"}},
   {"label": "C", "text": "加快速度，能用捷径就用捷径", "scoring": {"dimension": "task_execution", "value": 3, "direction": "iterative"}},
   {"label": "D", "text": "沟通是否可以延期或分批交付", "scoring": {"dimension": "task_execution", "value": 1, "direction": "planning"}}
 ]'::jsonb, 24);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(25, 'choice', '你更适应哪种工作节奏？', 'task_execution',
 '[
   {"label": "A", "text": "稳定的日常节奏，每天推进固定进度", "scoring": {"dimension": "task_execution", "value": 3, "direction": "planning"}},
   {"label": "B", "text": "冲刺式，集中一段时间高强度完成", "scoring": {"dimension": "task_execution", "value": 1, "direction": "iterative"}},
   {"label": "C", "text": "随性的，有灵感就多做，没灵感就少做", "scoring": {"dimension": "task_execution", "value": 3, "direction": "iterative"}},
   {"label": "D", "text": "看任务类型而定，不同任务不同节奏", "scoring": {"dimension": "task_execution", "value": 1, "direction": "planning"}}
 ]'::jsonb, 25);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(26, 'choice', '一个项目完成后，你通常会：', 'task_execution',
 '[
   {"label": "A", "text": "复盘总结，记录可以优化的地方", "scoring": {"dimension": "task_execution", "value": 2, "direction": "planning"}},
   {"label": "B", "text": "看最终效果是否达到预期，不太纠结过程", "scoring": {"dimension": "task_execution", "value": 1, "direction": "iterative"}},
   {"label": "C", "text": "收集反馈，看看哪里还可以更好", "scoring": {"dimension": "task_execution", "value": 3, "direction": "iterative"}},
   {"label": "D", "text": "直接进入下一个项目，不喜欢回头看", "scoring": {"dimension": "task_execution", "value": 2, "direction": "iterative"}}
 ]'::jsonb, 26);

-- ============================================
-- 维度五: 协作与沟通倾向 (6题, 题号27-32)
-- ============================================

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(27, 'choice', '在一个项目中，你更享受：', 'collaboration',
 '[
   {"label": "A", "text": "自己从头到尾负责一个完整模块", "scoring": {"dimension": "collaboration", "value": 3, "direction": "independent"}},
   {"label": "B", "text": "和他人分工配合，各做自己擅长的部分", "scoring": {"dimension": "collaboration", "value": 3, "direction": "collaborative"}},
   {"label": "C", "text": "负责整体统筹协调，把大家组织起来", "scoring": {"dimension": "collaboration", "value": 2, "direction": "collaborative"}},
   {"label": "D", "text": "做那个提供关键解决方案的人", "scoring": {"dimension": "collaboration", "value": 1, "direction": "independent"}}
 ]'::jsonb, 27);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(28, 'choice', '和他人合作时，你更在意：', 'collaboration',
 '[
   {"label": "A", "text": "分工是否清晰，边界是否明确", "scoring": {"dimension": "collaboration", "value": 2, "direction": "independent"}},
   {"label": "B", "text": "沟通是否顺畅，信息是否同步", "scoring": {"dimension": "collaboration", "value": 3, "direction": "collaborative"}},
   {"label": "C", "text": "对方的专业能力是否可靠", "scoring": {"dimension": "collaboration", "value": 1, "direction": "independent"}},
   {"label": "D", "text": "大家的审美和标准是否一致", "scoring": {"dimension": "collaboration", "value": 1, "direction": "collaborative"}}
 ]'::jsonb, 28);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(29, 'choice', '当你对队友的交付物不满意时，你通常：', 'collaboration',
 '[
   {"label": "A", "text": "自己动手改，比沟通快", "scoring": {"dimension": "collaboration", "value": 3, "direction": "independent"}},
   {"label": "B", "text": "直接指出问题，给出具体修改意见", "scoring": {"dimension": "collaboration", "value": 1, "direction": "independent"}},
   {"label": "C", "text": "先肯定做得好的部分，再提建议", "scoring": {"dimension": "collaboration", "value": 3, "direction": "collaborative"}},
   {"label": "D", "text": "问清楚对方的思路，理解为什么这样做", "scoring": {"dimension": "collaboration", "value": 2, "direction": "collaborative"}}
 ]'::jsonb, 29);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(30, 'choice', '你更倾向于哪种沟通方式？', 'collaboration',
 '[
   {"label": "A", "text": "文字沟通——异步、有记录、可回溯", "scoring": {"dimension": "collaboration", "value": 2, "direction": "independent"}},
   {"label": "B", "text": "语音或面对面——同步、高效、有情感", "scoring": {"dimension": "collaboration", "value": 3, "direction": "collaborative"}},
   {"label": "C", "text": "看情况——简单的事文字，复杂的事语音", "scoring": {"dimension": "collaboration", "value": 1, "direction": "collaborative"}},
   {"label": "D", "text": "用具体案例或参考图代替语言描述", "scoring": {"dimension": "collaboration", "value": 1, "direction": "independent"}}
 ]'::jsonb, 30);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(31, 'choice', '你觉得一个理想的工作伙伴应该是：', 'collaboration',
 '[
   {"label": "A", "text": "专业可靠，不需要我操心他的部分", "scoring": {"dimension": "collaboration", "value": 3, "direction": "independent"}},
   {"label": "B", "text": "沟通顺畅，有问题能及时同步", "scoring": {"dimension": "collaboration", "value": 2, "direction": "collaborative"}},
   {"label": "C", "text": "审美和标准一致，不用太多解释", "scoring": {"dimension": "collaboration", "value": 1, "direction": "independent"}},
   {"label": "D", "text": "能互相启发，一起碰撞出更好的方案", "scoring": {"dimension": "collaboration", "value": 3, "direction": "collaborative"}}
 ]'::jsonb, 31);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(32, 'choice', '接到一个需要和别人合作完成的任务，你首先：', 'collaboration',
 '[
   {"label": "A", "text": "明确自己的分工范围，确保自己能独立完成", "scoring": {"dimension": "collaboration", "value": 3, "direction": "independent"}},
   {"label": "B", "text": "和对方对齐整体目标，确保方向一致", "scoring": {"dimension": "collaboration", "value": 2, "direction": "collaborative"}},
   {"label": "C", "text": "了解对方擅长什么，思考怎么配合", "scoring": {"dimension": "collaboration", "value": 3, "direction": "collaborative"}},
   {"label": "D", "text": "先自己理一遍整体思路，再和对方碰", "scoring": {"dimension": "collaboration", "value": 1, "direction": "independent"}}
 ]'::jsonb, 32);

-- ============================================
-- 维度六: 风险与挑战态度 (6题, 题号33-38)
-- ============================================

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(33, 'choice', '面对一个从未做过的项目类型，你通常：', 'risk_attitude',
 '[
   {"label": "A", "text": "先评估自己能不能做，不确定就拒绝", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "conservative"}},
   {"label": "B", "text": "愿意尝试，但会提前说明可能的风险", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "conservative"}},
   {"label": "C", "text": "兴奋，觉得是个学习机会，直接接", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "adventurous"}},
   {"label": "D", "text": "先找有经验的人咨询，再决定是否接", "scoring": {"dimension": "risk_attitude", "value": 2, "direction": "conservative"}}
 ]'::jsonb, 33);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(34, 'choice', '当你在项目中遇到一个完全不会的技术点时，你通常：', 'risk_attitude',
 '[
   {"label": "A", "text": "先自己研究，花时间学会它", "scoring": {"dimension": "risk_attitude", "value": 2, "direction": "adventurous"}},
   {"label": "B", "text": "找替代方案，绕过这个技术点", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "conservative"}},
   {"label": "C", "text": "找人请教或外包这个部分", "scoring": {"dimension": "risk_attitude", "value": 2, "direction": "conservative"}},
   {"label": "D", "text": "评估这个点是否必须，不是必须就砍掉", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "adventurous"}}
 ]'::jsonb, 34);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(35, 'choice', '你更喜欢接什么样的项目？', 'risk_attitude',
 '[
   {"label": "A", "text": "自己熟悉领域的，能稳定高质量交付", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "conservative"}},
   {"label": "B", "text": "有一点挑战的，能学到新东西但不至于失控", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "conservative"}},
   {"label": "C", "text": "完全没做过的，边学边做才有意思", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "adventurous"}},
   {"label": "D", "text": "看收入，收入高就愿意挑战难的", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "adventurous"}}
 ]'::jsonb, 35);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(36, 'choice', '你觉得"冒险"对你来说意味着：', 'risk_attitude',
 '[
   {"label": "A", "text": "谨慎评估后的有限尝试", "scoring": {"dimension": "risk_attitude", "value": 2, "direction": "conservative"}},
   {"label": "B", "text": "为了成长必须付出的代价", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "adventurous"}},
   {"label": "C", "text": "工作中最让人兴奋的部分", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "adventurous"}},
   {"label": "D", "text": "能避免就尽量避免", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "conservative"}}
 ]'::jsonb, 36);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(37, 'choice', '一个项目如果失败，你更可能归因于：', 'risk_attitude',
 '[
   {"label": "A", "text": "前期评估不足，接了自己做不了的任务", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "conservative"}},
   {"label": "B", "text": "过程中某个环节出了问题", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "adventurous"}},
   {"label": "C", "text": "需求不清晰或频繁变动", "scoring": {"dimension": "risk_attitude", "value": 2, "direction": "conservative"}},
   {"label": "D", "text": "运气不好，遇到不可控因素", "scoring": {"dimension": "risk_attitude", "value": 2, "direction": "adventurous"}}
 ]'::jsonb, 37);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(38, 'choice', '你对"稳定"和"成长"的看法更接近：', 'risk_attitude',
 '[
   {"label": "A", "text": "先有稳定交付能力，再追求成长", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "conservative"}},
   {"label": "B", "text": "在成长中建立稳定，两者同步", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "adventurous"}},
   {"label": "C", "text": "成长优先，稳定是成长的副产品", "scoring": {"dimension": "risk_attitude", "value": 3, "direction": "adventurous"}},
   {"label": "D", "text": "看阶段，初期追求成长，后期追求稳定", "scoring": {"dimension": "risk_attitude", "value": 1, "direction": "conservative"}}
 ]'::jsonb, 38);
