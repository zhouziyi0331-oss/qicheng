import { Request, Response } from 'express';
import { getAuditLogs } from '../../utils/auditLog';

/**
 * 获取审计日志列表
 */
export async function getAuditLogList(req: Request, res: Response) {
  try {
    const {
      adminId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = '1',
      pageSize = '50'
    } = req.query;

    const filters = {
      adminId: adminId as string,
      action: action as string,
      resourceType: resourceType as string,
      resourceId: resourceId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    };

    const result = await getAuditLogs(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取审计日志失败：', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志失败'
    });
  }
}

/**
 * 获取审计日志统计
 */
export async function getAuditLogStats(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    // 这里可以添加更复杂的统计逻辑
    // 例如：按操作类型统计、按管理员统计、按时间段统计等

    res.json({
      success: true,
      data: {
        message: '审计日志统计功能待实现'
      }
    });
  } catch (error) {
    console.error('获取审计日志统计失败：', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志统计失败'
    });
  }
}
