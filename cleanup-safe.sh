#!/bin/bash

echo "=========================================="
echo "启程项目 - 安全清理脚本"
echo "=========================================="
echo ""

# 创建归档目录
echo "1. 创建归档目录..."
mkdir -p archive/old-docs
mkdir -p archive/old-scripts

# 移动冗余文档到归档
echo "2. 归档冗余文档..."

# 完成报告 (18个)
mv FINAL_REPORT.md archive/old-docs/ 2>/dev/null
mv FINAL_COMPLETION_REPORT.md archive/old-docs/ 2>/dev/null
mv FINAL_DELIVERY_SUMMARY.md archive/old-docs/ 2>/dev/null
mv FINAL_PROGRESS_REPORT.md archive/old-docs/ 2>/dev/null
mv PROJECT_SUMMARY.md archive/old-docs/ 2>/dev/null
mv PROJECT_COMPLETION_REPORT.md archive/old-docs/ 2>/dev/null
mv BACKEND_API_COMPLETED.md archive/old-docs/ 2>/dev/null
mv BACKEND_FIXES_SUMMARY.md archive/old-docs/ 2>/dev/null
mv FRONTEND_API_INTEGRATION_COMPLETE.md archive/old-docs/ 2>/dev/null
mv FRONTEND_API_FINAL_STATUS.md archive/old-docs/ 2>/dev/null
mv DELIVERY_COMPLETE.md archive/old-docs/ 2>/dev/null
mv BUSINESS_FLOW_COMPLETE.md archive/old-docs/ 2>/dev/null
mv CHAT_SYSTEM_COMPLETED.md archive/old-docs/ 2>/dev/null
mv RATING_SYSTEM_COMPLETED.md archive/old-docs/ 2>/dev/null
mv COMPANY_MINIAPP_COMPLETED.md archive/old-docs/ 2>/dev/null
mv MISSING_FEATURES_COMPLETED.md archive/old-docs/ 2>/dev/null
mv OPC_SYSTEM_100_PERCENT_COMPLETE.md archive/old-docs/ 2>/dev/null
mv AI_TUTOR_SYSTEM_COMPLETE.md archive/old-docs/ 2>/dev/null

# 测试文档 (6个)
mv TESTING.md archive/old-docs/ 2>/dev/null
mv TESTING_GUIDE.md archive/old-docs/ 2>/dev/null
mv TEST_EXECUTION_REPORT.md archive/old-docs/ 2>/dev/null
mv AI_TEST_GUIDE.md archive/old-docs/ 2>/dev/null
mv THREE_PORTS_TEST_GUIDE.md archive/old-docs/ 2>/dev/null
mv OPC_TEST_SYSTEM_2.0_REPORT.md archive/old-docs/ 2>/dev/null

# 指南 (2个)
mv START_GUIDE.md archive/old-docs/ 2>/dev/null
mv ACCESS_GUIDE.md archive/old-docs/ 2>/dev/null

# 部署 (3个)
mv DEPLOYMENT.md archive/old-docs/ 2>/dev/null
mv DEPLOYMENT_TUTORIAL.md archive/old-docs/ 2>/dev/null
mv WEB_MINIAPP_DEPLOYMENT.md archive/old-docs/ 2>/dev/null

# 实现计划 (4个)
mv IMPLEMENTATION_PLAN.md archive/old-docs/ 2>/dev/null
mv IMPLEMENTATION_PROGRESS.md archive/old-docs/ 2>/dev/null
mv OPTIMIZATION_PLAN.md archive/old-docs/ 2>/dev/null
mv MISSION_IS_RIVER_UPGRADE_PLAN.md archive/old-docs/ 2>/dev/null

# AI文档 (4个)
mv AI_FEATURES.md archive/old-docs/ 2>/dev/null
mv AI_MENTOR_SYSTEM_2.0.md archive/old-docs/ 2>/dev/null
mv AI_MATCHING_GUIDE.md archive/old-docs/ 2>/dev/null
mv AI_MENTOR_SUMMARY.md archive/old-docs/ 2>/dev/null

# API文档 (3个)
mv API_ALIGNMENT_ANALYSIS.md archive/old-docs/ 2>/dev/null
mv API_MAPPING.md archive/old-docs/ 2>/dev/null

# 其他 (11个)
mv THREE_PLATFORMS_OVERVIEW.md archive/old-docs/ 2>/dev/null
mv THREE_PLATFORMS_STATUS.md archive/old-docs/ 2>/dev/null
mv THREE_PORTS_SUMMARY.md archive/old-docs/ 2>/dev/null
mv MISSION_IS_RIVER_COMPLETION_REPORT.md archive/old-docs/ 2>/dev/null
mv MISSION_IS_RIVER_FINAL_REPORT.md archive/old-docs/ 2>/dev/null
mv COMPANY_MINIAPP_PAGES_CHECK.md archive/old-docs/ 2>/dev/null
mv STUDENT_MINIAPP_PAGES_CHECK.md archive/old-docs/ 2>/dev/null
mv DELIVERY.md archive/old-docs/ 2>/dev/null
mv CHECKLIST.md archive/old-docs/ 2>/dev/null
mv REMAINING_FEATURES_GUIDE.md archive/old-docs/ 2>/dev/null
mv COMPLETE_BUSINESS_FLOW.md archive/old-docs/ 2>/dev/null

# 临时文件
mv api-alignment-report.json archive/old-scripts/ 2>/dev/null
mv check-api-alignment.js archive/old-scripts/ 2>/dev/null
mv generate-api-mapping.js archive/old-scripts/ 2>/dev/null

echo "3. 统计归档文件..."
archived_count=$(find archive/old-docs -type f | wc -l)
echo "已归档 $archived_count 个文档"

echo ""
echo "4. 当前根目录文档："
ls -1 *.md 2>/dev/null | wc -l
echo ""

echo "=========================================="
echo "✅ 清理完成！"
echo "=========================================="
echo ""
echo "归档位置: ./archive/old-docs/"
echo "如需恢复: mv archive/old-docs/* ."
echo "如需删除归档: rm -rf archive/"
echo ""
