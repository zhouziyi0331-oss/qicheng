/**
 * 简化版工具提示初始化脚本
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

const toolHints = [
  // 任务理解类 (10条)
  { project_type: 'general', task_stage: 'understanding', tool_name: 'analyze_task_requirements', hint_content: '当学生说"我不太理解这个任务"时，分析任务需求。关键词：不理解、不懂、看不懂', example_prompt: '帮我分析这个任务的具体需求', priority: 10 },
  { project_type: 'general', task_stage: 'planning', tool_name: 'break_down_modules', hint_content: '当学生问"怎么拆分"时，拆解功能模块。关键词：怎么拆分、从哪开始、第一步', example_prompt: '这个任务应该怎么拆分成小模块？', priority: 9 },
  { project_type: 'general', task_stage: 'understanding', tool_name: 'explain_technical_terms', hint_content: '当学生遇到专业术语时解释。关键词：是什么、什么是、不知道', example_prompt: 'RESTful API是什么意思？', priority: 8 },
  { project_type: 'general', task_stage: 'assessment', tool_name: 'estimate_difficulty', hint_content: '当学生问"难吗"时评估难度。关键词：难吗、能做吗、适合我吗', example_prompt: '这个任务对我来说难度如何？', priority: 8 },
  { project_type: 'general', task_stage: 'learning', tool_name: 'suggest_learning_path', hint_content: '当学生说"不会XX"时推荐学习路径。关键词：不会、没学过、怎么学', example_prompt: '我不会React，应该怎么学？', priority: 9 },
  { project_type: 'general', task_stage: 'planning', tool_name: 'clarify_deliverables', hint_content: '当学生问"要交付什么"时明确交付物。关键词：交付什么、最终成果', example_prompt: '这个任务最终要交付什么？', priority: 9 },
  { project_type: 'general', task_stage: 'planning', tool_name: 'estimate_time', hint_content: '当学生问"需要多久"时估算时间。关键词：多久、时间、几天', example_prompt: '完成这个任务大概需要多长时间？', priority: 7 },
  { project_type: 'general', task_stage: 'planning', tool_name: 'identify_risks', hint_content: '当学生问"有什么风险"时识别风险。关键词：风险、问题、困难', example_prompt: '做这个任务可能遇到什么问题？', priority: 7 },
  { project_type: 'general', task_stage: 'understanding', tool_name: 'compare_similar_tasks', hint_content: '当学生说"之前做过类似的"时对比。关键词：类似、之前做过', example_prompt: '这个任务和我之前做的有什么不同？', priority: 6 },
  { project_type: 'general', task_stage: 'assessment', tool_name: 'check_prerequisites', hint_content: '当学生问"需要什么基础"时检查前置条件。关键词：需要什么基础', example_prompt: '做这个任务需要什么前置知识？', priority: 8 },

  // 技术指导类 (15条)
  { project_type: 'technical', task_stage: 'implementation', tool_name: 'debug_code_error', hint_content: '当学生遇到代码报错时帮助调试。关键词：报错、错误、error', example_prompt: '我的代码报错了，怎么解决？', priority: 10 },
  { project_type: 'technical', task_stage: 'review', tool_name: 'review_code_quality', hint_content: '当学生问"代码怎么样"时审查质量。关键词：代码怎么样、写得对吗', example_prompt: '帮我看看这段代码有什么问题', priority: 8 },
  { project_type: 'technical', task_stage: 'implementation', tool_name: 'suggest_best_practices', hint_content: '当学生问"怎么写更好"时推荐最佳实践。关键词：更好的写法、优化', example_prompt: '这段代码有更好的写法吗？', priority: 7 },
  { project_type: 'technical', task_stage: 'learning', tool_name: 'explain_algorithm', hint_content: '当学生问算法时解释原理。关键词：算法、原理、为什么', example_prompt: '这个排序算法的原理是什么？', priority: 8 },
  { project_type: 'technical', task_stage: 'planning', tool_name: 'recommend_libraries', hint_content: '当学生问"用什么库"时推荐工具。关键词：用什么库、什么工具', example_prompt: '做日期处理用什么库比较好？', priority: 7 },
  { project_type: 'technical', task_stage: 'design', tool_name: 'design_database_schema', hint_content: '当学生问数据库设计时帮助设计表结构。关键词：数据库、表结构', example_prompt: '这个功能的数据库应该怎么设计？', priority: 8 },
  { project_type: 'technical', task_stage: 'design', tool_name: 'design_api_interface', hint_content: '当学生问API设计时帮助设计接口。关键词：API、接口、路由', example_prompt: '这个功能的API应该怎么设计？', priority: 8 },
  { project_type: 'technical', task_stage: 'optimization', tool_name: 'optimize_performance', hint_content: '当学生说"太慢了"时优化性能。关键词：慢、性能、优化', example_prompt: '这段代码运行太慢了，怎么优化？', priority: 7 },
  { project_type: 'technical', task_stage: 'implementation', tool_name: 'handle_edge_cases', hint_content: '当学生问"边界情况"时分析边界。关键词：边界、特殊情况', example_prompt: '这个功能有哪些边界情况需要处理？', priority: 7 },
  { project_type: 'technical', task_stage: 'testing', tool_name: 'write_unit_tests', hint_content: '当学生问"怎么测试"时指导测试。关键词：测试、test', example_prompt: '这个函数应该怎么写单元测试？', priority: 6 },
  { project_type: 'technical', task_stage: 'refactoring', tool_name: 'refactor_code', hint_content: '当学生说"代码太乱"时指导重构。关键词：重构、太乱', example_prompt: '这段代码太乱了，怎么重构？', priority: 6 },
  { project_type: 'technical', task_stage: 'implementation', tool_name: 'handle_async_operations', hint_content: '当学生问异步操作时解释。关键词：异步、promise、async', example_prompt: 'Promise和async/await有什么区别？', priority: 8 },
  { project_type: 'technical', task_stage: 'implementation', tool_name: 'manage_state', hint_content: '当学生问状态管理时解释方案。关键词：状态管理、state', example_prompt: 'React的状态管理应该用什么方案？', priority: 7 },
  { project_type: 'technical', task_stage: 'implementation', tool_name: 'implement_authentication', hint_content: '当学生问登录认证时指导实现。关键词：登录、认证、auth', example_prompt: '用户登录认证应该怎么实现？', priority: 8 },
  { project_type: 'technical', task_stage: 'deployment', tool_name: 'deploy_application', hint_content: '当学生问部署时指导流程。关键词：部署、deploy', example_prompt: '项目应该怎么部署到服务器？', priority: 7 },

  // 沟通协作类 (10条)
  { project_type: 'general', task_stage: 'communication', tool_name: 'communicate_with_client', hint_content: '当学生问"怎么沟通"时指导技巧。关键词：怎么沟通、怎么说', example_prompt: '我应该怎么和企业沟通需求？', priority: 9 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'clarify_requirements', hint_content: '当学生说"需求不清楚"时帮助澄清。关键词：需求不清楚、不明确', example_prompt: '企业的需求我没理解清楚，怎么办？', priority: 9 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'report_progress', hint_content: '当学生问"怎么汇报"时指导汇报。关键词：汇报进度、进度报告', example_prompt: '我应该怎么向企业汇报进度？', priority: 8 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'handle_requirement_change', hint_content: '当学生说"需求变了"时处理变更。关键词：需求变了、改需求', example_prompt: '企业突然改需求了，我该怎么办？', priority: 9 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'negotiate_deadline', hint_content: '当学生说"时间不够"时协商截止日期。关键词：时间不够、来不及', example_prompt: '时间不够了，怎么和企业协商延期？', priority: 8 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'present_solution', hint_content: '当学生问"怎么展示"时指导展示。关键词：怎么展示、演示', example_prompt: '完成后应该怎么向企业展示成果？', priority: 7 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'handle_feedback', hint_content: '当学生收到反馈时指导处理。关键词：反馈、意见、不满意', example_prompt: '企业对我的工作不满意，怎么办？', priority: 8 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'document_decisions', hint_content: '当学生问"怎么记录"时指导文档。关键词：怎么记录、文档', example_prompt: '和企业的沟通应该怎么记录？', priority: 6 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'manage_expectations', hint_content: '当学生说"期望太高"时管理期望。关键词：期望太高、要求太多', example_prompt: '企业的期望太高了，怎么办？', priority: 8 },
  { project_type: 'general', task_stage: 'communication', tool_name: 'resolve_conflicts', hint_content: '当学生遇到冲突时帮助解决。关键词：冲突、矛盾、不同意', example_prompt: '我和企业产生了分歧，怎么解决？', priority: 9 },

  // 情绪支持类 (10条)
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'encourage_confidence', hint_content: '当学生说"我不行"时鼓励信心。关键词：不行、做不到、太难', example_prompt: '我觉得自己做不到，怎么办？', priority: 10 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'relieve_anxiety', hint_content: '当学生焦虑时缓解。关键词：焦虑、紧张、压力大', example_prompt: '我很焦虑，压力很大', priority: 9 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'celebrate_progress', hint_content: '当学生完成阶段性成果时庆祝。关键词：完成了、做好了', example_prompt: '我完成了第一个模块！', priority: 8 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'handle_frustration', hint_content: '当学生沮丧时处理挫折感。关键词：沮丧、失望、烦', example_prompt: '我很沮丧，感觉做不下去了', priority: 9 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'reframe_failure', hint_content: '当学生说"失败了"时重新框定。关键词：失败、错了、搞砸了', example_prompt: '我失败了，代码完全不work', priority: 9 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'maintain_motivation', hint_content: '当学生动力不足时维持动力。关键词：没动力、不想做', example_prompt: '我没动力了，不想继续做了', priority: 8 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'validate_emotions', hint_content: '当学生表达情绪时验证。关键词：感觉、觉得、情绪', example_prompt: '我感觉很迷茫', priority: 8 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'suggest_break', hint_content: '当学生过度疲劳时建议休息。关键词：累、疲劳、困', example_prompt: '我太累了，撑不住了', priority: 7 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'normalize_struggle', hint_content: '当学生觉得"只有我不会"时正常化困难。关键词：只有我、别人都会', example_prompt: '为什么只有我不会？', priority: 9 },
  { project_type: 'general', task_stage: 'emotional_support', tool_name: 'build_resilience', hint_content: '当学生遇到挫折时培养韧性。关键词：挫折、打击', example_prompt: '遇到这么大的挫折，我该怎么办？', priority: 8 },

  // 成长引导类 (10条)
  { project_type: 'general', task_stage: 'reflection', tool_name: 'reflect_on_learning', hint_content: '任务完成后引导反思。关键词：学到了、收获、总结', example_prompt: '完成这个任务我学到了什么？', priority: 8 },
  { project_type: 'general', task_stage: 'growth', tool_name: 'identify_growth_areas', hint_content: '当学生问"该提升什么"时识别成长领域。关键词：提升什么、学什么', example_prompt: '我接下来应该提升哪方面能力？', priority: 8 },
  { project_type: 'general', task_stage: 'growth', tool_name: 'set_learning_goals', hint_content: '当学生想设定目标时帮助设定。关键词：目标、goal、计划', example_prompt: '我应该设定什么学习目标？', priority: 7 },
  { project_type: 'general', task_stage: 'growth', tool_name: 'track_skill_progress', hint_content: '当学生问"进步了吗"时追踪进步。关键词：进步、提高、成长', example_prompt: '我的技能有进步吗？', priority: 7 },
  { project_type: 'general', task_stage: 'growth', tool_name: 'recommend_next_task', hint_content: '当学生问"下一个做什么"时推荐任务。关键词：下一个、接下来', example_prompt: '我下一个任务应该做什么？', priority: 7 },
  { project_type: 'general', task_stage: 'learning', tool_name: 'develop_metacognition', hint_content: '当学生问"怎么学得更快"时培养元认知。关键词：怎么学、学习方法', example_prompt: '怎样才能学得更快更好？', priority: 7 },
  { project_type: 'general', task_stage: 'growth', tool_name: 'build_portfolio', hint_content: '当学生问"怎么展示作品"时指导作品集。关键词：作品集、portfolio', example_prompt: '我应该怎么建立自己的作品集？', priority: 6 },
  { project_type: 'general', task_stage: 'growth', tool_name: 'connect_to_career', hint_content: '当学生问"对职业有什么帮助"时连接职业。关键词：职业、工作', example_prompt: '这个技能对我的职业发展有什么帮助？', priority: 7 },
  { project_type: 'general', task_stage: 'learning', tool_name: 'foster_curiosity', hint_content: '当学生问"为什么"时培养好奇心。关键词：为什么、原理', example_prompt: '为什么要这样设计？', priority: 6 },
  { project_type: 'general', task_stage: 'learning', tool_name: 'encourage_experimentation', hint_content: '当学生问"可以试试吗"时鼓励实验。关键词：试试、尝试', example_prompt: '我可以尝试用另一种方法吗？', priority: 7 },
];

async function init() {
  const client = await pool.connect();
  try {
    console.log('开始初始化工具提示数据...');
    
    const countResult = await client.query('SELECT COUNT(*) FROM mentor_tool_hints');
    console.log(`当前记录数: ${countResult.rows[0].count}`);
    
    let inserted = 0;
    for (const hint of toolHints) {
      try {
        await client.query(`
          INSERT INTO mentor_tool_hints (project_type, task_stage, tool_name, hint_content, example_prompt, priority, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `, [hint.project_type, hint.task_stage, hint.tool_name, hint.hint_content, hint.example_prompt, hint.priority]);
        inserted++;
      } catch (err) {
        console.error(`插入失败: ${hint.tool_name}`, err.message);
      }
    }
    
    console.log(`\n✅ 成功插入 ${inserted}/${toolHints.length} 条数据`);
    
    const finalCount = await client.query('SELECT COUNT(*) FROM mentor_tool_hints');
    console.log(`最终记录数: ${finalCount.rows[0].count}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch(console.error);
