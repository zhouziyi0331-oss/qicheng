import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

async function testStoryWall() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('开始测试故事墙系统')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 1. 获取故事墙列表
    console.log('1. 测试获取故事墙列表')
    const storiesRes = await axios.get(`${API_BASE}/story-wall/stories`)
    console.log(`✓ 获取成功，共 ${storiesRes.data.data.stories.length} 个故事`)
    console.log(`  总数: ${storiesRes.data.data.total}`)
    console.log(`  是否有更多: ${storiesRes.data.data.hasMore}`)

    if (storiesRes.data.data.stories.length > 0) {
      const firstStory = storiesRes.data.data.stories[0]
      console.log(`\n  第一个故事:`)
      console.log(`    标题: ${firstStory.title}`)
      console.log(`    类型: ${firstStory.type}`)
      console.log(`    点赞数: ${firstStory.likeCount}`)
      console.log(`    浏览数: ${firstStory.viewCount}`)
      console.log(`    标签: ${firstStory.tags.join(', ')}`)
    }

    // 2. 按类型筛选
    console.log('\n2. 测试按类型筛选（热情火花）')
    const passionRes = await axios.get(`${API_BASE}/story-wall/stories?type=passion_spark`)
    console.log(`✓ 获取成功，热情火花数量: ${passionRes.data.data.stories.length}`)

    // 3. 热门排序
    console.log('\n3. 测试热门排序')
    const popularRes = await axios.get(`${API_BASE}/story-wall/stories?sortBy=popular`)
    console.log(`✓ 获取成功`)
    if (popularRes.data.data.stories.length > 0) {
      console.log(`  最受欢迎: ${popularRes.data.data.stories[0].title} (${popularRes.data.data.stories[0].likeCount}个赞)`)
    }

    // 4. 获取故事详情
    if (storiesRes.data.data.stories.length > 0) {
      const storyId = storiesRes.data.data.stories[0]._id
      console.log('\n4. 测试获取故事详情')
      const detailRes = await axios.get(`${API_BASE}/story-wall/stories/${storyId}`)
      console.log(`✓ 获取成功`)
      console.log(`  标题: ${detailRes.data.data.story.title}`)
      console.log(`  内容长度: ${detailRes.data.data.story.content.length}字`)
      console.log(`  浏览数: ${detailRes.data.data.story.viewCount}`)
    }

    // 5. 获取故事墙统计
    console.log('\n5. 测试获取故事墙统计')
    const statsRes = await axios.get(`${API_BASE}/story-wall/stats`)
    console.log(`✓ 获取成功`)
    console.log(`  总故事数: ${statsRes.data.data.totalStories}`)
    console.log(`  总点赞数: ${statsRes.data.data.totalLikes}`)
    console.log(`  总浏览数: ${statsRes.data.data.totalViews}`)
    console.log(`  故事类型分布:`)
    Object.entries(statsRes.data.data.storyTypeDistribution).forEach(([type, count]) => {
      const typeNames: Record<string, string> = {
        'growth_story': '成长故事',
        'passion_spark': '热情火花',
        'flow_moment': '穿越感时刻',
        'life_question': '生命问题'
      }
      console.log(`    ${typeNames[type]}: ${count}`)
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 故事墙测试全部通过！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.response?.data || error.message)
    process.exit(1)
  }
}

testStoryWall()
