/**
 * 文件上传与处理服务
 *
 * 功能：
 * 1. 文件上传管理
 * 2. AI分析文件内容
 * 3. 代码文件分析
 * 4. 文档提取
 * 5. 图片OCR（可选）
 */
interface FileUploadResult {
    fileId: string;
    filename: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    aiAnalysis?: FileAnalysis;
}
interface FileAnalysis {
    fileType: string;
    language?: string;
    summary: string;
    issues?: string[];
    suggestions?: string[];
    extractedText?: string;
}
export declare class FileProcessingService {
    private anthropic;
    private uploadDir;
    private maxFileSize;
    constructor();
    /**
     * 确保上传目录存在
     */
    private ensureUploadDir;
    /**
     * 上传文件
     */
    uploadFile(projectId: string, file: {
        filename: string;
        content: Buffer;
        mimetype: string;
    }, options?: {
        purpose?: string;
        aiAnalyze?: boolean;
    }): Promise<FileUploadResult>;
    /**
     * 确定文件类型
     */
    private determineFileType;
    /**
     * AI分析文件
     */
    private analyzeFile;
    /**
     * 分析代码文件
     */
    private analyzeCodeFile;
    /**
     * 分析文档文件
     */
    private analyzeDocumentFile;
    /**
     * 分析数据文件
     */
    private analyzeDataFile;
    /**
     * 保存文件记录
     */
    private saveFileRecord;
    /**
     * 获取项目文件列表
     */
    getProjectFiles(projectId: string, fileType?: string): Promise<any[]>;
    /**
     * 删除文件
     */
    deleteFile(fileId: string): Promise<boolean>;
    /**
     * 获取文件内容
     */
    getFileContent(fileId: string): Promise<string | null>;
}
declare const _default: FileProcessingService;
export default _default;
//# sourceMappingURL=fileProcessingService.d.ts.map