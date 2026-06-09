/**
 * 数据脱敏工具
 */
/**
 * 手机号脱敏
 * 138****0099
 */
export declare function maskPhone(phone: string | null | undefined): string;
/**
 * 邮箱脱敏
 * abc***@example.com
 */
export declare function maskEmail(email: string | null | undefined): string;
/**
 * 身份证脱敏
 * 110***********1234
 */
export declare function maskIdCard(idCard: string | null | undefined): string;
/**
 * 银行卡脱敏
 * 6222 **** **** 1234
 */
export declare function maskBankCard(bankCard: string | null | undefined): string;
/**
 * 姓名脱敏
 * 张三 -> 张*
 * 欧阳娜娜 -> 欧阳**
 */
export declare function maskName(name: string | null | undefined): string;
/**
 * 根据管理员权限决定是否脱敏
 */
export declare function maskDataByPermission(data: any, adminRole: string, sensitiveFields?: string[]): any;
/**
 * 批量脱敏数组数据
 */
export declare function maskArrayData(dataArray: any[], adminRole: string, sensitiveFields?: string[]): any[];
//# sourceMappingURL=dataMask.d.ts.map