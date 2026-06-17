#!/bin/bash

###############################################################################
# 启程项目数据库自动备份脚本
#
# 功能：
# 1. 导出PostgreSQL数据库
# 2. 压缩备份文件
# 3. 可选：上传到阿里云OSS
# 4. 自动清理过期备份（保留30天）
#
# 使用方法：
# 1. 修改配置部分的变量
# 2. 赋予执行权限：chmod +x backup-db.sh
# 3. 测试执行：./backup-db.sh
# 4. 配置cron：crontab -e
#    添加：0 3 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
###############################################################################

set -e  # 遇到错误立即退出

###############################################################################
# 配置部分 - 请根据实际情况修改
###############################################################################

# 数据库配置
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="qicheng"
DB_USER="postgres"
# DB_PASSWORD 从环境变量读取，或在此设置
# export PGPASSWORD="your-password"

# 备份目录
BACKUP_DIR="/data/backups/postgres"
LOG_FILE="/var/log/db-backup.log"

# 备份保留天数
RETENTION_DAYS=30

# 是否上传到OSS（true/false）
UPLOAD_TO_OSS=false
OSS_BUCKET="oss://qicheng-backup"
OSS_PATH="db"

# 是否加密备份（true/false）
ENCRYPT_BACKUP=false
GPG_RECIPIENT="qicheng@backup"  # GPG密钥ID

###############################################################################
# 脚本开始 - 无需修改
###############################################################################

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}"
}

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/qicheng_${DATE}.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

log_info "开始数据库备份..."
log_info "数据库: $DB_NAME"
log_info "备份文件: $BACKUP_FILE_GZ"

# 检查磁盘空间
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # 少于1GB
    log_warn "磁盘空间不足 1GB，可用空间: ${AVAILABLE_SPACE}KB"
fi

# 导出数据库
log_info "正在导出数据库..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists \
    -f "$BACKUP_FILE"; then
    log_info "✅ 数据库导出成功"
else
    log_error "❌ 数据库导出失败"
    exit 1
fi

# 压缩备份文件
log_info "正在压缩备份文件..."
if gzip -9 "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    log_info "✅ 压缩完成，文件大小: $BACKUP_SIZE"
else
    log_error "❌ 压缩失败"
    exit 1
fi

# 加密备份（可选）
if [ "$ENCRYPT_BACKUP" = true ]; then
    log_info "正在加密备份文件..."
    if gpg --encrypt --recipient "$GPG_RECIPIENT" "$BACKUP_FILE_GZ"; then
        ENCRYPTED_FILE="${BACKUP_FILE_GZ}.gpg"
        rm "$BACKUP_FILE_GZ"  # 删除未加密文件
        BACKUP_FILE_GZ="$ENCRYPTED_FILE"
        log_info "✅ 加密完成"
    else
        log_error "❌ 加密失败"
        exit 1
    fi
fi

# 上传到OSS（可选）
if [ "$UPLOAD_TO_OSS" = true ]; then
    log_info "正在上传到OSS..."
    if command -v ossutil >/dev/null 2>&1; then
        OSS_DEST="$OSS_BUCKET/$OSS_PATH/$(basename $BACKUP_FILE_GZ)"
        if ossutil cp "$BACKUP_FILE_GZ" "$OSS_DEST" --force; then
            log_info "✅ 上传到OSS成功: $OSS_DEST"
        else
            log_error "❌ 上传到OSS失败"
        fi
    else
        log_warn "⚠️  未安装ossutil，跳过OSS上传"
    fi
fi

# 清理过期备份
log_info "正在清理${RETENTION_DAYS}天前的备份..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "qicheng_*.sql.gz*" -mtime +${RETENTION_DAYS} -type f -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log_info "✅ 已删除 $DELETED_COUNT 个过期备份"
else
    log_info "没有过期备份需要删除"
fi

# 清理OSS过期备份（可选）
if [ "$UPLOAD_TO_OSS" = true ] && command -v ossutil >/dev/null 2>&1; then
    log_info "正在清理OSS过期备份..."
    OLD_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
    ossutil ls "$OSS_BUCKET/$OSS_PATH/" | grep "qicheng_" | while read -r line; do
        FILE_DATE=$(echo "$line" | grep -oP '\d{8}' | head -1)
        if [ "$FILE_DATE" -lt "$OLD_DATE" ]; then
            FILE_PATH=$(echo "$line" | awk '{print $NF}')
            ossutil rm "$FILE_PATH" --force
            log_info "删除OSS过期备份: $FILE_PATH"
        fi
    done
fi

# 备份统计
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/qicheng_*.sql.gz* 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log_info ""
log_info "=========================================="
log_info "备份完成统计："
log_info "  ✅ 最新备份: $(basename $BACKUP_FILE_GZ)"
log_info "  📊 本地备份数: $BACKUP_COUNT"
log_info "  💾 占用空间: $TOTAL_SIZE"
log_info "  📅 保留天数: $RETENTION_DAYS 天"
log_info "=========================================="
log_info ""

# 验证备份完整性（可选）
log_info "验证备份完整性..."
if gzip -t "$BACKUP_FILE_GZ" 2>/dev/null; then
    log_info "✅ 备份文件完整性验证通过"
else
    log_error "❌ 备份文件可能已损坏！"
    exit 1
fi

log_info "✅ 数据库备份流程全部完成！"

# 发送通知（可选）
# 可以集成企业微信/钉钉机器人通知
# curl -X POST "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" \
#   -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"数据库备份完成: $(basename $BACKUP_FILE_GZ)\"}}"

exit 0
