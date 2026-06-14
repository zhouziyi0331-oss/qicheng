import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

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

export class FileProcessingService {
  private anthropic: Anthropic;
  private uploadDir: string;
  private maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    this.uploadDir = path.join(process.cwd(), 'uploads', 'pbl-projects');
    this.ensureUploadDir();
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error: unknown) {
      logger.error('Failed to create upload directory:', error);
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    projectId: string,
    file: {
      filename: string;
      content: Buffer;
      mimetype: string;
    },
    options?: {
      purpose?: string;
      aiAnalyze?: boolean;
    }
  ): Promise<FileUploadResult> {
    try {
      // 1. 验证文件大小
      if (file.content.length > this.maxFileSize) {
        throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
      }

      // 2. 确定文件类型
      const fileType = this.determineFileType(file.filename, file.mimetype);

      // 3. 生成唯一文件名
      const fileId = uuidv4();
      const ext = path.extname(file.filename);
      const savedFilename = `${fileId}${ext}`;
      const filePath = path.join(this.uploadDir, savedFilename);

      // 4. 保存文件
      await fs.writeFile(filePath, file.content);

      // 5. AI分析（如果需要）
      let aiAnalysis: FileAnalysis | undefined;
      if (options?.aiAnalyze !== false) {
        aiAnalysis = await this.analyzeFile(filePath, fileType, file.filename);
      }

      // 6. 保存到数据库
      const fileUrl = `/uploads/pbl-projects/${savedFilename}`;
      await this.saveFileRecord(
        projectId,
        fileId,
        file.filename,
        fileType,
        file.content.length,
        fileUrl,
        options?.purpose,
        aiAnalysis
      );

      return {
        fileId,
        filename: file.filename,
        fileType,
        fileSize: file.content.length,
        fileUrl,
        aiAnalysis
      };

    } catch (error: unknown) {
      logger.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * 确定文件类型
   */
  private determineFileType(filename: string, mimetype: string): string {
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
  private async analyzeFile(
    filePath: string,
    fileType: string,
    filename: string
  ): Promise<FileAnalysis> {
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
      } else if (fileType === 'document') {
        return await this.analyzeDocumentFile(truncatedContent, filename);
      } else if (fileType === 'data') {
        return await this.analyzeDataFile(truncatedContent, filename);
      }

      return {
        fileType,
        summary: '文件已上传',
        extractedText: truncatedContent.substring(0, 500)
      };

    } catch (error: unknown) {
      logger.error('File analysis error:', error);
      return {
        fileType,
        summary: '无法分析文件内容'
      };
    }
  }

  /**
   * 分析代码文件
   */
  private async analyzeCodeFile(
    content: string,
    filename: string
  ): Promise<FileAnalysis> {
    const ext = path.extname(filename).toLowerCase();
    const languageMap: Record<string, string> = {
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
    } catch (error: unknown) {
      logger.error('Code analysis error:', error);
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
  private async analyzeDocumentFile(
    content: string,
    filename: string
  ): Promise<FileAnalysis> {
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
    } catch (error: unknown) {
      logger.error('Document analysis error:', error);
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
  private async analyzeDataFile(
    content: string,
    filename: string
  ): Promise<FileAnalysis> {
    const ext = path.extname(filename).toLowerCase();

    let dataType = 'Unknown';
    if (ext === '.csv') dataType = 'CSV';
    else if (ext === '.json') dataType = 'JSON';
    else if (ext === '.xml') dataType = 'XML';

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
    } catch (error: unknown) {
      logger.error('Data analysis error:', error);
    }

    return {
      fileType: 'data',
      summary: `${dataType}数据文件`
    };
  }

  /**
   * 保存文件记录
   */
  private async saveFileRecord(
    projectId: string,
    fileId: string,
    filename: string,
    fileType: string,
    fileSize: number,
    fileUrl: string,
    purpose?: string,
    aiAnalysis?: FileAnalysis
  ): Promise<void> {
    await query(
      `INSERT INTO pbl_project_files
       (id, project_id, filename, file_type, file_size, file_url,
        purpose, ai_processed, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        fileId,
        projectId,
        filename,
        fileType,
        fileSize,
        fileUrl,
        purpose,
        aiAnalysis ? true : false,
        aiAnalysis ? JSON.stringify(aiAnalysis) : null
      ]
    );
  }

  /**
   * 获取项目文件列表
   */
  async getProjectFiles(
    projectId: string,
    fileType?: string
  ): Promise<any[]> {
    const condition = fileType
      ? 'WHERE project_id = $1 AND file_type = $2'
      : 'WHERE project_id = $1';

    const params = fileType ? [projectId, fileType] : [projectId];

    const result = await query(
      `SELECT id, filename, file_type, file_size, file_url,
              purpose, ai_processed, ai_analysis, created_at
       FROM pbl_project_files
       ${condition}
       ORDER BY created_at DESC`,
      params
    );

    return result;
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // 1. 获取文件信息
      const file = await queryOne(
        `SELECT file_url FROM pbl_project_files WHERE id = $1`,
        [fileId]
      );

      if (!file) {
        return false;
      }

      // 2. 删除物理文件
      const filename = path.basename(file.file_url);
      const filePath = path.join(this.uploadDir, filename);

      try {
        await fs.unlink(filePath);
      } catch (error: unknown) {
        logger.error('Failed to delete physical file:', error);
      }

      // 3. 删除数据库记录
      await query(
        `DELETE FROM pbl_project_files WHERE id = $1`,
        [fileId]
      );

      return true;

    } catch (error: unknown) {
      logger.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * 获取文件内容
   */
  async getFileContent(fileId: string): Promise<string | null> {
    try {
      const file = await queryOne(
        `SELECT file_url FROM pbl_project_files WHERE id = $1`,
        [fileId]
      );

      if (!file) {
        return null;
      }

      const filename = path.basename(file.file_url);
      const filePath = path.join(this.uploadDir, filename);

      const content = await fs.readFile(filePath, 'utf-8');
      return content;

    } catch (error: unknown) {
      logger.error('Failed to read file content:', error);
      return null;
    }
  }
}

export default new FileProcessingService();
