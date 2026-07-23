import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Story } from '../src/models/Story'
import { PassionSpark } from '../src/models/PassionSpark'
import { User } from '../src/models/User'

dotenv.config()

const stories = [
  {
    type: 'growth_story',
    title: '从零到第一单：我的真实成长',
    content: '记得接下第一个项目时，我既兴奋又紧张。那是一个微信公众号的排版任务，虽然难度不高，但对当时的我来说是个巨大的挑战。我花了整整三天时间研究排版工具，反复修改细节，最终交付时客户给了我5星好评。那一刻，我意识到：原来我真的可以通过自己的努力赚到钱，这种成就感是无法用言语形容的。从那以后，我开始相信自己，也开始理解什么叫"使命是河" — 每一步都是成长。',
    tags: ['第一单', '成长', '公众号运营', '自信建立'],
    metadata: {
      beforeLevel: 1,
      afterLevel: 1,
      achievement: '完成首单',
      emotion: '兴奋、紧张、成就感',
      insight: '相信自己的能力'
    }
  },
  {
    type: 'passion_spark',
    title: '热情火花 - 发现我热爱设计的瞬间',
    content: '在做一个品牌logo设计项目时，我突然进入了一种忘我的状态。从构思到草稿，从调色到定稿，整整8个小时我完全沉浸其中，甚至忘记了吃饭。当最终成品呈现在眼前时，那种满足感让我确信：这就是我想做的事情。原来工作也可以这么快乐！',
    tags: ['设计', '热情', '心流', 'logo'],
    metadata: {
      intensity: 5,
      trigger: '品牌logo设计项目',
      emotion: '沉浸、满足、快乐'
    }
  },
  {
    type: 'flow_moment',
    title: '穿越感时刻：代码世界的奇妙体验',
    content: '凌晨三点，我盯着屏幕调试一个复杂的功能。突然间，所有的逻辑都清晰了，我的手指在键盘上飞舞，一行行代码如流水般写出。那个瞬间，时间仿佛静止，只剩下我和代码的对话。当功能完美运行时，我感到前所未有的成就感 — 这就是程序员的浪漫吧。',
    tags: ['编程', '穿越感', '专注', '深夜'],
    metadata: {
      emotion: '专注、兴奋、成就感',
      insight: '找到了与技术对话的感觉'
    }
  },
  {
    type: 'life_question',
    title: '我的天赋到底是什么？',
    content: '完成了20个项目后，我开始思考一个问题：我的天赋到底是什么？我发现自己特别擅长把复杂的事情拆解成简单的步骤，无论是内容运营还是技术开发，我都能快速理清思路。也许，这就是我的天赋 — 系统化思维。现在我开始有意识地培养这个能力，并将它应用到更多场景中。',
    tags: ['自我探索', '天赋', '系统化思维', '反思'],
    metadata: {
      insight: '发现系统化思维是自己的天赋',
      emotion: '探索、思考、确定'
    }
  },
  {
    type: 'growth_story',
    title: '第10个项目：突破舒适区的冒险',
    content: '完成第9个项目后，我本可以继续接简单的任务。但AI导师建议我尝试一个难度更高的项目 — 一个小程序开发任务。我犹豫了很久，最终还是接下了。过程很艰难，我查了无数资料，请教了很多人，甚至想过放弃。但当项目成功上线时，我发现自己的能力提升了一大截。这次冒险让我明白：成长就是不断突破舒适区。',
    tags: ['冒险项目', '小程序', '突破', '成长'],
    metadata: {
      beforeLevel: 2,
      afterLevel: 2,
      achievement: '完成第10个项目',
      emotion: '犹豫、艰难、突破',
      insight: '舒适区之外才有真正的成长'
    }
  },
  {
    type: 'passion_spark',
    title: '热情火花 - 文字的力量',
    content: '在撰写一篇品牌故事时，我突然感受到了文字的力量。每一个词、每一句话都在传递情感，构建画面。我意识到，好的文案不只是文字的堆砌，而是情感的共鸣。从那一刻起，我爱上了用文字讲故事。',
    tags: ['文案', '品牌故事', '热情', '写作'],
    metadata: {
      intensity: 4,
      trigger: '品牌故事撰写',
      emotion: '感动、兴奋'
    }
  }
]

async function seedStories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng')
    console.log('✓ 数据库连接成功')

    // 查找一个测试用户
    const user = await User.findOne()
    if (!user) {
      console.log('✗ 未找到用户，请先创建用户')
      process.exit(1)
    }

    console.log(`✓ 使用用户ID: ${user._id}`)

    // 清空现有数据
    await Story.deleteMany({})
    await PassionSpark.deleteMany({})
    console.log('✓ 清空现有故事数据')

    // 导入故事
    const createdStories = []
    for (const storyData of stories) {
      const story = await Story.create({
        userId: user._id,
        ...storyData,
        isPublic: true,
        publishedAt: new Date(),
        likeCount: Math.floor(Math.random() * 50),
        viewCount: Math.floor(Math.random() * 200)
      })
      createdStories.push(story)
      console.log(`  ✓ 创建故事: ${story.title}`)

      // 如果是热情火花类型，同时创建PassionSpark记录
      if (story.type === 'passion_spark' && story.metadata) {
        const metadata = story.metadata as any
        await PassionSpark.create({
          userId: user._id,
          content: story.content,
          trigger: metadata.trigger || '未知触发',
          intensity: metadata.intensity || 3,
          tags: story.tags,
          isShared: true,
          storyId: story._id,
          createdAt: story.createdAt
        })
        console.log(`    ✓ 关联热情火花记录`)
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✓ 故事墙数据导入成功！')
    console.log(`✓ 共导入 ${createdStories.length} 个故事`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // 显示统计
    const stats = await Story.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])

    console.log('\n故事类型分布:')
    stats.forEach(stat => {
      const typeNames: Record<string, string> = {
        'growth_story': '成长故事',
        'passion_spark': '热情火花',
        'flow_moment': '穿越感时刻',
        'life_question': '生命问题'
      }
      console.log(`  ${typeNames[stat._id]}: ${stat.count}个`)
    })

    process.exit(0)
  } catch (error) {
    console.error('✗ 导入失败:', error)
    process.exit(1)
  }
}

seedStories()
