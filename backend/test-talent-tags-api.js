/**
 * 测试天赋标签API
 * 运行: node test-talent-tags-api.js
 */

const { pool } = require('./src/utils/db');

async function testTalentTagsAPI() {
  console.log('🧪 测试天赋标签系统...\n');

  try {
    // 1. 检查talent_tags表是否存在
    console.log('1️⃣ 检查talent_tags表...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'talent_tags'
      );
    `);
    console.log('✅ talent_tags表存在:', tableCheck.rows[0].exists);

    // 2. 检查student_talent_tags表是否存在
    console.log('\n2️⃣ 检查student_talent_tags表...');
    const studentTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'student_talent_tags'
      );
    `);
    console.log('✅ student_talent_tags表存在:', studentTableCheck.rows[0].exists);

    // 3. 查看talent_tags表中有多少标签
    console.log('\n3️⃣ 查询talent_tags表统计...');
    const tagStats = await pool.query(`
      SELECT
        category,
        COUNT(*) as count
      FROM talent_tags
      GROUP BY category
      ORDER BY category;
    `);
    console.log('📊 标签统计:');
    tagStats.rows.forEach(row => {
      console.log(`   - ${row.category}: ${row.count}个`);
    });
    const totalTags = await pool.query('SELECT COUNT(*) as total FROM talent_tags');
    console.log(`   总计: ${totalTags.rows[0].total}个标签`);

    // 4. 查看是否有学生已经有天赋标签
    console.log('\n4️⃣ 查询学生天赋标签统计...');
    const studentTagStats = await pool.query(`
      SELECT
        COUNT(DISTINCT student_id) as student_count,
        COUNT(*) as total_tags,
        COUNT(*) FILTER (WHERE strength = 'emerging') as emerging,
        COUNT(*) FILTER (WHERE strength = 'clear') as clear,
        COUNT(*) FILTER (WHERE strength = 'prominent') as prominent,
        COUNT(*) FILTER (WHERE strength = 'core') as core
      FROM student_talent_tags;
    `);
    const stats = studentTagStats.rows[0];
    console.log('📊 学生标签统计:');
    console.log(`   - 有标签的学生数: ${stats.student_count}`);
    console.log(`   - 标签总数: ${stats.total_tags}`);
    console.log(`   - 初步显现: ${stats.emerging}个`);
    console.log(`   - 明确优势: ${stats.clear}个`);
    console.log(`   - 突出优势: ${stats.prominent}个`);
    console.log(`   - 核心优势: ${stats.core}个`);

    // 5. 随机查看一个学生的标签（如果有的话）
    const sampleStudent = await pool.query(`
      SELECT DISTINCT student_id
      FROM student_talent_tags
      LIMIT 1;
    `);

    if (sampleStudent.rows.length > 0) {
      const studentId = sampleStudent.rows[0].student_id;
      console.log(`\n5️⃣ 示例学生 (${studentId}) 的标签:`);

      const studentTags = await pool.query(`
        SELECT
          tt.tag_name,
          tt.category,
          tt.description,
          stt.strength,
          stt.confidence,
          stt.source,
          stt.verified_count
        FROM student_talent_tags stt
        JOIN talent_tags tt ON stt.tag_id = tt.id
        WHERE stt.student_id = $1
        ORDER BY stt.confidence DESC
        LIMIT 5;
      `, [studentId]);

      studentTags.rows.forEach(tag => {
        console.log(`   - ${tag.tag_name} (${tag.category})`);
        console.log(`     强度: ${tag.strength}, 置信度: ${tag.confidence}, 来源: ${tag.source}`);
      });
    } else {
      console.log('\n5️⃣ 暂无学生有天赋标签');
    }

    // 6. 测试成长仪表盘数据结构
    console.log('\n6️⃣ 检查student_growth_dashboard视图...');
    const dashboardCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_name = 'student_growth_dashboard'
      );
    `);
    console.log('✅ student_growth_dashboard视图存在:', dashboardCheck.rows[0].exists);

    console.log('\n✅ 所有测试完成！');
    console.log('\n📝 前端需要的API端点:');
    console.log('   1. GET /api/v1/student/talent-tags - 获取学生天赋标签');
    console.log('   2. GET /api/v1/mentor-stage/students/growth-dashboard - 获取成长仪表盘（含recentUnlockedTags）');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testTalentTagsAPI();
