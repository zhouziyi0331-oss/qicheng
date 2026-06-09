#!/usr/bin/env python3
"""
批量迁移脚本：student_profiles → users + student_capabilities
智能替换所有使用旧字段的TypeScript文件
"""

import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

# 需要修改的文件列表
FILES_TO_MIGRATE = [
    "src/routes/ability/controller.ts",
    "src/routes/admin/dashboard.ts",
    "src/routes/admin/dashboardController.ts",
    "src/routes/admin/studentController.ts",
    "src/routes/alliances/controller.ts",
    "src/routes/challenge/controller.ts",
    "src/routes/company/controller.ts",
    "src/routes/exploration/controller.ts",
    "src/routes/incubation/controller.ts",
    "src/routes/mentor/controller.ts",
    "src/routes/mentor/enhanced-controller.ts",
    "src/routes/opc/controller.ts",
    "src/routes/partnerships/controller.ts",
    "src/routes/reports/controller.ts",
    "src/routes/story/controller.ts",
    "src/routes/student/controller.ts",
    "src/routes/tasks/businessFlowController.ts",
    "src/routes/tasks/companyController.ts",
    "src/routes/tasks/studentFlowController.ts",
    "src/routes/tasks/verificationFlowController.ts",
    "src/routes/team/controller.ts",
    "src/routes/user/profileController.ts",
    "src/scripts/generateEmbeddings.ts",
    "src/services/enhancedMentorService.ts",
    "src/services/invitation/activityService.ts",
    "src/services/invitation/invitationService.ts",
    "src/services/invitation/matchService.ts",
    "src/services/mentorCoreService.ts",
    "src/services/startupReportService.ts",
    "src/utils/sixDimUpdater.ts",
]

# 替换规则（按优先级排序）
REPLACEMENTS = [
    # SQL查询中的表名和别名
    (r'FROM\s+student_profiles\s+sp\b', 'FROM users u'),
    (r'JOIN\s+student_profiles\s+sp\b', 'JOIN users u'),
    (r'LEFT\s+JOIN\s+student_profiles\s+sp\b', 'LEFT JOIN users u'),
    (r'INNER\s+JOIN\s+student_profiles\s+sp\b', 'INNER JOIN users u'),

    # 字段引用（带别名）
    (r'\bsp\.level_a\b', 'u.current_level'),
    (r'\bsp\.level_b\b', 'u.current_level'),  # level_b废弃，也映射到current_level
    (r'\bsp\.track\b', 'u.track'),
    (r'\bsp\.user_id\b', 'u.id'),

    # TypeScript类型定义中的字段
    (r'\blevel_a:\s*number', 'current_level: number'),
    (r'\blevel_a\?:\s*number', 'current_level?: number'),
    (r'\blevel_b:\s*number', 'current_level: number'),  # level_b废弃
    (r'\blevel_b\?:\s*number', 'current_level?: number'),

    # 对象属性访问
    (r'\.level_a\b', '.current_level'),
    (r'\[\'level_a\'\]', "['current_level']"),
    (r'\["level_a"\]', '["current_level"]'),

    # SELECT子句中的字段
    (r'SELECT\s+([^;]*?)level_a', lambda m: m.group(0).replace('level_a', 'current_level')),

    # 注释中的说明（保持不变，只是提醒）
    # 不替换注释，避免混淆
]

def create_backup(base_dir):
    """创建源代码备份"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = f"{base_dir}/src_backup_{timestamp}"

    print(f"📦 创建备份: {backup_dir}")
    shutil.copytree(f"{base_dir}/src", backup_dir)
    return backup_dir

def migrate_file(file_path, dry_run=False):
    """迁移单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes = []

        # 应用所有替换规则
        for pattern, replacement in REPLACEMENTS:
            if callable(replacement):
                # 使用函数替换
                new_content = re.sub(pattern, replacement, content)
            else:
                # 使用字符串替换
                new_content = re.sub(pattern, replacement, content)

            if new_content != content:
                # 记录变化
                old_count = len(re.findall(pattern, content))
                changes.append(f"  - 替换 {old_count} 处: {pattern}")
                content = new_content

        # 如果有变化
        if content != original_content:
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

            return True, changes

        return False, []

    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False, []

def main():
    """主函数"""
    print("🔧 启程平台 - 数据库字段迁移工具")
    print("=" * 60)
    print()

    # 获取项目根目录
    base_dir = Path(__file__).parent.parent
    os.chdir(base_dir)

    # 检查命令行参数
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv

    # 询问是否执行
    print("⚠️  此脚本将修改以下文件:")
    for f in FILES_TO_MIGRATE[:5]:
        print(f"   - {f}")
    print(f"   ... 共 {len(FILES_TO_MIGRATE)} 个文件")
    print()

    if not auto_confirm:
        response = input("是否继续? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("❌ 已取消")
            return
    else:
        print("✅ 自动确认模式 (--yes)")
        print()

    # 创建备份
    backup_dir = create_backup(base_dir)
    print()

    # 执行迁移
    print("📝 开始迁移...")
    print()

    total_files = 0
    modified_files = 0

    for file_path in FILES_TO_MIGRATE:
        full_path = base_dir / file_path

        if not full_path.exists():
            print(f"  ⚠️  文件不存在: {file_path}")
            continue

        total_files += 1
        modified, changes = migrate_file(full_path)

        if modified:
            modified_files += 1
            print(f"  ✅ {file_path}")
            for change in changes:
                print(change)
        else:
            print(f"  ⏭️  {file_path} (无需修改)")

    print()
    print("=" * 60)
    print("✨ 迁移完成！")
    print(f"   总文件数: {total_files}")
    print(f"   修改文件数: {modified_files}")
    print(f"   备份位置: {backup_dir}")
    print()
    print("⚠️  请执行以下步骤验证:")
    print("   1. 运行 TypeScript 编译: npm run build")
    print("   2. 运行测试: npm test")
    print("   3. 检查 git diff 确认修改正确")
    print(f"   4. 如果有问题，恢复备份: rm -rf src && mv {backup_dir} src")
    print()

if __name__ == '__main__':
    main()
