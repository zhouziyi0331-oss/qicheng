#!/bin/bash

# 验证OPC测试→能力画像联动
# 测试场景：完成38题→生成画像→向量化→推荐变化

echo "=========================================="
echo "OPC测试→能力画像联动验证"
echo "=========================================="
echo ""

# 数据库连接
DB_CONTAINER="qicheng-postgres"
DB_NAME="qicheng"
DB_USER="postgres"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试1: 检查现有OPC测试完成情况
echo "测试1: 检查现有OPC测试完成情况"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    r.student_id,
    r.personality_label,
    r.info_processing_score,
    r.creation_drive_score,
    r.tool_learning_score,
    r.created_at as opc_completed_at
FROM opc_v2_results r
ORDER BY r.created_at DESC
LIMIT 5;
EOF

echo ""

# 测试2: 检查OPC结果是否同步到user_ability_profiles
echo "测试2: 检查OPC结果是否同步到user_ability_profiles"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    'OPC结果' as source,
    COUNT(*) as count
FROM opc_v2_results
UNION ALL
SELECT
    'user_ability_profiles' as source,
    COUNT(*) as count
FROM user_ability_profiles
WHERE is_current = true;
EOF

echo ""

# 测试3: 检查是否同步到student_capabilities
echo "测试3: 检查是否同步到student_capabilities"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    r.student_id,
    r.personality_label as opc_label,
    sc.personality_style as capability_label,
    sc.profile_summary,
    CASE
        WHEN sc.combined_vector IS NOT NULL THEN '✓ 已生成'
        ELSE '✗ 未生成'
    END as vector_status,
    sc.vector_updated_at
FROM opc_v2_results r
LEFT JOIN student_capabilities sc ON r.student_id = sc.student_id
ORDER BY r.created_at DESC
LIMIT 5;
EOF

echo ""

# 测试4: 检查工作条件画像是否生成
echo "测试4: 检查工作条件画像是否生成"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    r.student_id,
    r.personality_label,
    CASE
        WHEN wcp.id IS NOT NULL THEN '✓ 已生成'
        ELSE '✗ 未生成'
    END as work_condition_profile_status,
    wcp.created_at as profile_created_at
FROM opc_v2_results r
LEFT JOIN student_work_condition_profiles wcp ON r.student_id = wcp.student_id
ORDER BY r.created_at DESC
LIMIT 5;
EOF

echo ""

# 测试5: 检查完整的联动链
echo "测试5: 检查完整的联动链"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
WITH opc_students AS (
    SELECT DISTINCT student_id FROM opc_v2_results
)
SELECT
    os.student_id,
    CASE WHEN r.id IS NOT NULL THEN '✓' ELSE '✗' END as "OPC结果",
    CASE WHEN uap.id IS NOT NULL THEN '✓' ELSE '✗' END as "能力画像",
    CASE WHEN sc.id IS NOT NULL THEN '✓' ELSE '✗' END as "学生能力",
    CASE WHEN sc.combined_vector IS NOT NULL THEN '✓' ELSE '✗' END as "向量",
    CASE WHEN wcp.id IS NOT NULL THEN '✓' ELSE '✗' END as "工作画像",
    CASE WHEN tsm.id IS NOT NULL THEN '✓' ELSE '✗' END as "匹配记录"
FROM opc_students os
LEFT JOIN opc_v2_results r ON os.student_id = r.student_id
LEFT JOIN user_ability_profiles uap ON os.student_id = uap.user_id AND uap.is_current = true
LEFT JOIN student_capabilities sc ON os.student_id = sc.student_id
LEFT JOIN student_work_condition_profiles wcp ON os.student_id = wcp.student_id
LEFT JOIN task_student_matches tsm ON os.student_id = tsm.student_id
ORDER BY os.student_id;
EOF

echo ""

# 测试6: 检查联动断点
echo "测试6: 检查联动断点（哪些环节缺失）"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
WITH linkage_check AS (
    SELECT
        r.student_id,
        r.personality_label,
        CASE WHEN uap.id IS NOT NULL THEN 1 ELSE 0 END as has_ability_profile,
        CASE WHEN sc.id IS NOT NULL THEN 1 ELSE 0 END as has_student_capability,
        CASE WHEN sc.combined_vector IS NOT NULL THEN 1 ELSE 0 END as has_vector,
        CASE WHEN wcp.id IS NOT NULL THEN 1 ELSE 0 END as has_work_profile
    FROM opc_v2_results r
    LEFT JOIN user_ability_profiles uap ON r.student_id = uap.user_id AND uap.is_current = true
    LEFT JOIN student_capabilities sc ON r.student_id = sc.student_id
    LEFT JOIN student_work_condition_profiles wcp ON r.student_id = wcp.student_id
)
SELECT
    '完整联动' as status,
    COUNT(*) as count
FROM linkage_check
WHERE has_ability_profile = 1
  AND has_student_capability = 1
  AND has_vector = 1
  AND has_work_profile = 1
UNION ALL
SELECT
    '缺少student_capability' as status,
    COUNT(*) as count
FROM linkage_check
WHERE has_ability_profile = 1
  AND has_student_capability = 0
UNION ALL
SELECT
    '缺少向量' as status,
    COUNT(*) as count
FROM linkage_check
WHERE has_student_capability = 1
  AND has_vector = 0
UNION ALL
SELECT
    '缺少工作画像' as status,
    COUNT(*) as count
FROM linkage_check
WHERE has_ability_profile = 1
  AND has_work_profile = 0;
EOF

echo ""

# 测试7: 推荐任务变化验证（如果有匹配记录）
echo "测试7: 检查是否有推荐任务"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    r.student_id,
    r.personality_label,
    COUNT(tsm.id) as matched_tasks_count,
    AVG(tsm.overall_score) as avg_match_score,
    MAX(tsm.created_at) as last_match_at
FROM opc_v2_results r
LEFT JOIN task_student_matches tsm ON r.student_id = tsm.student_id
GROUP BY r.student_id, r.personality_label
ORDER BY matched_tasks_count DESC;
EOF

echo ""

# 总结
echo "=========================================="
echo "验证总结"
echo "=========================================="
echo ""
echo "如果发现联动断点，运行以下命令修复："
echo ""
echo -e "${YELLOW}cd /Users/alwan/code/qicheng/backend${NC}"
echo -e "${YELLOW}npm run fix-opc-linkage${NC}"
echo ""
echo "或者手动调用集成服务："
echo ""
echo -e "${YELLOW}node -e \"require('./dist/services/opcIntegrationService').default.syncAllCompletedOPC()\"${NC}"
echo ""
