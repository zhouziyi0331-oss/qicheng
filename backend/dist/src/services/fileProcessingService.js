"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessingService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class FileProcessingService {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
        this.uploadDir = path.join(process.cwd(), 'uploads', 'pbl-projects');
        this.ensureUploadDir();
    }
    /**
     * 确保上传目录存在
     */
    async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
        catch (error) {
            logger_1.default.error('Failed to create upload directory:', error);
        }
    }
    /**
     * 上传文件
     */
    async uploadFile(projectId, file, options) {
        try {
            // 1. 验证文件大小
            if (file.content.length > this.maxFileSize) {
                throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
            }
            // 2. 确定文件类型
            const fileType = this.determineFileType(file.filename, file.mimetype);
            // 3. 生成唯一文件名
            const fileId = (0, uuid_1.v4)();
            const ext = path.extname(file.filename);
            const savedFilename = `${fileId}${ext}`;
            const filePath = path.join(this.uploadDir, savedFilename);
            // 4. 保存文件
            await fs.writeFile(filePath, file.content);
            // 5. AI分析（如果需要）
            let aiAnalysis;
            if (options?.aiAnalyze !== false) {
                aiAnalysis = await this.analyzeFile(filePath, fileType, file.filename);
            }
            // 6. 保存到数据库
            const fileUrl = `/uploads/pbl-projects/${savedFilename}`;
            await this.saveFileRecord(projectId, fileId, file.filename, fileType, file.content.length, fileUrl, options?.purpose, aiAnalysis);
            return {
                fileId,
                filename: file.filename,
                fileType,
                fileSize: file.content.length,
                fileUrl,
                aiAnalysis
            };
        }
        catch (error) {
            logger_1.default.error('File upload error:', error);
            throw error;
        }
    }
    /**
     * 确定文件类型
     */
    determineFileType(filename, mimetype) {
        const ext = path.extname(filename).toLowerCase();
        // 代码文件
        const codeExtensions = [
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c',
            '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.sql'
        ];
        if (codeExtensions.includes(ext)) {
            return 'code';
        }
        // 文档文件
        const docExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
        if (docExtensions.includes(ext)) {
            return 'document';
        }
        // 数据文件
        const dataExtensions = ['.csv', '.json', '.xml', '.xlsx', '.xls'];
        if (dataExtensions.includes(ext)) {
            return 'data';
        }
        // 图片文件
        if (mimetype.startsWith('image/')) {
            return 'image';
        }
        return 'other';
    }
    /**
     * AI分析文件
     */
    async analyzeFile(filePath, fileType, filename) {
        try {
            // 读取文件内容
            const content = await fs.readFile(filePath, 'utf-8');
            // 限制内容长度
            const maxLength = 50000; // 约50KB
            const truncatedContent = content.length > maxLength
                ? content.substring(0, maxLength) + '\n\n[内容已截断...]'
                : content;
            // 根据文件类型选择分析策略
            if (fileType === 'code') {
                return await this.analyzeCodeFile(truncatedContent, filename);
            }
            else if (fileType === 'document') {
                return await this.analyzeDocumentFile(truncatedContent, filename);
            }
            else if (fileType === 'data') {
                return await this.analyzeDataFile(truncatedContent, filename);
            }
            return {
                fileType,
                summary: '文件已上传',
                extractedText: truncatedContent.substring(0, 500)
            };
        }
        catch (error) {
            logger_1.default.error('File analysis error:', error);
            return {
                fileType,
                summary: '无法分析文件内容'
            };
        }
    }
    /**
     * 分析代码文件
     */
    async analyzeCodeFile(content, filename) {
        const ext = path.extname(filename).toLowerCase();
        const languageMap = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React JSX',
            '.tsx': 'React TSX',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.go': 'Go',
            '.rs': 'Rust',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.sql': 'SQL'
        };
        const language = languageMap[ext] || 'Unknown';
        const prompt = `分析这段${language}代码：

\`\`\`${ext.substring(1)}
${content}
\`\`\`

请以JSON格式返回：
{
  "summary": "代码功能简述（1-2句话）",
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}

注意：
- 用温暖、友好的语气
- 问题要具体、可操作
- 建议要实用、易懂`;
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            });
            const responseContent = response.content[0];
            if (responseContent.type === 'text') {
                const analysis = JSON.parse(responseContent.text);
                return {
                    fileType: 'code',
                    language,
                    summary: analysis.summary,
                    issues: analysis.issues,
                    suggestions: analysis.suggestions
                };
            }
        }
        catch (error) {
            logger_1.default.error('Code analysis error:', error);
        }
        return {
            fileType: 'code',
            language,
            summary: `${language}代码文件`
        };
    }
    /**
     * 分析文档文件
     */
    async analyzeDocumentFile(content, filename) {
        const prompt = `分析这个文档内容：

${content}

请以JSON格式返回：
{
  "summary": "文档主要内容（2-3句话）",
  "keyPoints": ["要点1", "要点2", "要点3"]
}`;
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            });
            const responseContent = response.content[0];
            if (responseContent.type === 'text') {
                const analysis = JSON.parse(responseContent.text);
                return {
                    fileType: 'document',
                    summary: analysis.summary,
                    suggestions: analysis.keyPoints,
                    extractedText: content.substring(0, 1000)
                };
            }
        }
        catch (error) {
            logger_1.default.error('Document analysis error:', error);
        }
        return {
            fileType: 'document',
            summary: '文档文件',
            extractedText: content.substring(0, 1000)
        };
    }
    /**
     * 分析数据文件
     */
    async analyzeDataFile(content, filename) {
        const ext = path.extname(filename).toLowerCase();
        let dataType = 'Unknown';
        if (ext === '.csv')
            dataType = 'CSV';
        else if (ext === '.json')
            dataType = 'JSON';
        else if (ext === '.xml')
            dataType = 'XML';
        const prompt = `分析这个${dataType}数据文件：

${content.substring(0, 2000)}

请以JSON格式返回：
{
  "summary": "数据内容简述",
  "structure": "数据结构描述",
  "suggestions": ["使用建议1", "使用建议2"]
}`;
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            });
            const responseContent = response.content[0];
            if (responseContent.type === 'text') {
                const analysis = JSON.parse(responseContent.text);
                return {
                    fileType: 'data',
                    summary: analysis.summary,
                    suggestions: analysis.suggestions
                };
            }
        }
        catch (error) {
            logger_1.default.error('Data analysis error:', error);
        }
        return {
            fileType: 'data',
            summary: `${dataType}数据文件`
        };
    }
    /**
     * 保存文件记录
     */
    async saveFileRecord(projectId, fileId, filename, fileType, fileSize, fileUrl, purpose, aiAnalysis) {
        await (0, db_1.query)(`INSERT INTO pbl_project_files
       (id, project_id, filename, file_type, file_size, file_url,
        purpose, ai_processed, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            fileId,
            projectId,
            filename,
            fileType,
            fileSize,
            fileUrl,
            purpose,
            aiAnalysis ? true : false,
            aiAnalysis ? JSON.stringify(aiAnalysis) : null
        ]);
    }
    /**
     * 获取项目文件列表
     */
    async getProjectFiles(projectId, fileType) {
        const condition = fileType
            ? 'WHERE project_id = $1 AND file_type = $2'
            : 'WHERE project_id = $1';
        const params = fileType ? [projectId, fileType] : [projectId];
        const result = await (0, db_1.query)(`SELECT id, filename, file_type, file_size, file_url,
              purpose, ai_processed, ai_analysis, created_at
       FROM pbl_project_files
       ${condition}
       ORDER BY created_at DESC`, params);
        return result.rows;
    }
    /**
     * 删除文件
     */
    async deleteFile(fileId) {
        try {
            // 1. 获取文件信息
            const file = await (0, db_1.queryOne)(`SELECT file_url FROM pbl_project_files WHERE id = $1`, [fileId]);
            if (!file) {
                return false;
            }
            // 2. 删除物理文件
            const filename = path.basename(file.file_url);
            const filePath = path.join(this.uploadDir, filename);
            try {
                await fs.unlink(filePath);
            }
            catch (error) {
                logger_1.default.error('Failed to delete physical file:', error);
            }
            // 3. 删除数据库记录
            await (0, db_1.query)(`DELETE FROM pbl_project_files WHERE id = $1`, [fileId]);
            return true;
        }
        catch (error) {
            logger_1.default.error('File deletion error:', error);
            return false;
        }
    }
    /**
     * 获取文件内容
     */
    async getFileContent(fileId) {
        try {
            const file = await (0, db_1.queryOne)(`SELECT file_url FROM pbl_project_files WHERE id = $1`, [fileId]);
            if (!file) {
                return null;
            }
            const filename = path.basename(file.file_url);
            const filePath = path.join(this.uploadDir, filename);
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        }
        catch (error) {
            logger_1.default.error('Failed to read file content:', error);
            return null;
        }
    }
}
exports.FileProcessingService = FileProcessingService;
exports.default = new FileProcessingService();
//# sourceMappingURL=fileProcessingService.js.map