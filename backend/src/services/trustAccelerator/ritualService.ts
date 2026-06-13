/**
 * RitualService - 仪式感服务
 *
 * 核心功能：
 * 1. 生成启程证书图片
 * 2. 上传到OSS
 */

import { query, withTransaction } from '../../utils/db';
import { PoolClient } from 'pg';

export class RitualService {
  /**
   * 生成启程证书
   */
  static async generateCertificate(unlockRecordId: string): Promise<string> {
    try {
      // 获取解锁记录
      const result = await query<any>(
        `SELECT ur.*, u.nickname as student_name, cp.company_name,
                scm.completed_tasks, scm.total_earnings
         FROM unlock_records ur
         JOIN users u ON ur.student_id = u.id
         LEFT JOIN company_profiles cp ON ur.company_id = cp.user_id
         LEFT JOIN verify_sessions vs ON ur.session_id = vs.id
         LEFT JOIN student_company_matches scm ON vs.match_id = scm.id
         WHERE ur.id = $1`,
        [unlockRecordId]
      );

      if (result.length === 0) {
        throw new Error('解锁记录不存在');
      }

      const record = result[0];

      // 生成证书HTML
      const certificateHtml = this.generateCertificateHtml({
        studentName: record.student_name,
        companyName: record.company_name,
        completedTasks: record.completed_tasks,
        totalEarnings: record.total_earnings,
        unlockDate: new Date(record.created_at).toLocaleDateString('zh-CN')
      });

      // TODO: 使用Puppeteer渲染为图片并上传OSS
      // 目前返回占位URL
      const certificateUrl = `https://qicheng-oss.oss-cn-hangzhou.aliyuncs.com/certificates/${unlockRecordId}.png`;

      // 更新解锁记录
      await query(
        `UPDATE unlock_records
         SET certificate_url = $2
         WHERE id = $1`,
        [unlockRecordId, certificateUrl]
      );

      logger.info(`[RitualService] 生成证书: ${certificateUrl}`);

      return certificateUrl;
    } catch (error) {
      logger.error('[RitualService] 生成证书失败:', error);
      throw error;
    }
  }

  /**
   * 生成证书HTML模板
   */
  private static generateCertificateHtml(data: {
    studentName: string;
    companyName: string;
    completedTasks: number;
    totalEarnings: number;
    unlockDate: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 750px;
      height: 1334px;
      background: linear-gradient(135deg, #F5E6F0 0%, #FEFEFE 100%);
      font-family: 'PingFang SC', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .certificate {
      width: 100%;
      background: white;
      border-radius: 32px;
      padding: 80px 60px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      text-align: center;
    }
    .logo {
      font-size: 48px;
      font-weight: 900;
      color: #1A1A1A;
      margin-bottom: 20px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #1A1A1A;
      margin-bottom: 60px;
    }
    .content {
      font-size: 24px;
      line-height: 2;
      color: #333;
      margin-bottom: 60px;
    }
    .highlight {
      color: #FF6B35;
      font-weight: 700;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 60px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 48px;
      font-weight: 900;
      color: #FF6B35;
      margin-bottom: 10px;
    }
    .stat-label {
      font-size: 18px;
      color: #888;
    }
    .footer {
      font-size: 18px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="logo">启程</div>
    <div class="title">🎉 启程证书</div>
    <div class="content">
      恭喜 <span class="highlight">${data.studentName}</span><br>
      成功解锁与 <span class="highlight">${data.companyName}</span> 的深度合作机会
    </div>
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${data.completedTasks}</div>
        <div class="stat-label">完成任务</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">¥${data.totalEarnings}</div>
        <div class="stat-label">累计收入</div>
      </div>
    </div>
    <div class="footer">
      ${data.unlockDate}<br>
      乘着问题，飞跃山峰
    </div>
  </div>
</body>
</html>
    `;
  }
}
