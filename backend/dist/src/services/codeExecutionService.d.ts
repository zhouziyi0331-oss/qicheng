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
    timeout?: number;
    workingDir?: string;
    env?: Record<string, string>;
}
export declare class CodeExecutionService {
    private tempDir;
    private defaultTimeout;
    private maxTimeout;
    constructor();
    /**
     * 确保临时目录存在
     */
    private ensureTempDir;
    /**
     * 执行代码
     */
    executeCode(projectId: string, language: string, code: string, options?: CodeExecutionOptions): Promise<ExecutionResult>;
    /**
     * 检查语言是否支持
     */
    private isSupportedLanguage;
    /**
     * 创建临时文件
     */
    private createTempFile;
    /**
     * 运行代码
     */
    private runCode;
    /**
     * 清理临时文件
     */
    private cleanupTempFile;
    /**
     * 保存执行记录
     */
    private saveExecutionRecord;
    /**
     * 获取执行历史
     */
    getExecutionHistory(projectId: string, limit?: number): Promise<any[]>;
    /**
     * 安装Python包（仅用于开发环境）
     */
    installPythonPackage(packageName: string): Promise<boolean>;
    /**
     * 安装Node包（仅用于开发环境）
     */
    installNodePackage(packageName: string): Promise<boolean>;
}
declare const _default: CodeExecutionService;
export default _default;
//# sourceMappingURL=codeExecutionService.d.ts.map