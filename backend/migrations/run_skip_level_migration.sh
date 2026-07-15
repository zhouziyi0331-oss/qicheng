#!/bin/bash
# 跳级系统数据库迁移脚本
# 使用方法: ./run_skip_level_migration.sh [数据库用户名] [数据库名]

DB_USER=${1:-root}
DB_NAME=${2:-qicheng}

echo "======================================"
echo "跳级系统数据库迁移"
echo "======================================"
echo "数据库用户: $DB_USER"
echo "数据库名称: $DB_NAME"
echo "======================================"
echo ""
echo "将创建以下表:"
echo "  - skip_level_applications (跳级申请记录)"
echo "  - skip_level_tasks (任务详情)"
echo "  - skip_level_progress (进度追踪)"
echo "  - skip_level_submissions (作品提交)"
echo "  - skip_level_scores (评分结果)"
echo "  - skip_level_cooldowns (冷却期)"
echo "  - badges (徽章表，如不存在)"
echo ""
read -p "确认执行迁移? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "正在执行迁移..."
    mysql -u $DB_USER -p $DB_NAME < skip_level_system.sql

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 迁移成功!"
        echo ""
        echo "验证表是否创建:"
        mysql -u $DB_USER -p $DB_NAME -e "SHOW TABLES LIKE 'skip_level%';"
    else
        echo ""
        echo "❌ 迁移失败，请检查错误信息"
        exit 1
    fi
else
    echo "已取消迁移"
    exit 0
fi
