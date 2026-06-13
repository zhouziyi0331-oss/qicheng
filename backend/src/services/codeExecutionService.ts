import { query, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

/**
 * 代码执行沙箱服务
 *
 * 功能：
 * 1. 安全的代码执行环境
 * 2. 支持多种语言（Python, JavaScript, SQL等）
 * 3. 超时控制
 * 4. 资源限制
 * 5. 执行记录
 *
 * 注意：生产环境建议使用Docker容器或E2B等专业沙箱服务
 */

interface ExecutionResult {
  status: 'success' | 'error' | 'timeout';
  output: string;
  errorMessage?: string;
  executionTime: number;
}

interface CodeExecutionOptions {
  timeout?: number; // 毫秒
  workingDir?: string;
  env?: Record<string, string>;
}

export class CodeExecutionService {
  private tempDir: string;
  private defaultTimeout = 30000; // 30秒
  private maxTimeout = 120000; // 2分钟

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'code-execution');
    this.ensureTempDir();
  }

  /**
   * 确保临时目录存在
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error: unknown) {
      logger.error('Failed to create temp directory:', error);
    }
  }

  /**
   * 执行代码
   */
  async executeCode(
    projectId: string,
    language: string,
    code: string,
    options?: CodeExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = uuidv4();

    try {
      // 1. 验证语言支持
      if (!this.isSupportedLanguage(language)) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // 2. 创建临时文件
      const filePath = await this.createTempFile(executionId, language, code);

      // 3. 执行代码
      const timeout = Math.min(
        options?.timeout || this.defaultTimeout,
        this.maxTimeout
      );

      const result = await this.runCode(language, filePath, timeout, options);

      // 4. 清理临时文件
      await this.cleanupTempFile(filePath);

      // 5. 记录执行结果
      const executionTime = Date.now() - startTime;
      await this.saveExecutionRecord(projectId, language, code, {
        ...result,
        executionTime
      });

      return {
        ...result,
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorResult: ExecutionResult = {
        status: 'error',
        output: '',
        errorMessage: error.message,
        executionTime
      };

      await this.saveExecutionRecord(projectId, language, code, errorResult);

      return errorResult;
    }
  }

  /**
   * 检查语言是否支持
   */
  private isSupportedLanguage(language: string): boolean {
    const supported = ['python', 'javascript', 'node', 'sql', 'bash', 'shell'];
    return supported.includes(language.toLowerCase());
  }

  /**
   * 创建临时文件
   */
  private async createTempFile(
    executionId: string,
    language: string,
    code: string
  ): Promise<string> {
    const extensions: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      node: 'js',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh'
    };

    const ext = extensions[language.toLowerCase()] || 'txt';
    const filename = `${executionId}.${ext}`;
    const filePath = path.join(this.tempDir, filename);

    await fs.writeFile(filePath, code, 'utf-8');

    return filePath;
  }

  /**
   * 运行代码
   */
  private async runCode(
    language: string,
    filePath: string,
    timeout: number,
    options?: CodeExecutionOptions
  ): Promise<Omit<ExecutionResult, 'executionTime'>> {
    const commands: Record<string, string> = {
      python: `python3 "${filePath}"`,
      javascript: `node "${filePath}"`,
      node: `node "${filePath}"`,
      bash: `bash "${filePath}"`,
      shell: `bash "${filePath}"`,
      sql: `echo "SQL execution not implemented"`
    };

    const command = commands[language.toLowerCase()];

    if (!command) {
      throw new Error(`No execution command for language: ${language}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd: options?.workingDir || this.tempDir,
        env: { ...process.env, ...options?.env },
        maxBuffer: 1024 * 1024 // 1MB
      });

      return {
        status: 'success',
        output: stdout || stderr,
        errorMessage: stderr ? stderr : undefined
      };

    } catch (error: any) {
      if (error.killed && error.signal === 'SIGTERM') {
        return {
          status: 'timeout',
          output: '',
          errorMessage: `Execution timeout after ${timeout}ms`
        };
      }

      return {
        status: 'error',
        output: error.stdout || '',
        errorMessage: error.stderr || error.message
      };
    }
  }

  /**
   * 清理临时文件
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      logger.error('Failed to cleanup temp file:', error);
    }
  }

  /**
   * 保存执行记录
   */
  private async saveExecutionRecord(
    projectId: string,
    language: string,
    code: string,
    result: ExecutionResult
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO pbl_code_executions
         (project_id, language, code, status, output, error_message, execution_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          projectId,
          language,
          code,
          result.status,
          result.output,
          result.errorMessage,
          result.executionTime
        ]
      );
    } catch (error: unknown) {
      logger.error('Failed to save execution record:', error);
    }
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(
    projectId: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await query(
      `SELECT id, language, code, status, output, error_message,
              execution_time, created_at
       FROM pbl_code_executions
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [projectId, limit]
    );

    return result.rows;
  }

  /**
   * 安装Python包（仅用于开发环境）
   */
  async installPythonPackage(packageName: string): Promise<boolean> {
    try {
      await execAsync(`pip3 install ${packageName}`, {
        timeout: 60000
      });
      return true;
    } catch (error: unknown) {
      logger.error('Failed to install Python package:', error);
      return false;
    }
  }

  /**
   * 安装Node包（仅用于开发环境）
   */
  async installNodePackage(packageName: string): Promise<boolean> {
    try {
      await execAsync(`npm install ${packageName}`, {
        timeout: 60000,
        cwd: this.tempDir
      });
      return true;
    } catch (error: unknown) {
      logger.error('Failed to install Node package:', error);
      return false;
    }
  }
}

export default new CodeExecutionService();
