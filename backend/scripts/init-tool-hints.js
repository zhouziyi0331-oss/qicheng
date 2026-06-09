/**
 * 初始化 mentor_tool_hints 数据
 * 为AI导师系统提供工具提示数据（≥50条）
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

const toolHints = [
  // 任务理解类工具提示 (10条)
  {
    project_type: 'general',
    task_stage: 'understanding',
    tool_name: 'analyze_task_requirements',
    hint_content: '当学生说"我不太理解这个任务"或"这个任务要做什么"时，使用此工具分析任务需求。关键词：不理解、不懂、看不懂、什么意思、要做什么',
    example_prompt: '帮我分析一下这个任务的具体需求是什么？',
    priority: 10
  },
  {
    tool_name: 'break_down_modules',
    hint_text: '当学生问"这个任务怎么拆分"或"从哪里开始"时，使用此工具拆解功能模块',
    trigger_keywords: ['怎么拆分', '从哪开始', '第一步', '怎么做'],
    context_type: 'task_planning',
    priority: 9
  },
  {
    tool_name: 'explain_technical_terms',
    hint_text: '当学生遇到专业术语（如"RESTful API"、"JWT"）时，使用此工具解释',
    trigger_keywords: ['是什么', '什么是', '不知道', '没听过'],
    context_type: 'knowledge_gap',
    priority: 8
  },
  {
    tool_name: 'estimate_difficulty',
    hint_text: '当学生问"这个任务难吗"或"我能做吗"时，使用此工具评估难度',
    trigger_keywords: ['难吗', '能做吗', '适合我吗', '我的水平'],
    context_type: 'self_assessment',
    priority: 8
  },
  {
    tool_name: 'suggest_learning_path',
    hint_text: '当学生说"我不会XX技术"时，使用此工具推荐学习路径',
    trigger_keywords: ['不会', '没学过', '怎么学', '学习资料'],
    context_type: 'skill_gap',
    priority: 9
  },
  {
    tool_name: 'clarify_deliverables',
    hint_text: '当学生问"要交付什么"或"最终成果是什么"时，使用此工具明确交付物',
    trigger_keywords: ['交付什么', '最终成果', '要提交什么', '验收标准'],
    context_type: 'deliverable_clarity',
    priority: 9
  },
  {
    tool_name: 'estimate_time',
    hint_text: '当学生问"需要多久"或"时间够吗"时，使用此工具估算时间',
    trigger_keywords: ['多久', '时间', '几天', '来得及吗'],
    context_type: 'time_management',
    priority: 7
  },
  {
    tool_name: 'identify_risks',
    hint_text: '当学生问"有什么风险"或"可能遇到什么问题"时，使用此工具识别风险',
    trigger_keywords: ['风险', '问题', '困难', '注意什么'],
    context_type: 'risk_awareness',
    priority: 7
  },
  {
    tool_name: 'compare_similar_tasks',
    hint_text: '当学生说"之前做过类似的"时，使用此工具对比相似任务',
    trigger_keywords: ['类似', '之前做过', '上次', '差不多'],
    context_type: 'experience_transfer',
    priority: 6
  },
  {
    tool_name: 'check_prerequisites',
    hint_text: '当学生问"需要什么基础"时，使用此工具检查前置条件',
    trigger_keywords: ['需要什么基础', '前置条件', '准备什么'],
    context_type: 'prerequisite_check',
    priority: 8
  },

  // 技术指导类工具提示 (15条)
  {
    tool_name: 'debug_code_error',
    hint_text: '当学生遇到代码报错时，使用此工具帮助调试',
    trigger_keywords: ['报错', '错误', 'error', '不work', '运行不了'],
    context_type: 'debugging',
    priority: 10
  },
  {
    tool_name: 'review_code_quality',
    hint_text: '当学生问"代码写得怎么样"时，使用此工具审查代码质量',
    trigger_keywords: ['代码怎么样', '写得对吗', '有问题吗', '帮我看看'],
    context_type: 'code_review',
    priority: 8
  },
  {
    tool_name: 'suggest_best_practices',
    hint_text: '当学生问"怎么写更好"时，使用此工具推荐最佳实践',
    trigger_keywords: ['更好的写法', '最佳实践', '优化', '改进'],
    context_type: 'code_improvement',
    priority: 7
  },
  {
    tool_name: 'explain_algorithm',
    hint_text: '当学生问算法相关问题时，使用此工具解释算法原理',
    trigger_keywords: ['算法', '原理', '为什么这样', '怎么实现'],
    context_type: 'algorithm_understanding',
    priority: 8
  },
  {
    tool_name: 'recommend_libraries',
    hint_text: '当学生问"用什么库"或"有什么工具"时，使用此工具推荐库和工具',
    trigger_keywords: ['用什么库', '什么工具', '推荐', '有没有现成的'],
    context_type: 'tool_selection',
    priority: 7
  },
  {
    tool_name: 'design_database_schema',
    hint_text: '当学生问数据库设计时，使用此工具帮助设计表结构',
    trigger_keywords: ['数据库', '表结构', '字段', 'schema'],
    context_type: 'database_design',
    priority: 8
  },
  {
    tool_name: 'design_api_interface',
    hint_text: '当学生问API设计时，使用此工具帮助设计接口',
    trigger_keywords: ['API', '接口', '路由', 'endpoint'],
    context_type: 'api_design',
    priority: 8
  },
  {
    tool_name: 'optimize_performance',
    hint_text: '当学生说"太慢了"或"性能不好"时，使用此工具优化性能',
    trigger_keywords: ['慢', '性能', '优化', '卡'],
    context_type: 'performance_optimization',
    priority: 7
  },
  {
    tool_name: 'handle_edge_cases',
    hint_text: '当学生问"边界情况怎么处理"时，使用此工具分析边界情况',
    trigger_keywords: ['边界', '特殊情况', '异常', '极端情况'],
    context_type: 'edge_case_handling',
    priority: 7
  },
  {
    tool_name: 'write_unit_tests',
    hint_text: '当学生问"怎么测试"时，使用此工具指导编写单元测试',
    trigger_keywords: ['测试', 'test', '怎么验证', '检查'],
    context_type: 'testing',
    priority: 6
  },
  {
    tool_name: 'refactor_code',
    hint_text: '当学生说"代码太乱了"时，使用此工具指导重构',
    trigger_keywords: ['重构', '太乱', '整理', '优化结构'],
    context_type: 'code_refactoring',
    priority: 6
  },
  {
    tool_name: 'handle_async_operations',
    hint_text: '当学生问异步操作时，使用此工具解释Promise、async/await',
    trigger_keywords: ['异步', 'promise', 'async', 'await', '回调'],
    context_type: 'async_programming',
    priority: 8
  },
  {
    tool_name: 'manage_state',
    hint_text: '当学生问状态管理时，使用此工具解释状态管理方案',
    trigger_keywords: ['状态管理', 'state', 'redux', 'context'],
    context_type: 'state_management',
    priority: 7
  },
  {
    tool_name: 'implement_authentication',
    hint_text: '当学生问登录认证时，使用此工具指导实现认证',
    trigger_keywords: ['登录', '认证', 'auth', 'token', 'session'],
    context_type: 'authentication',
    priority: 8
  },
  {
    tool_name: 'deploy_application',
    hint_text: '当学生问部署时，使用此工具指导部署流程',
    trigger_keywords: ['部署', 'deploy', '上线', '发布'],
    context_type: 'deployment',
    priority: 7
  },

  // 沟通协作类工具提示 (10条)
  {
    tool_name: 'communicate_with_client',
    hint_text: '当学生问"怎么和企业沟通"时，使用此工具指导沟通技巧',
    trigger_keywords: ['怎么沟通', '怎么说', '怎么问', '沟通技巧'],
    context_type: 'client_communication',
    priority: 9
  },
  {
    tool_name: 'clarify_requirements',
    hint_text: '当学生说"需求不清楚"时，使用此工具帮助澄清需求',
    trigger_keywords: ['需求不清楚', '不明确', '没说清楚', '理解不一致'],
    context_type: 'requirement_clarification',
    priority: 9
  },
  {
    tool_name: 'report_progress',
    hint_text: '当学生问"怎么汇报进度"时，使用此工具指导进度汇报',
    trigger_keywords: ['汇报进度', '进度报告', '怎么更新', '告诉企业'],
    context_type: 'progress_reporting',
    priority: 8
  },
  {
    tool_name: 'handle_requirement_change',
    hint_text: '当学生说"需求变了"时，使用此工具处理需求变更',
    trigger_keywords: ['需求变了', '改需求', '又要加', '不一样了'],
    context_type: 'requirement_change',
    priority: 9
  },
  {
    tool_name: 'negotiate_deadline',
    hint_text: '当学生说"时间不够"时，使用此工具指导协商截止日期',
    trigger_keywords: ['时间不够', '来不及', '延期', '推迟'],
    context_type: 'deadline_negotiation',
    priority: 8
  },
  {
    tool_name: 'present_solution',
    hint_text: '当学生问"怎么展示方案"时，使用此工具指导方案展示',
    trigger_keywords: ['怎么展示', '演示', 'demo', '汇报方案'],
    context_type: 'solution_presentation',
    priority: 7
  },
  {
    tool_name: 'handle_feedback',
    hint_text: '当学生收到反馈时，使用此工具指导如何处理反馈',
    trigger_keywords: ['反馈', '意见', '不满意', '要修改'],
    context_type: 'feedback_handling',
    priority: 8
  },
  {
    tool_name: 'document_decisions',
    hint_text: '当学生问"怎么记录"时，使用此工具指导文档记录',
    trigger_keywords: ['怎么记录', '文档', '写下来', '备忘'],
    context_type: 'documentation',
    priority: 6
  },
  {
    tool_name: 'manage_expectations',
    hint_text: '当学生说"企业期望太高"时，使用此工具管理期望',
    trigger_keywords: ['期望太高', '要求太多', '做不到', '不现实'],
    context_type: 'expectation_management',
    priority: 8
  },
  {
    tool_name: 'resolve_conflicts',
    hint_text: '当学生遇到冲突时，使用此工具帮助解决冲突',
    trigger_keywords: ['冲突', '矛盾', '不同意', '争执'],
    context_type: 'conflict_resolution',
    priority: 9
  },

  // 情绪支持类工具提示 (10条)
  {
    tool_name: 'encourage_confidence',
    hint_text: '当学生说"我不行"或"做不到"时，使用此工具鼓励信心',
    trigger_keywords: ['不行', '做不到', '太难了', '放弃'],
    context_type: 'confidence_building',
    priority: 10
  },
  {
    tool_name: 'relieve_anxiety',
    hint_text: '当学生表现焦虑时，使用此工具缓解焦虑',
    trigger_keywords: ['焦虑', '紧张', '压力大', '担心'],
    context_type: 'anxiety_relief',
    priority: 9
  },
  {
    tool_name: 'celebrate_progress',
    hint_text: '当学生完成阶段性成果时，使用此工具庆祝进步',
    trigger_keywords: ['完成了', '做好了', '成功了', '搞定了'],
    context_type: 'progress_celebration',
    priority: 8
  },
  {
    tool_name: 'handle_frustration',
    hint_text: '当学生表现沮丧时，使用此工具处理挫折感',
    trigger_keywords: ['沮丧', '失望', '烦', '郁闷'],
    context_type: 'frustration_handling',
    priority: 9
  },
  {
    tool_name: 'reframe_failure',
    hint_text: '当学生说"失败了"时，使用此工具重新框定失败',
    trigger_keywords: ['失败', '错了', '不对', '搞砸了'],
    context_type: 'failure_reframing',
    priority: 9
  },
  {
    tool_name: 'maintain_motivation',
    hint_text: '当学生动力不足时，使用此工具维持动力',
    trigger_keywords: ['没动力', '不想做', '累了', '疲惫'],
    context_type: 'motivation_maintenance',
    priority: 8
  },
  {
    tool_name: 'validate_emotions',
    hint_text: '当学生表达情绪时，使用此工具验证情绪',
    trigger_keywords: ['感觉', '觉得', '情绪', '心情'],
    context_type: 'emotion_validation',
    priority: 8
  },
  {
    tool_name: 'suggest_break',
    hint_text: '当学生过度疲劳时，使用此工具建议休息',
    trigger_keywords: ['累', '疲劳', '困', '撑不住'],
    context_type: 'break_suggestion',
    priority: 7
  },
  {
    tool_name: 'normalize_struggle',
    hint_text: '当学生觉得"只有我不会"时，使用此工具正常化困难',
    trigger_keywords: ['只有我', '别人都会', '我太笨', '我不适合'],
    context_type: 'struggle_normalization',
    priority: 9
  },
  {
    tool_name: 'build_resilience',
    hint_text: '当学生遇到挫折时，使用此工具培养韧性',
    trigger_keywords: ['挫折', '打击', '受伤', '难过'],
    context_type: 'resilience_building',
    priority: 8
  },

  // 成长引导类工具提示 (10条)
  {
    tool_name: 'reflect_on_learning',
    hint_text: '当任务完成后，使用此工具引导学习反思',
    trigger_keywords: ['学到了', '收获', '总结', '反思'],
    context_type: 'learning_reflection',
    priority: 8
  },
  {
    tool_name: 'identify_growth_areas',
    hint_text: '当学生问"我该提升什么"时，使用此工具识别成长领域',
    trigger_keywords: ['提升什么', '学什么', '成长方向', '下一步'],
    context_type: 'growth_identification',
    priority: 8
  },
  {
    tool_name: 'set_learning_goals',
    hint_text: '当学生想设定目标时，使用此工具帮助设定学习目标',
    trigger_keywords: ['目标', 'goal', '计划', '想学'],
    context_type: 'goal_setting',
    priority: 7
  },
  {
    tool_name: 'track_skill_progress',
    hint_text: '当学生问"我进步了吗"时，使用此工具追踪技能进步',
    trigger_keywords: ['进步', '提高', '成长', '变化'],
    context_type: 'progress_tracking',
    priority: 7
  },
  {
    tool_name: 'recommend_next_task',
    hint_text: '当学生问"下一个任务做什么"时，使用此工具推荐下一个任务',
    trigger_keywords: ['下一个', '接下来', '还有什么', '继续'],
    context_type: 'task_recommendation',
    priority: 7
  },
  {
    tool_name: 'develop_metacognition',
    hint_text: '当学生问"怎么学得更快"时，使用此工具培养元认知',
    trigger_keywords: ['怎么学', '学习方法', '效率', '更快'],
    context_type: 'metacognition_development',
    priority: 7
  },
  {
    tool_name: 'build_portfolio',
    hint_text: '当学生问"怎么展示作品"时，使用此工具指导作品集建设',
    trigger_keywords: ['作品集', 'portfolio', '展示', '简历'],
    context_type: 'portfolio_building',
    priority: 6
  },
  {
    tool_name: 'connect_to_career',
    hint_text: '当学生问"这对职业有什么帮助"时，使用此工具连接职业发展',
    trigger_keywords: ['职业', '工作', '就业', '有什么用'],
    context_type: 'career_connection',
    priority: 7
  },
  {
    tool_name: 'foster_curiosity',
    hint_text: '当学生问"为什么"时，使用此工具培养好奇心',
    trigger_keywords: ['为什么', '原理', '深入', '探索'],
    context_type: 'curiosity_fostering',
    priority: 6
  },
  {
    tool_name: 'encourage_experimentation',
    hint_text: '当学生问"可以试试吗"时，使用此工具鼓励实验',
    trigger_keywords: ['试试', '尝试', '实验', '探索'],
    context_type: 'experimentation_encouragement',
    priority: 7
  },
];

async function initToolHints() {
  const client = await pool.connect();

  try {
    console.log('开始初始化 mentor_tool_hints 数据...');

    // 检查表是否存在
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'mentor_tool_hints'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ 表 mentor_tool_hints 不存在，请先运行数据库迁移');
      process.exit(1);
    }

    // 检查是否已有数据
    const countResult = await client.query('SELECT COUNT(*) FROM mentor_tool_hints');
    const existingCount = parseInt(countResult.rows[0].count);

    if (existingCount > 0) {
      console.log(`⚠️  表中已有 ${existingCount} 条数据`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('是否清空并重新插入？(y/n): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 'y') {
        await client.query('DELETE FROM mentor_tool_hints');
        console.log('✅ 已清空现有数据');
      } else {
        console.log('❌ 取消操作');
        process.exit(0);
      }
    }

    // 插入数据
    console.log(`开始插入 ${toolHints.length} 条工具提示数据...`);

    let successCount = 0;
    for (const hint of toolHints) {
      try {
        await client.query(`
          INSERT INTO mentor_tool_hints (
            tool_name, hint_text, trigger_keywords, context_type, priority
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          hint.tool_name,
          hint.hint_text,
          hint.trigger_keywords,
          hint.context_type,
          hint.priority
        ]);
        successCount++;
      } catch (err) {
        console.error(`❌ 插入失败: ${hint.tool_name}`, err.message);
      }
    }

    console.log(`\n✅ 成功插入 ${successCount}/${toolHints.length} 条数据`);

    // 验证
    const finalCount = await client.query('SELECT COUNT(*) FROM mentor_tool_hints');
    console.log(`\n📊 最终数据统计:`);
    console.log(`   总记录数: ${finalCount.rows[0].count}`);

    const byContext = await client.query(`
      SELECT context_type, COUNT(*) as count
      FROM mentor_tool_hints
      GROUP BY context_type
      ORDER BY count DESC
    `);

    console.log(`\n   按上下文类型分布:`);
    byContext.rows.forEach(row => {
      console.log(`   - ${row.context_type}: ${row.count}`);
    });

    console.log('\n🎉 初始化完成！');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行
initToolHints().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
