/**
 * Phase R5.4: PDF报告导出服务
 * 使用Puppeteer生成精美的PDF报告
 */
interface PDFExportOptions {
    studentId: string;
    reportId: string;
    includeCharts?: boolean;
    format?: 'A4' | 'Letter';
}
declare class ReportPDFService {
    /**
     * 导出报告为PDF
     */
    exportReportToPDF(options: PDFExportOptions): Promise<Buffer>;
    /**
     * 生成报告HTML模板
     */
    private generateReportHTML;
    /**
     * 获取报告类型标签
     */
    private getReportTypeLabel;
}
export declare const reportPDFService: ReportPDFService;
export default reportPDFService;
//# sourceMappingURL=reportPDFService.d.ts.map