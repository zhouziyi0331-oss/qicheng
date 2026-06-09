import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../utils/logger';

interface CustomizedAnalysis {
  strengthAnalysis: string;
  futurePossibilities: Array<{
    title: string;
    description: string;
    marketSize: string;
    difficulty: string;
    actionPlan: string;
  }>;
  painPointAnalysis: string;
  targetMarket: string;
  acquisitionStrategy: string;
  productServiceIdeas: Array<{
    title: string;
    description: string;
    mvp: string;
    timeline: string;
    budget: string;
  }>;
  firstSteps: string[];
  diyPath: {
    title: string;
    steps: Array<{
      step: string;
      description: string;
      resources: string[];
      estimatedTime: string;
    }>;
    totalCost: string;
    difficulty: string;
  };
  agencyPath: {
    title: string;
    services: Array<{
      service: string;
      description: string;
      estimatedCost: string;
      providers: string[];
    }>;
    totalCost: string;
    advantages: string[];
  };
}

interface StartupGuide {
  title: string;
  content: string;
}

interface ReportContent {
  customizedAnalysis: CustomizedAnalysis;
  startupGuides: StartupGuide[];
  generatedAt: string;
  version: string;
}

/**
 * PDF生成服务
 */
export class PDFGeneratorService {
  /**
   * 生成创业报告PDF
   */
  static async generateStartupReportPDF(
    reportContent: ReportContent,
    userName: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        const stream = new PassThrough();

        stream.on('data', (chunk) => buffers.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buffers)));
        stream.on('error', reject);

        doc.pipe(stream);

        // 注册中文字体（使用系统字体）
        const fontPath = '/System/Library/Fonts/PingFang.ttc';
        doc.registerFont('PingFang', fontPath);
        doc.font('PingFang');

        // 封面
        this.addCoverPage(doc, userName);

        // 目录
        this.addTableOfContents(doc);

        // 第一部分：定制化分析
        this.addCustomizedAnalysis(doc, reportContent.customizedAnalysis);

        // 第二部分：通用创业指南
        this.addStartupGuides(doc, reportContent.startupGuides);

        // 页脚
        this.addPageNumbers(doc);

        doc.end();
      } catch (error) {
        logger.error('PDF生成失败', { error: (error as Error).message });
        reject(error);
      }
    });
  }

  /**
   * 添加封面
   */
  private static addCoverPage(doc: PDFKit.PDFDocument, userName: string) {
    doc.fontSize(32).fillColor('#FF6B9D').text('创业综合报告', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(18).fillColor('#333').text(`专属于：${userName}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#666').text('启程平台出品', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(new Date().toLocaleDateString('zh-CN'), { align: 'center' });
    doc.addPage();
  }

  /**
   * 添加目录
   */
  private static addTableOfContents(doc: PDFKit.PDFDocument) {
    doc.fontSize(24).fillColor('#FF6B9D').text('目录', { underline: true });
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#333');
    doc.text('第一部分：定制化分析', { indent: 20 });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666');
    doc.text('1. 能力优势分析', { indent: 40 });
    doc.text('2. 创业方向建议', { indent: 40 });
    doc.text('3. 痛点与市场分析', { indent: 40 });
    doc.text('4. 产品服务方案', { indent: 40 });
    doc.text('5. 行动计划', { indent: 40 });
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#333');
    doc.text('第二部分：创业实操指南', { indent: 20 });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666');
    doc.text('1. 自己跑通路径（DIY）', { indent: 40 });
    doc.text('2. 代办服务路径', { indent: 40 });
    doc.text('3. 通用创业指南', { indent: 40 });
    doc.addPage();
  }

  /**
   * 添加定制化分析
   */
  private static addCustomizedAnalysis(
    doc: PDFKit.PDFDocument,
    analysis: CustomizedAnalysis
  ) {
    // 标题
    doc.fontSize(24).fillColor('#FF6B9D').text('第一部分：定制化分析', { underline: true });
    doc.moveDown(2);

    // 1. 能力优势分析
    this.addSection(doc, '1. 能力优势分析', analysis.strengthAnalysis);

    // 2. 创业方向建议
    doc.addPage();
    doc.fontSize(18).fillColor('#FF6B9D').text('2. 创业方向建议');
    doc.moveDown(1);
    analysis.futurePossibilities.forEach((possibility, index) => {
      doc.fontSize(14).fillColor('#333').text(`方向${index + 1}：${possibility.title}`);
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#666');
      doc.text(possibility.description);
      doc.moveDown(0.3);
      doc.text(`市场规模：${possibility.marketSize}`);
      doc.text(`难度评级：${possibility.difficulty}`);
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#333').text('行动计划：');
      doc.fontSize(10).fillColor('#666').text(possibility.actionPlan, { indent: 20 });
      doc.moveDown(1);
    });

    // 3. 痛点与市场分析
    doc.addPage();
    this.addSection(doc, '3. 痛点分析', analysis.painPointAnalysis);
    doc.moveDown(1);
    this.addSection(doc, '4. 目标市场', analysis.targetMarket);
    doc.moveDown(1);
    this.addSection(doc, '5. 获客策略', analysis.acquisitionStrategy);

    // 4. 产品服务方案
    doc.addPage();
    doc.fontSize(18).fillColor('#FF6B9D').text('6. 产品服务方案');
    doc.moveDown(1);
    analysis.productServiceIdeas.forEach((idea, index) => {
      doc.fontSize(14).fillColor('#333').text(`方案${index + 1}：${idea.title}`);
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#666');
      doc.text(idea.description);
      doc.moveDown(0.3);
      doc.text(`MVP建议：${idea.mvp}`);
      doc.text(`时间线：${idea.timeline}`);
      doc.text(`预算：${idea.budget}`);
      doc.moveDown(1);
    });

    // 5. 行动计划
    doc.addPage();
    doc.fontSize(18).fillColor('#FF6B9D').text('7. 首要行动步骤');
    doc.moveDown(1);
    analysis.firstSteps.forEach((step, index) => {
      doc.fontSize(11).fillColor('#333').text(`${index + 1}. ${step}`);
      doc.moveDown(0.5);
    });

    // 6. DIY路径
    doc.addPage();
    doc.fontSize(20).fillColor('#FF6B9D').text(analysis.diyPath.title);
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#666');
    doc.text(`总成本：${analysis.diyPath.totalCost}`);
    doc.text(`难度：${analysis.diyPath.difficulty}`);
    doc.moveDown(1);
    analysis.diyPath.steps.forEach((step, index) => {
      doc.fontSize(13).fillColor('#333').text(step.step);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#666').text(step.description);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#999').text(`预计时间：${step.estimatedTime}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text('参考资源：');
      step.resources.forEach((resource) => {
        doc.fontSize(9).fillColor('#666').text(`• ${resource}`, { indent: 20 });
      });
      doc.moveDown(1);
      if (index < analysis.diyPath.steps.length - 1 && doc.y > 650) {
        doc.addPage();
      }
    });

    // 7. 代办路径
    doc.addPage();
    doc.fontSize(20).fillColor('#FF6B9D').text(analysis.agencyPath.title);
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#666');
    doc.text(`总成本：${analysis.agencyPath.totalCost}`);
    doc.moveDown(1);
    analysis.agencyPath.services.forEach((service, index) => {
      doc.fontSize(13).fillColor('#333').text(`${index + 1}. ${service.service}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#666').text(service.description);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#999').text(`预估费用：${service.estimatedCost}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text('推荐服务商：');
      service.providers.forEach((provider) => {
        doc.fontSize(9).fillColor('#666').text(`• ${provider}`, { indent: 20 });
      });
      doc.moveDown(1);
    });
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#333').text('代办优势：');
    doc.moveDown(0.5);
    analysis.agencyPath.advantages.forEach((advantage) => {
      doc.fontSize(10).fillColor('#666').text(`✓ ${advantage}`);
      doc.moveDown(0.3);
    });
  }

  /**
   * 添加通用创业指南
   */
  private static addStartupGuides(doc: PDFKit.PDFDocument, guides: StartupGuide[]) {
    doc.addPage();
    doc.fontSize(24).fillColor('#FF6B9D').text('第二部分：通用创业指南', { underline: true });
    doc.moveDown(2);

    guides.forEach((guide, index) => {
      if (index > 0) doc.addPage();
      this.addSection(doc, `${index + 1}. ${guide.title}`, guide.content);
    });
  }

  /**
   * 添加章节
   */
  private static addSection(doc: PDFKit.PDFDocument, title: string, content: string) {
    doc.fontSize(18).fillColor('#FF6B9D').text(title);
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#666').text(content, { align: 'left', lineGap: 3 });
    doc.moveDown(1);
  }

  /**
   * 添加页码
   */
  private static addPageNumbers(doc: PDFKit.PDFDocument) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).fillColor('#999');
      doc.text(
        `第 ${i + 1} 页 / 共 ${pages.count} 页`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
    }
  }
}
