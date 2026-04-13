import { Request, Response } from 'express';
/**
 * 探索模式加速器 Controller
 *
 * 核心理念：不只是学技能，而是探索新模式
 * - 项目标签：不只是"Figma"，还有"探索新工具"
 * - 完成反思：不只是"评价任务"，还有"发现了什么新模式"
 * - 模式库：记录学生发现的可复用模式
 */
export declare const addExplorationTag: (req: Request, res: Response) => Promise<void>;
export declare const getTaskExplorationTags: (req: Request, res: Response) => Promise<void>;
export declare const submitReflection: (req: Request, res: Response) => Promise<void>;
export declare const getStudentReflections: (req: Request, res: Response) => Promise<void>;
export declare const getStudentPatterns: (req: Request, res: Response) => Promise<void>;
export declare const markPatternForLife: (req: Request, res: Response) => Promise<void>;
export declare const recordPatternApplication: (req: Request, res: Response) => Promise<void>;
export declare const generateExplorationSuggestions: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=explorationController.d.ts.map