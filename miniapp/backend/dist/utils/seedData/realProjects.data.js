"use strict";
/**
 * 真实项目种子数据
 * 这些是可供用户接单的真实项目
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.realProjectsData = void 0;
exports.realProjectsData = [
    // 内容运营类项目
    {
        title: '小红书美妆品牌账号冷启动方案',
        description: '需要为新入驻小红书的国产美妆品牌制定0-1冷启动策略，包括账号定位、内容规划、KOL合作策略等。要求有小红书运营经验，熟悉美妆行业。',
        company: '某新锐美妆品牌',
        category: '内容运营',
        difficulty: 'medium',
        requiredAbilities: ['内容策划', '社媒运营', '数据分析'],
        estimatedDays: 10,
        budget: 3500
    },
    {
        title: '抖音本地生活商家短视频脚本创作',
        description: '为成都地区火锅店创作10条抖音短视频脚本，需要结合本地特色和网络热点，风格轻松幽默，能够吸引年轻用户。提供分镜头脚本和文案。',
        company: '成都某连锁火锅品牌',
        category: '内容创作',
        difficulty: 'easy',
        requiredAbilities: ['文案撰写', '短视频策划'],
        estimatedDays: 5,
        budget: 2000
    },
    {
        title: 'B站UP主账号月度运营执行',
        description: '协助科技类UP主进行一个月的账号运营，包括选题策划、数据分析、粉丝互动、商业合作对接等。要求熟悉B站生态，有数据分析能力。',
        company: '某科技UP主工作室',
        category: '账号运营',
        difficulty: 'medium',
        requiredAbilities: ['社媒运营', '数据分析', '用户洞察'],
        estimatedDays: 30,
        budget: 8000
    },
    {
        title: '微信公众号图文排版设计',
        description: '为教育机构微信公众号进行20篇文章的排版设计，要求风格统一、符合品牌调性、提升阅读体验。需要熟练使用编辑器工具。',
        company: '某在线教育平台',
        category: '内容设计',
        difficulty: 'easy',
        requiredAbilities: ['视觉设计', '排版设计'],
        estimatedDays: 7,
        budget: 1500
    },
    {
        title: '视频号直播带货策划与执行',
        description: '为服装品牌策划并执行3场视频号直播，包括直播脚本、产品组合、互动玩法、数据复盘。要求有直播带货经验。',
        company: '某女装品牌',
        category: '直播运营',
        difficulty: 'hard',
        requiredAbilities: ['直播策划', '销售转化', '数据分析'],
        estimatedDays: 15,
        budget: 6000
    },
    // 技术开发类项目
    {
        title: '企业官网响应式前端开发',
        description: '基于设计稿开发企业官网前端页面（约8个页面），要求响应式设计、兼容主流浏览器、加载速度优化。技术栈：React + TypeScript。',
        company: '某科技公司',
        category: '前端开发',
        difficulty: 'medium',
        requiredAbilities: ['前端开发', 'React', '响应式设计'],
        estimatedDays: 12,
        budget: 8000
    },
    {
        title: '微信小程序商城功能开发',
        description: '为现有小程序添加商城模块，包括商品展示、购物车、订单管理、支付集成。要求代码规范、性能优化。',
        company: '某零售企业',
        category: '小程序开发',
        difficulty: 'hard',
        requiredAbilities: ['小程序开发', '后端接口', '支付集成'],
        estimatedDays: 20,
        budget: 12000
    },
    {
        title: 'Python数据爬虫与清洗',
        description: '爬取电商平台特定类目商品数据（约10万条），进行数据清洗和结构化处理，输出CSV文件。要求遵守网站robots协议。',
        company: '某数据分析公司',
        category: '数据采集',
        difficulty: 'medium',
        requiredAbilities: ['Python', '数据处理', '爬虫技术'],
        estimatedDays: 8,
        budget: 4500
    },
    {
        title: 'APP性能优化与Bug修复',
        description: '对Android APP进行性能优化（启动速度、内存占用、卡顿问题）和已知Bug修复（约15个）。要求有Android开发经验。',
        company: '某移动互联网公司',
        category: '移动开发',
        difficulty: 'hard',
        requiredAbilities: ['Android开发', '性能优化', '问题排查'],
        estimatedDays: 15,
        budget: 10000
    },
    {
        title: 'WordPress企业网站搭建与定制',
        description: '使用WordPress搭建企业展示网站，包括主题定制、插件配置、SEO优化、服务器部署。要求有WordPress开发经验。',
        company: '某咨询公司',
        category: 'Web开发',
        difficulty: 'easy',
        requiredAbilities: ['WordPress', 'PHP', 'SEO'],
        estimatedDays: 10,
        budget: 5000
    },
    // 设计类项目
    {
        title: '品牌VI视觉识别系统设计',
        description: '为新创立的咖啡品牌设计完整VI系统，包括Logo、标准色、辅助图形、应用规范等。要求有品牌设计经验。',
        company: '某咖啡连锁品牌',
        category: '品牌设计',
        difficulty: 'hard',
        requiredAbilities: ['品牌设计', '平面设计', '视觉规范'],
        estimatedDays: 20,
        budget: 15000
    },
    {
        title: '产品UI界面设计',
        description: '为SaaS产品设计后台管理界面（约25个页面），要求符合B端设计规范、注重信息层级和操作效率。',
        company: '某SaaS公司',
        category: 'UI设计',
        difficulty: 'medium',
        requiredAbilities: ['UI设计', '交互设计', 'B端产品'],
        estimatedDays: 15,
        budget: 9000
    },
    {
        title: '社交媒体营销海报设计',
        description: '为线上活动设计20张社交媒体营销海报（微信、微博、小红书等渠道），要求视觉吸引、符合品牌调性。',
        company: '某电商平台',
        category: '平面设计',
        difficulty: 'easy',
        requiredAbilities: ['平面设计', '视觉设计', '营销思维'],
        estimatedDays: 7,
        budget: 3000
    },
    {
        title: '产品宣传动画视频制作',
        description: '制作1分钟产品宣传MG动画，包括脚本、分镜、动画制作、配音配乐。要求节奏紧凑、信息清晰。',
        company: '某科技创业公司',
        category: '动画制作',
        difficulty: 'hard',
        requiredAbilities: ['动画制作', 'AE特效', '视频剪辑'],
        estimatedDays: 12,
        budget: 8000
    },
    {
        title: '电商产品摄影与修图',
        description: '为服装电商拍摄100件商品，包括平铺图、挂拍图、细节图，后期精修。要求有电商摄影经验。',
        company: '某服装电商',
        category: '摄影修图',
        difficulty: 'medium',
        requiredAbilities: ['商业摄影', '修图', '电商视觉'],
        estimatedDays: 10,
        budget: 6000
    }
];
//# sourceMappingURL=realProjects.data.js.map