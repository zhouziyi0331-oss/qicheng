import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface UserData {
  opcLabel: string;
  sixDimScores: Record<string, number>;
  taskCount: number;
  totalEarnings: number;
  tasks: Array<{
    title: string;
    description: string;
    completedAt: string;
    companyScore: number;
    aiFeedback: string;
  }>;
  highlights: Array<{
    title: string;
    description: string;
  }>;
}

interface CustomizedAnalysis {
  strengthAnalysis: string;
  futurePossibilities: Array<{
    title: string;
    description: string;
    marketSize: string;
    difficulty: string;
    actionPlan: string; // 新增：具体行动计划
  }>;
  painPointAnalysis: string;
  targetMarket: string;
  acquisitionStrategy: string;
  productServiceIdeas: Array<{
    title: string;
    description: string;
    mvp: string;
    timeline: string; // 新增：时间线
    budget: string; // 新增：预算估算
  }>;
  firstSteps: string[];
  diyPath: {
    // 新增：自己跑通的路径
    title: string;
    steps: Array<{
      step: string;
      description: string;
      resources: string[];
      estimatedTime: string;
    }>;
    totalCost: string;
    difficulty: string;
  };
  agencyPath: {
    // 新增：代办路径
    title: string;
    services: Array<{
      service: string;
      description: string;
      estimatedCost: string;
      providers: string[];
    }>;
    totalCost: string;
    advantages: string[];
  };
}

interface StartupGuide {
  title: string;
  content: string;
}

interface StartupReportContent {
  customizedAnalysis: CustomizedAnalysis;
  startupGuides: StartupGuide[];
  generatedAt: string;
  version: string;
}

/**
 * 创业报告服务
 */
export class StartupReportService {
  /**
   * 生成完整的创业综合报告
   */
  static async generateStartupReport(userId: string, reportId: string): Promise<StartupReportContent> {
    try {
      logger.info('开始生成创业报告', { userId, reportId });

      // 1. 收集用户数据
      const userData = await this.collectUserData(userId);

      // 2. 生成定制化分析（调用 Claude API）
      const customizedAnalysis = await this.generateCustomizedAnalysis(userData);

      // 3. 获取通用创业指南
      const startupGuides = await this.getStartupGuides();

      // 4. 组合完整报告
      const report: StartupReportContent = {
        customizedAnalysis,
        startupGuides,
        generatedAt: new Date().toISOString(),
        version: '1.0',
      };

      logger.info('创业报告生成成功', { userId, reportId });
      return report;
    } catch (error) {
      logger.error('创业报告生成失败', { userId, reportId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 收集用户数据
   */
  private static async collectUserData(userId: string): Promise<UserData> {
    // 获取学生档案
    const profile = await queryOne<{
      opc_label: string;
      six_dim_scores: Record<string, number>;
      task_count: number;
      total_earnings: number;
    }>(
      `SELECT opc_label, six_dim_scores, task_count, total_earnings
       FROM student_capabilities
       WHERE user_id = $1`,
      [userId]
    );

    if (!profile) {
      throw new Error('用户档案不存在');
    }

    // 获取任务历史（最近10个已完成任务）
    const tasks = await query<{
      title: string;
      description: string;
      approved_at: Date;
      company_score: number;
      ai_feedback: string;
    }>(
      `SELECT t.title, t.description, ts.approved_at, ts.company_score, ts.ai_feedback
       FROM task_submissions ts
       JOIN tasks t ON t.id = ts.task_id
       WHERE ts.student_id = $1 AND ts.status = 'approved'
       ORDER BY ts.approved_at DESC
       LIMIT 10`,
      [userId]
    );

    // 获取成长亮点
    const highlights = await query<{
      event_title: string;
      event_desc: string;
    }>(
      `SELECT event_title, event_desc
       FROM growth_timeline
       WHERE user_id = $1 AND is_milestone = TRUE
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    return {
      opcLabel: profile.opc_label || '未知',
      sixDimScores: profile.six_dim_scores || {},
      taskCount: profile.task_count || 0,
      totalEarnings: profile.total_earnings || 0,
      tasks: tasks.map(t => ({
        title: t.title,
        description: t.description,
        completedAt: t.approved_at.toISOString(),
        companyScore: t.company_score || 0,
        aiFeedback: t.ai_feedback || '',
      })),
      highlights: highlights.map(h => ({
        title: h.event_title,
        description: h.event_desc || '',
      })),
    };
  }

  /**
   * 使用 Claude API 生成定制化分析
   */
  private static async generateCustomizedAnalysis(userData: UserData): Promise<CustomizedAnalysis> {
    const prompt = this.buildPrompt(userData);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 8192,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

      // 提取 JSON（可能被包裹在 markdown 代码块中）
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

      const analysis = JSON.parse(jsonText);

      return analysis;
    } catch (error) {
      logger.error('Claude API 调用失败', { error: (error as Error).message });

      // 降级方案：使用规则引擎生成基础分析
      return this.generateFallbackAnalysis(userData);
    }
  }

  /**
   * 构建 Claude API 的 prompt
   */
  private static buildPrompt(userData: UserData): string {
    const tasksDescription = userData.tasks.length > 0
      ? userData.tasks.map(t => `
- 【${t.title}】
  - 任务描述：${t.description}
  - 完成时间：${t.completedAt}
  - 企业评分：${t.companyScore}/100
  - AI 评价：${t.aiFeedback || '无'}
`).join('\n')
      : '暂无任务历史';

    const highlightsDescription = userData.highlights.length > 0
      ? userData.highlights.map(h => `- ${h.title}: ${h.description}`).join('\n')
      : '暂无成长亮点';

    return `你是一位资深创业导师，请基于以下学生的真实数据，生成一份深度的、可实操的创业方向分析报告。

## 学生档案
- OPC 人格标签：${userData.opcLabel}
- 能力维度：${JSON.stringify(userData.sixDimScores)}
- 完成任务数：${userData.taskCount}
- 总收入：¥${userData.totalEarnings}

## 任务历史
${tasksDescription}

## 成长亮点
${highlightsDescription}

---

请生成以下内容（使用 JSON 格式）。**重要：这份报告要让学生看完后，即使不找代办，自己也能跑通整个创业流程。**

\`\`\`json
{
  "strengthAnalysis": "深度分析学生擅长的领域和核心技能，结合具体任务案例（300-400字）",
  "futurePossibilities": [
    {
      "title": "创业方向1",
      "description": "详细描述，包含市场机会、竞争分析、盈利模式（250-300字）",
      "marketSize": "市场规模评估（具体数据）",
      "difficulty": "难度评级（低/中/高）",
      "actionPlan": "3-6个月的具体行动计划，包含里程碑（200字）"
    },
    {
      "title": "创业方向2",
      "description": "详细描述（250-300字）",
      "marketSize": "市场规模评估",
      "difficulty": "难度评级",
      "actionPlan": "具体行动计划（200字）"
    },
    {
      "title": "创业方向3",
      "description": "详细描述（250-300字）",
      "marketSize": "市场规模评估",
      "difficulty": "难度评级",
      "actionPlan": "具体行动计划（200字）"
    }
  ],
  "painPointAnalysis": "基于任务经历，识别学生可能解决的需求痛点，给出具体案例（300-400字）",
  "targetMarket": "目标客户市场分析，包含用户画像、需求场景、支付意愿（300-400字）",
  "acquisitionStrategy": "客户获取策略建议，包含具体渠道、内容策略、转化路径（300-400字）",
  "productServiceIdeas": [
    {
      "title": "产品/服务方案1",
      "description": "详细描述，包含核心功能、差异化优势（250-300字）",
      "mvp": "最小可行产品建议，具体到功能清单",
      "timeline": "开发时间线（如：2-3个月）",
      "budget": "启动预算估算（如：5000-10000元）"
    },
    {
      "title": "产品/服务方案2",
      "description": "详细描述（250-300字）",
      "mvp": "最小可行产品建议",
      "timeline": "开发时间线",
      "budget": "启动预算估算"
    },
    {
      "title": "产品/服务方案3",
      "description": "详细描述（250-300字）",
      "mvp": "最小可行产品建议",
      "timeline": "开发时间线",
      "budget": "启动预算估算"
    }
  ],
  "firstSteps": [
    "第一步行动建议，具体到可执行的任务（100字）",
    "第二步行动建议（100字）",
    "第三步行动建议（100字）",
    "第四步行动建议（100字）",
    "第五步行动建议（100字）"
  ],
  "diyPath": {
    "title": "自己跑通路径（适合预算有限、时间充裕的学生）",
    "steps": [
      {
        "step": "第1步：公司注册",
        "description": "详细说明如何在线上自助注册公司，包含具体网站、流程、注意事项（200字）",
        "resources": ["国家企业信用信息公示系统网址", "电子营业执照小程序", "具体教程链接"],
        "estimatedTime": "3-5个工作日"
      },
      {
        "step": "第2步：注册地址选择",
        "description": "如何选择注册地址，虚拟地址 vs 实体地址的利弊，具体操作（200字）",
        "resources": ["虚拟地址服务商推荐", "各地政策对比", "注意事项"],
        "estimatedTime": "1-2天"
      },
      {
        "step": "第3步：税务登记",
        "description": "如何办理税务登记，选择税种，申请发票，具体流程（200字）",
        "resources": ["电子税务局网址", "税务登记指南", "常见问题"],
        "estimatedTime": "1-2个工作日"
      },
      {
        "step": "第4步：银行开户",
        "description": "如何选择银行，开设对公账户，需要准备的材料（200字）",
        "resources": ["各银行费用对比", "开户流程", "所需材料清单"],
        "estimatedTime": "3-7个工作日"
      },
      {
        "step": "第5步：财务合规",
        "description": "如何自己做账报税，使用什么工具，基本的财务知识（200字）",
        "resources": ["记账软件推荐", "报税流程", "财务基础教程"],
        "estimatedTime": "持续进行"
      },
      {
        "step": "第6步：OPC注意事项",
        "description": "一人有限公司的特殊要求，如何避免个人财产与公司财产混同（200字）",
        "resources": ["OPC法律指南", "财产分离建议", "风险提示"],
        "estimatedTime": "持续注意"
      }
    ],
    "totalCost": "2000-5000元（包含注册费、地址费、刻章费等）",
    "difficulty": "中等，需要投入时间学习，但完全可以自己完成"
  },
  "agencyPath": {
    "title": "代办路径（适合时间紧张、希望快速启动的学生）",
    "services": [
      {
        "service": "全套公司注册代办",
        "description": "包含公司核名、营业执照办理、公章刻制、税务登记、银行开户全流程（150字）",
        "estimatedCost": "1500-3000元",
        "providers": ["猪八戒网", "阿里云创业服务", "本地工商代理"]
      },
      {
        "service": "虚拟注册地址",
        "description": "提供合规的虚拟注册地址，包含地址维护、信件代收（100字）",
        "estimatedCost": "1000-2000元/年",
        "providers": ["创客空间", "孵化器", "专业地址服务商"]
      },
      {
        "service": "代理记账报税",
        "description": "专业会计师代理记账、报税、年报，确保财务合规（100字）",
        "estimatedCost": "200-500元/月",
        "providers": ["本地会计事务所", "在线代账平台", "财税服务公司"]
      },
      {
        "service": "法律咨询",
        "description": "创业法律咨询、合同审核、股权设计等（100字）",
        "estimatedCost": "500-2000元/次",
        "providers":["律师事务所", "在线法律平台", "创业服务机构"]
      }
    ],
    "totalCost": "首年约5000-10000元，后续每年3000-6000元",
    "advantages": [
      "节省大量时间和精力，可以专注于业务发展",
      "专业服务降低出错风险，避免后续麻烦",
      "快速启动，通常1-2周内完成所有手续",
      "获得专业建议，避免常见陷阱"
    ]
  }
}
\`\`\`

要求：
1. **必须基于真实数据**，不要泛泛而谈
2. **具体到可执行**，每一步都要有明确的操作指南
3. **DIY路径要足够详细**，让学生看完真的能自己跑通
4. **提供真实的资源链接和服务商名称**（如果不确定具体名称，给出类型即可）
5. **语气专业但易懂**，避免过多专业术语
6. **突出学生的独特优势**，让分析个性化
7. **创业方向要有创新性和可行性**
8. **返回纯 JSON 格式**，不要额外的解释文字`;
  }

  /**
   * 降级方案：基于规则的分析
   */
  private static generateFallbackAnalysis(userData: UserData): CustomizedAnalysis {
    return {
      strengthAnalysis: `基于你完成的 ${userData.taskCount} 个任务和 ¥${userData.totalEarnings} 的收入，你展现出了良好的执行力和学习能力。你的 OPC 标签是「${userData.opcLabel}」，这表明你在创新和实践方面有独特的优势。从你的任务历史来看，你具备将想法转化为实际成果的能力，这是创业者最重要的素质之一。`,
      futurePossibilities: [
        {
          title: '自由职业服务',
          description: '基于你已有的技能和经验，可以提供专业服务，如设计、开发、咨询等。这是最快速启动的方向，风险低，可以边做边学。你可以先在启程平台上接单，积累客户和口碑，然后逐步建立自己的品牌。初期可以专注于1-2个核心服务，确保质量，再逐步扩展。',
          marketSize: '中国自由职业市场规模超过1000亿元，且每年增长20%以上',
          difficulty: '低',
          actionPlan: '第1个月：在3个平台注册并完善个人资料；第2个月：接5-10个小单积累评价；第3个月：提高单价，建立个人网站；第4-6个月：发展长期客户，月收入目标5000-10000元。',
        },
        {
          title: '内容创作与知识付费',
          description: '利用你的专业知识，通过自媒体、在线课程、电子书等形式进行内容变现。适合长期积累个人品牌。你可以选择小红书、B站、公众号等平台，分享你在启程平台上的实战经验，吸引同样想要成长的学生群体。内容创作需要持续投入，但一旦建立起来，可以形成被动收入。',
          marketSize: '知识付费市场规模约500亿元，年轻用户付费意愿强',
          difficulty: '中',
          actionPlan: '第1-2个月：选定平台和内容方向，发布20-30条内容测试反馈；第3-4个月：推出第一个付费产品（如9.9元的电子书或99元的小课）；第5-6个月：优化产品，目标100个付费用户。',
        },
        {
          title: '小型SaaS工具',
          description: '开发解决特定问题的在线工具或应用，通过订阅或一次性付费变现。需要一定的技术能力或找到技术合伙人。可以从你在任务中遇到的痛点出发，开发简单但实用的工具。例如：项目管理工具、设计素材库、数据分析工具等。',
          marketSize: '垂直SaaS市场潜力大，单个工具年收入可达10-100万',
          difficulty: '高',
          actionPlan: '第1-2个月：用户调研，验证需求，设计MVP；第3-4个月：开发核心功能，内测；第5-6个月：公开发布，获取前100个用户，收集反馈迭代。',
        },
      ],
      painPointAnalysis: '从你的任务经历来看，你对用户需求有较好的理解能力。建议关注你在任务中遇到的重复性问题，这些往往是潜在的创业机会。例如：如果你发现很多企业都需要类似的服务，但市场上没有标准化的解决方案，这就是一个机会。或者，如果你在完成任务时发现某些工具不好用，你可以开发更好的替代品。',
      targetMarket: '建议从你最熟悉的领域开始，如你曾服务过的客户类型。初期聚焦小众市场，建立口碑后再扩展。你的目标客户可能是：1）和你一样的大学生或年轻人；2）你曾服务过的中小企业；3）某个垂直行业的从业者。先服务好100个核心用户，再考虑规模化。',
      acquisitionStrategy: '利用社交媒体和专业社区建立个人品牌，通过内容营销吸引潜在客户。具体策略：1）每周发布2-3条高质量内容，展示你的专业能力；2）加入相关社群，提供价值，建立信任；3）通过启程平台积累初始客户和案例；4）鼓励满意客户推荐，设置推荐奖励；5）SEO优化，让潜在客户能搜索到你。',
      productServiceIdeas: [
        {
          title: '标准化服务包',
          description: '将你的技能打包成标准化服务，如「7天快速交付」、「一站式解决方案」等，降低客户决策成本。明确服务范围、交付标准、价格，让客户一目了然。可以设计3个套餐：基础版、标准版、高级版，满足不同预算的客户。',
          mvp: '先提供1个核心服务包，服务10个客户，收集反馈后优化',
          timeline: '1-2个月',
          budget: '0-2000元（主要是营销和工具成本）',
        },
        {
          title: '在线课程',
          description: '将你的经验总结成系统化课程，通过视频、文档等形式传授给他人。可以选择知识星球、小鹅通等平台。课程内容可以是：如何在启程平台接单、如何提升某项技能、如何管理项目等。',
          mvp: '先录制3-5节免费课程（每节10-15分钟），测试用户反馈，再推出完整付费课程',
          timeline: '2-3个月',
          budget: '1000-3000元（录制设备、平台费用）',
        },
        {
          title: '咨询服务',
          description: '为有类似需求的人提供一对一咨询，帮助他们解决问题。可以按小时收费（如200-500元/小时）或按项目收费。咨询内容可以是：职业规划、技能提升、项目指导等。',
          mvp: '提供3-5次免费咨询，积累案例和口碑，然后开始收费',
          timeline: '1个月',
          budget: '0-1000元（主要是预约系统和营销成本）',
        },
      ],
      firstSteps: [
        '第1步：明确你的核心技能和优势，列出3-5个你最擅长的领域。可以问问朋友和客户，他们觉得你哪方面最强。写下来，这是你的核心竞争力。',
        '第2步：研究目标市场，找到至少10个潜在客户或竞争对手。看看他们在做什么，收费多少，客户评价如何。找到你可以做得更好的地方。',
        '第3步：设计最小可行产品（MVP），用最低成本验证想法。不要追求完美，先做出来，让真实用户使用，收集反馈。',
        '第4步：建立个人品牌，开始在社交媒体上分享你的专业内容。每周至少发布2-3条内容，坚持3个月，你会看到效果。',
        '第5步：设定3个月目标，如获得第一个付费客户、完成第一个项目、赚到第一笔1000元收入等。把大目标拆解成每周的小任务，逐步推进。',
      ],
      diyPath: {
        title: '自己跑通路径（适合预算有限、时间充裕的学生）',
        steps: [
          {
            step: '第1步：公司注册',
            description: '访问国家企业信用信息公示系统或当地政务服务网，在线提交公司注册申请。需要准备：公司名称（准备3-5个备选）、注册资本（建议10-50万，认缴制无需实际出资）、经营范围、注册地址。整个流程可以在线完成，无需跑腿。',
            resources: [
              '国家企业信用信息公示系统：http://www.gsxt.gov.cn',
              '电子营业执照小程序（微信搜索）',
              'B站搜索「公司注册教程」有详细视频指导',
            ],
            estimatedTime: '3-5个工作日',
          },
          {
            step: '第2步：注册地址选择',
            description: '如果没有实体办公室，可以使用虚拟注册地址。虚拟地址是合法的，很多创业者都在用。可以在淘宝、闲鱼搜索「虚拟注册地址」，价格1000-2000元/年。选择时注意：1）确认地址可以用于工商注册；2）包含信件代收服务；3）选择税收优惠地区（如上海、深圳的某些园区）。',
            resources: [
              '淘宝/闲鱼搜索「虚拟注册地址」',
              '本地创业孵化器（通常提供免费或低价地址）',
              '各地税收优惠政策对比（百度搜索）',
            ],
            estimatedTime: '1-2天',
          },
          {
            step: '第3步：税务登记',
            description: '拿到营业执照后，登录电子税务局（国家税务总局官网），完成税务登记。选择小规模纳税人（年销售额500万以下），税率3%（疫情期间可能有优惠）。申请发票，可以选择电子发票，更方便。',
            resources: [
              '国家税务总局电子税务局：https://etax.chinatax.gov.cn',
              '税务登记指南（税务局官网有详细文档）',
              '小规模纳税人 vs 一般纳税人对比（知乎有很多讨论）',
            ],
            estimatedTime: '1-2个工作日',
          },
          {
            step: '第4步：银行开户',
            description: '选择一家银行开设对公账户。建议选择四大行（工农中建）或招商银行，网点多，服务好。需要带上营业执照、公章、法人身份证。部分银行支持线上预约，可以节省时间。年费一般200-500元，部分银行对初创企业有优惠。',
            resources: [
              '各银行对公账户费用对比（可以打电话咨询）',
              '开户所需材料清单（银行官网）',
              '线上预约开户（部分银行支持）',
            ],
            estimatedTime: '3-7个工作日',
          },
          {
            step: '第5步：财务合规',
            description: '每月需要记账报税，即使没有收入也要零申报。可以使用免费或低价的记账软件，如「账有书」「慧算账」等。学习基本的财务知识：收入、成本、费用、利润。每月15日前完成上月报税。如果业务简单，完全可以自己做。',
            resources: [
              '记账软件：账有书、慧算账、柠檬云（有免费版）',
              '报税流程：电子税务局有详细指引',
              '财务基础教程：B站搜索「小企业会计」',
            ],
            estimatedTime: '每月2-3小时',
          },
          {
            step: '第6步：OPC注意事项',
            description: '一人有限公司（OPC）的最大风险是个人财产与公司财产混同。务必做到：1）公司账户和个人账户严格分开；2）所有业务往来走公司账户；3）不要用公司账户支付个人消费；4）保留所有财务凭证。如果做不到财产分离，可能会被要求承担无限责任。',
            resources: [
              'OPC法律风险指南（知乎、律师事务所文章）',
              '财产分离最佳实践（创业论坛）',
              '案例分析：哪些行为会导致财产混同（法律网站）',
            ],
            estimatedTime: '持续注意',
          },
        ],
        totalCost: '2000-5000元（注册费500-1000元 + 虚拟地址1000-2000元/年 + 刻章200-500元 + 银行开户0-500元 + 其他杂费）',
        difficulty: '中等。需要投入时间学习，但网上教程很多，完全可以自己完成。建议边做边学，遇到问题就搜索或问AI。',
      },
      agencyPath: {
        title: '代办路径（适合时间紧张、希望快速启动的学生）',
        services: [
          {
            service: '全套公司注册代办',
            description: '包含公司核名、营业执照办理、公章刻制、税务登记、银行开户全流程。你只需要提供身份证和签字，其他都由代办公司搞定。通常1-2周完成，省心省力。',
            estimatedCost: '1500-3000元',
            providers: ['猪八戒网', '阿里云创业服务', '本地工商代理（搜索「XX市公司注册代办」）'],
          },
          {
            service: '虚拟注册地址',
            description: '提供合规的虚拟注册地址，包含地址维护、信件代收。部分服务商还提供税收优惠园区地址，可以享受返税政策。',
            estimatedCost: '1000-2000元/年',
            providers: ['创客空间', '孵化器', '专业地址服务商（淘宝搜索）'],
          },
          {
            service: '代理记账报税',
            description: '专业会计师代理记账、报税、年报，确保财务合规。每月你只需要把发票和收据发给他们，其他都不用管。适合不想学财务知识的创业者。',
            estimatedCost: '200-500元/月（小规模纳税人）',
            providers: ['本地会计事务所', '在线代账平台（如慧算账、账有书）', '财税服务公司'],
          },
          {
            service: '法律咨询',
            description: '创业过程中可能遇到合同纠纷、股权设计、知识产权等法律问题。找专业律师咨询，可以避免很多坑。',
            estimatedCost: '500-2000元/次（按问题收费）',
            providers: ['律师事务所', '在线法律平台（如法律快车、华律网）', '创业服务机构'],
          },
        ],
        totalCost: '首年约5000-10000元（注册3000 + 地址1500 + 记账3000 + 其他），后续每年3000-6000元（主要是地址和记账费用）',
        advantages: [
          '节省大量时间和精力，可以专注于业务发展，而不是跑腿办手续',
          '专业服务降低出错风险，避免因为不懂流程导致的延误或罚款',
          '快速启动，通常1-2周内完成所有手续，比自己办快很多',
          '获得专业建议，代办公司经验丰富，可以告诉你哪些坑要避免',
        ],
      },
    };
  }

  /**
   * 获取通用创业指南
   */
  private static async getStartupGuides(): Promise<StartupGuide[]> {
    const guides = await query<{
      title: string;
      content: string;
    }>(
      `SELECT title, content
       FROM startup_guides
       WHERE is_active = TRUE AND deleted_at IS NULL
       ORDER BY display_order ASC`
    );

    return guides.map(g => ({
      title: g.title,
      content: g.content,
    }));
  }
}
