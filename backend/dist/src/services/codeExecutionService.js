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
exports.CodeExecutionService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class CodeExecutionService {
    constructor() {
        this.defaultTimeout = 30000; // 30秒
        this.maxTimeout = 120000; // 2分钟
        this.tempDir = path.join(process.cwd(), 'temp', 'code-execution');
        this.ensureTempDir();
    }
    /**
     * 确保临时目录存在
     */
    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        }
        catch (error) {
            logger_1.default.error('Failed to create temp directory:', error);
        }
    }
    /**
     * 执行代码
     */
    async executeCode(projectId, language, code, options) {
        const startTime = Date.now();
        const executionId = (0, uuid_1.v4)();
        try {
            // 1. 验证语言支持
            if (!this.isSupportedLanguage(language)) {
                throw new Error(`Unsupported language: ${language}`);
            }
            // 2. 创建临时文件
            const filePath = await this.createTempFile(executionId, language, code);
            // 3. 执行代码
            const timeout = Math.min(options?.timeout || this.defaultTimeout, this.maxTimeout);
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
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const errorResult = {
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
    isSupportedLanguage(language) {
        const supported = ['python', 'javascript', 'node', 'sql', 'bash', 'shell'];
        return supported.includes(language.toLowerCase());
    }
    /**
     * 创建临时文件
     */
    async createTempFile(executionId, language, code) {
        const extensions = {
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
    async runCode(language, filePath, timeout, options) {
        const commands = {
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
        }
        catch (error) {
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
    async cleanupTempFile(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup temp file:', error);
        }
    }
    /**
     * 保存执行记录
     */
    async saveExecutionRecord(projectId, language, code, result) {
        try {
            await (0, db_1.query)(`INSERT INTO pbl_code_executions
         (project_id, language, code, status, output, error_message, execution_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                projectId,
                language,
                code,
                result.status,
                result.output,
                result.errorMessage,
                result.executionTime
            ]);
        }
        catch (error) {
            logger_1.default.error('Failed to save execution record:', error);
        }
    }
    /**
     * 获取执行历史
     */
    async getExecutionHistory(projectId, limit = 10) {
        const result = await (0, db_1.query)(`SELECT id, language, code, status, output, error_message,
              execution_time, created_at
       FROM pbl_code_executions
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [projectId, limit]);
        return result;
    }
    /**
     * 安装Python包（仅用于开发环境）
     */
    async installPythonPackage(packageName) {
        try {
            await execAsync(`pip3 install ${packageName}`, {
                timeout: 60000
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to install Python package:', error);
            return false;
        }
    }
    /**
     * 安装Node包（仅用于开发环境）
     */
    async installNodePackage(packageName) {
        try {
            await execAsync(`npm install ${packageName}`, {
                timeout: 60000,
                cwd: this.tempDir
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to install Node package:', error);
            return false;
        }
    }
}
exports.CodeExecutionService = CodeExecutionService;
exports.default = new CodeExecutionService();
//# sourceMappingURL=codeExecutionService.js.map