import { Request, Response } from 'express';
/**
 * OPC孵化计划 Controller
 *
 * 核心理念：Lv.4（自流者）解锁，帮助学生独立发展
 * 触发条件：完成20个项目 + 等级达到Lv.4 + 找到热情方向
 * 平台提供：免费OPC报告、独立接单资格、联合体支持、创业资源对接
 * 学生承诺：每月更新成长报告、分享探索经验、帮助新人
 */
export declare const checkEligibility: (req: Request, res: Response) => Promise<void>;
export declare const applyForIncubation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getIncubationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitMonthlyUpdate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const connectResource: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const graduate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllIncubating: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=incubationController.d.ts.map