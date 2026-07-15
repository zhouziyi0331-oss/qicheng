-- ============================================
-- 补充更多核心天赋标签
-- Migration: 201_more_talent_tags.sql
-- ============================================

-- 学习特质标签
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks, opc_dimension, opc_score_range, opc_tendency) VALUES
('实践学习型', 'hands_on_learner', 'learning', 'learning_style', '边做边学、从实践中学', '拿到任务就开始尝试，在实践中掌握', '能快速上手，通过实践掌握技能', '有教程的任务、可边学边做', 'tool_learning', '{"min": 60, "max": 100}', 'exploratory'),
('理论学习型', 'theory_first_learner', 'learning', 'learning_style', '先学原理再实践', '会先看文档、理解逻辑再动手', '基础扎实，理解深刻', '有文档的任务、需要理解原理', 'tool_learning', '{"min": 0, "max": 40}', 'manual'),
('模仿学习型', 'imitation_learner', 'learning', 'learning_style', '看案例、照着做', '给参考就能做得好', '能快速复制成功案例', '有案例参考的任务', NULL, NULL, NULL),
('举一反三', 'knowledge_transfer', 'learning', 'learning_ability', '学一个会十个', '做过A能快速做B', '能将知识迁移到新场景', '相似任务、知识迁移', NULL, NULL, NULL);

-- 更多天赋标签
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('创意想象', 'creative_imagination', 'talent', 'strategic_thinking', '脑洞大、想法多、角度新', '能提出创新方案和思路', '方案有创意，角度新颖', '创意策划、头脑风暴、方案创新'),
('概念抽象', 'conceptual_abstraction', 'talent', 'strategic_thinking', '善于提炼概念、抽象规律', '能把具体问题抽象成模型', '能提出抽象模型和框架', '框架设计、模型搭建、规则制定'),
('批判性思考', 'critical_thinking', 'talent', 'strategic_thinking', '喜欢质疑、验证、找漏洞', '能发现方案的问题和风险', '能识别风险和问题', '方案审查、测试用例设计、风险评估'),
('因果推理', 'causal_reasoning', 'talent', 'strategic_thinking', '善于追溯原因、推导结果', '能理解业务逻辑的因果链', '能找到问题根源', '流程梳理、问题溯源、策略分析'),
('远见洞察', 'foresight', 'talent', 'strategic_thinking', '能看到趋势、预见结果', '能提前识别潜在问题', '能预判风险和机会', '策略规划、风险预判、趋势分析'),
('模式识别', 'pattern_recognition', 'talent', 'strategic_thinking', '善于发现相似性、总结规律', '能快速识别可复用的模式', '能提出标准化方案', '流程标准化、模板设计、最佳实践'),
('知识整合', 'knowledge_integration', 'talent', 'strategic_thinking', '善于把碎片信息整合成体系', '能快速理解复杂知识', '能构建知识体系', '知识库搭建、资料整理、文档编写');

-- 更多沟通天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('反馈敏感', 'feedback_sensitive', 'talent', 'relationship', '能快速理解反馈、调整方向', '一说就懂、改得快', '接受反馈快，调整及时', '迭代型任务、需要反馈调整'),
('情绪感知', 'emotional_awareness', 'talent', 'relationship', '能感知到情绪、语气、态度', '理解文字背后的情感', '能把握情感基调', '内容创作、客服对话、情感化设计');

-- 更多执行力天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('注意力集中', 'focused_attention', 'talent', 'executing', '能长时间专注一件事', '不容易分心、沉浸式工作', '能深度专注，效率高', '需要深度专注的任务、长时间任务'),
('流程驱动', 'process_driven', 'talent', 'executing', '喜欢按步骤、按计划做事', '执行规范、流程清晰', '执行规范，流程清晰', '标准化任务、流程性工作'),
('稳定可靠', 'reliable', 'talent', 'executing', '输出质量稳定、不容易翻车', '让人放心、可信赖', '质量稳定，可信赖', '长期合作、重要项目'),
('快速恢复', 'resilient', 'talent', 'executing', '犯错后能快速调整', '接受反馈、快速改进', '从错误中快速恢复', '迭代型任务、试错型项目'),
('坚持性强', 'persistent', 'talent', 'executing', '遇到困难不放弃', '能啃硬骨头、持续推进', '能坚持到底', '复杂任务、长期项目');

-- 更多影响力天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('结果导向', 'result_oriented', 'talent', 'influencing', '盯着目标、不达目的不罢休', '关注交付、对结果负责', '目标明确，结果导向', '有明确目标的任务、需要交付的项目'),
('追求卓越', 'excellence_driven', 'talent', 'influencing', '不满足及格，要做到优秀', '主动追求高质量', '主动追求高质量', '需要高质量的任务、标杆项目'),
('挑战精神', 'challenge_seeker', 'talent', 'influencing', '喜欢挑战难题、不怕困难', '愿意接有难度的任务', '敢于挑战', '探索性任务、创新性任务'),
('主动优化', 'proactive_optimizer', 'talent', 'influencing', '不满足于完成，主动优化', '能主动发现优化空间', '能主动提升质量', '需要持续改进的任务');

-- 更多思维方式
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('逻辑推理', 'logical_reasoning', 'thinking', 'problem_solving', '能推导、能论证', '方案有理有据', '逻辑严密', '方案设计、问题分析'),
('系统思考', 'systems_thinking', 'thinking', 'problem_solving', '能看到系统、看到循环', '能识别根本原因', '能找到根本原因', '问题诊断、流程优化'),
('迭代思维', 'iterative_thinking', 'thinking', 'problem_solving', '先做出来再优化', '快速交付、持续改进', '快速迭代', '敏捷项目、快速迭代'),
('发散思维', 'divergent_thinking', 'thinking', 'creativity', '能想出很多可能性', '方案多样、角度多元', '创意丰富', '头脑风暴、创意策划'),
('收敛思维', 'convergent_thinking', 'thinking', 'creativity', '能从多个选项中找到最优', '决策果断、选择准确', '决策准确', '方案选择、优先级判断'),
('类比思维', 'analogical_thinking', 'thinking', 'creativity', '善于用熟悉的比喻不熟悉的', '能跨领域迁移知识', '能跨领域应用', '跨领域任务、知识迁移'),
('网状思维', 'networked_thinking', 'thinking', 'information_processing', '能同时考虑多个因素', '能权衡多方面影响', '考虑全面', '复杂决策、多目标优化');

-- 更多做事风格
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('全局视角', 'big_picture', 'style', 'perspective', '关注整体、关注战略', '能理解需求的业务背景', '能把握全局', '系统设计、整体规划'),
('细节导向', 'detail_focused', 'style', 'perspective', '关注细节、关注执行', '细节把控好、执行到位', '细节到位', '精细化任务、质量把控'),
('探索创新', 'explorative', 'style', 'approach', '喜欢尝试新方法', '方案有创意、不拘一格', '方法创新', '创新型任务、探索性项目'),
('稳定执行', 'stable_execution', 'style', 'approach', '喜欢用成熟方法', '稳定可靠、风险低', '稳定可靠', '常规任务、稳定性要求高'),
('独立自主', 'independent', 'style', 'collaboration', '喜欢自己掌控全局', '不需要太多指导，自己能搞定', '独立完成', '独立任务、远程异步'),
('团队协作', 'collaborative', 'style', 'collaboration', '喜欢和别人一起做事', '配合度高、补位意识强', '协作顺畅', '团队项目、分工协作');

-- ============================================
-- 完成
-- ============================================
