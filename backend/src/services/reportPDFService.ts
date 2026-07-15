/**
 * Phase R5.4: PDF报告导出服务
 * 使用Puppeteer生成精美的PDF报告
 */

import puppeteer from 'puppeteer';
import logger from '../utils/logger';
import { queryOne } from '../utils/db';

interface PDFExportOptions {
  studentId: string;
  reportId: string;
  includeCharts?: boolean;
  format?: 'A4' | 'Letter';
}

class ReportPDFService {
  /**
   * 导出报告为PDF
   */
  async exportReportToPDF(options: PDFExportOptions): Promise<Buffer> {
    const { studentId, reportId, includeCharts = true, format = 'A4' } = options;

    try {
      logger.info('[PDF导出] 开始生成PDF', { studentId, reportId });

      // 1. 获取报告数据
      const report = await queryOne<any>(
        `SELECT sr.*, u.nickname, u.avatar_url
         FROM student_reports sr
         JOIN users u ON sr.student_id = u.id
         WHERE sr.id = $1 AND sr.student_id = $2`,
        [reportId, studentId]
      );

      if (!report) {
        throw new Error('报告不存在');
      }

      // 2. 生成HTML内容
      const html = this.generateReportHTML(report, includeCharts);

      // 3. 使用Puppeteer生成PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format,
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await browser.close();

      logger.info('[PDF导出] PDF生成完成', {
        studentId,
        reportId,
        size: pdfBuffer.length
      });

      return pdfBuffer;

    } catch (error) {
      logger.error('[PDF导出] 生成失败', { error, studentId, reportId });
      throw error;
    }
  }

  /**
   * 生成报告HTML模板
   */
  private generateReportHTML(report: any, includeCharts: boolean): string {
    const reportData = report.report_data;
    const generatedDate = new Date(report.generated_at).toLocaleDateString('zh-CN');

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>启程平台 - 学生能力报告</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    /* 头部 */
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #4F46E5;
    }

    .header h1 {
      font-size: 32px;
      color: #4F46E5;
      margin-bottom: 10px;
    }

    .header .subtitle {
      font-size: 16px;
      color: #666;
    }

    /* 学生信息 */
    .student-info {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    .student-info img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-right: 20px;
    }

    .student-info .info {
      flex: 1;
    }

    .student-info .name {
      font-size: 24px;
      font-weight: bold;
      color: #111;
      margin-bottom: 5px;
    }

    .student-info .meta {
      font-size: 14px;
      color: #666;
    }

    /* 概览卡片 */
    .summary-section {
      margin-bottom: 30px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .summary-card {
      padding: 20px;
      background: #F9FAFB;
      border-radius: 8px;
      text-align: center;
    }

    .summary-card .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }

    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #4F46E5;
    }

    .summary-card .unit {
      font-size: 14px;
      color: #999;
    }

    /* 章节 */
    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #111;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E5E7EB;
    }

    /* 优势列表 */
    .strengths-list {
      list-style: none;
    }

    .strengths-list li {
      padding: 10px 15px;
      margin-bottom: 10px;
      background: #EEF2FF;
      border-left: 4px solid #4F46E5;
      border-radius: 4px;
    }

    /* 建议列表 */
    .recommendations-list {
      list-style: none;
    }

    .recommendations-list li {
      padding: 10px 15px;
      margin-bottom: 10px;
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      border-radius: 4px;
    }

    /* 里程碑 */
    .milestones {
      position: relative;
      padding-left: 30px;
    }

    .milestone-item {
      position: relative;
      margin-bottom: 20px;
      padding-left: 20px;
    }

    .milestone-item::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 6px;
      width: 12px;
      height: 12px;
      background: #4F46E5;
      border-radius: 50%;
    }

    .milestone-item::after {
      content: '';
      position: absolute;
      left: -18px;
      top: 18px;
      width: 2px;
      height: calc(100% + 20px);
      background: #E5E7EB;
    }

    .milestone-item:last-child::after {
      display: none;
    }

    .milestone-date {
      font-size: 12px;
      color: #999;
    }

    .milestone-title {
      font-size: 16px;
      font-weight: bold;
      color: #111;
      margin: 5px 0;
    }

    .milestone-desc {
      font-size: 14px;
      color: #666;
    }

    /* 页脚 */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 12px;
      color: #999;
    }

    /* 打印优化 */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <h1>启程平台 学生能力报告</h1>
      <div class="subtitle">Student Growth Report</div>
    </div>

    <!-- 学生信息 -->
    <div class="student-info">
      <img src="${report.avatar_url || 'https://via.placeholder.com/80'}" alt="头像" />
      <div class="info">
        <div class="name">${report.nickname || '学生'}</div>
        <div class="meta">
          报告生成日期：${generatedDate} |
          报告类型：${this.getReportTypeLabel(report.report_type)}
        </div>
      </div>
    </div>

    <!-- 概览 -->
    <div class="summary-section">
      <h2 class="section-title">📊 能力概览</h2>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="label">完成任务</div>
          <div class="value">${reportData.summary?.totalTasks || 0}</div>
          <div class="unit">个</div>
        </div>
        <div class="summary-card">
          <div class="label">平均质量分</div>
          <div class="value">${(reportData.summary?.averageQuality || 0).toFixed(1)}</div>
          <div class="unit">分</div>
        </div>
        <div class="summary-card">
          <div class="label">完成率</div>
          <div class="value">${(reportData.summary?.completionRate || 0).toFixed(0)}</div>
          <div class="unit">%</div>
        </div>
      </div>
    </div>

    <!-- 优势 -->
    ${reportData.skillProfile?.strengths?.length > 0 ? `
    <div class="section">
      <h2 class="section-title">💪 核心优势</h2>
      <ul class="strengths-list">
        ${reportData.skillProfile.strengths.map((s: string) => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- 建议 -->
    ${reportData.skillProfile?.recommendations?.length > 0 ? `
    <div class="section">
      <h2 class="section-title">💡 成长建议</h2>
      <ul class="recommendations-list">
        ${reportData.skillProfile.recommendations.map((r: string) => `<li>${r}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- 里程碑 -->
    ${reportData.milestones?.length > 0 ? `
    <div class="section">
      <h2 class="section-title">🏆 成长里程碑</h2>
      <div class="milestones">
        ${reportData.milestones.slice(0, 10).map((m: any) => `
        <div class="milestone-item">
          <div class="milestone-date">${new Date(m.date).toLocaleDateString('zh-CN')}</div>
          <div class="milestone-title">${m.type}</div>
          <div class="milestone-desc">${m.description}</div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 导师评价 -->
    ${reportData.mentorInsights ? `
    <div class="section">
      <h2 class="section-title">🎓 导师评价</h2>
      <p style="padding: 15px; background: #F9FAFB; border-radius: 8px; line-height: 1.8;">
        ${reportData.mentorInsights}
      </p>
    </div>
    ` : ''}

    <!-- 页脚 -->
    <div class="footer">
      <p>本报告由启程平台AI智能生成</p>
      <p>© 2026 启程平台 Qicheng Platform - 让每个学生找到自己的赛道</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * 获取报告类型标签
   */
  private getReportTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      comprehensive: '综合报告',
      summary: '摘要报告',
      growth: '成长报告'
    };
    return labels[type] || '能力报告';
  }
}

export const reportPDFService = new ReportPDFService();
export default reportPDFService;
