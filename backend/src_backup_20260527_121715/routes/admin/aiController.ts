import { Request, Response } from 'express';
import { query } from '../../utils/db';

/**
 * 获取AI调用日志列表
 */
export async function getAICallLogs(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      userId,
      model,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 用户筛选
    if (userId) {
      conditions.push(`acl.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    // 模型筛选
    if (model) {
      conditions.push(`acl.model = $${paramIndex}`);
      params.push(model);
      paramIndex++;
    }

    // 日期范围筛选
    if (startDate) {
      conditions.push(`acl.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`acl.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM ai_call_logs acl
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    // 获取列表数据
    params.push(Number(pageSize), offset);
    const logs = await query<any>(
      `SELECT
        acl.id,
        acl.user_id,
        acl.model,
        acl.prompt_tokens,
        acl.completion_tokens,
        acl.total_tokens,
        acl.cost,
        acl.latency_ms,
        acl.created_at,
        u.nickname as user_name
       FROM ai_call_logs acl
       LEFT JOIN users u ON acl.user_id = u.id
       ${whereClause}
       ORDER BY acl.${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: logs,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取AI调用日志失败:', error);
    res.status(500).json({ message: '获取AI调用日志失败' });
  }
}

/**
 * 获取AI调用统计
 */
export async function getAICallStats(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 总体统计
    const totalStats = await query<any>(
      `SELECT
        COUNT(*) as total_calls,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as total_cost,
        AVG(latency_ms) as avg_latency
       FROM ai_call_logs
       ${whereClause}`,
      params
    );

    // 按模型统计
    const modelStats = await query<any>(
      `SELECT
        model,
        COUNT(*) as call_count,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as total_cost,
        AVG(latency_ms) as avg_latency
       FROM ai_call_logs
       ${whereClause}
       GROUP BY model
       ORDER BY call_count DESC`,
      params
    );

    // 按日期统计（最近30天）
    const dailyStats = await query<any>(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as call_count,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as total_cost
       FROM ai_call_logs
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      []
    );

    res.json({
      total: totalStats[0],
      byModel: modelStats,
      daily: dailyStats
    });
  } catch (error) {
    console.error('获取AI调用统计失败:', error);
    res.status(500).json({ message: '获取AI调用统计失败' });
  }
}

/**
 * 获取Prompt模板列表
 */
export async function getPromptTemplates(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, category, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM ai_prompt_templates
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    params.push(Number(pageSize), offset);
    const templates = await query<any>(
      `SELECT
        id,
        name,
        category,
        description,
        template,
        variables,
        status,
        created_at,
        updated_at
       FROM ai_prompt_templates
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: templates,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取Prompt模板列表失败:', error);
    res.status(500).json({ message: '获取Prompt模板列表失败' });
  }
}

/**
 * 创建Prompt模板
 */
export async function createPromptTemplate(req: Request, res: Response) {
  try {
    const { name, category, description, template, variables } = req.body;

    const result = await query<any>(
      `INSERT INTO ai_prompt_templates (name, category, description, template, variables, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [name, category, description, template, JSON.stringify(variables)]
    );

    res.json({ id: result[0].id, message: 'Prompt模板创建成功' });
  } catch (error) {
    console.error('创建Prompt模板失败:', error);
    res.status(500).json({ message: '创建Prompt模板失败' });
  }
}

/**
 * 更新Prompt模板
 */
export async function updatePromptTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, category, description, template, variables, status } = req.body;

    await query(
      `UPDATE ai_prompt_templates
       SET name = $1,
           category = $2,
           description = $3,
           template = $4,
           variables = $5,
           status = $6,
           updated_at = NOW()
       WHERE id = $7`,
      [name, category, description, template, JSON.stringify(variables), status, id]
    );

    res.json({ message: 'Prompt模板更新成功' });
  } catch (error) {
    console.error('更新Prompt模板失败:', error);
    res.status(500).json({ message: '更新Prompt模板失败' });
  }
}

/**
 * 删除Prompt模板
 */
export async function deletePromptTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await query(
      `DELETE FROM ai_prompt_templates WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Prompt模板删除成功' });
  } catch (error) {
    console.error('删除Prompt模板失败:', error);
    res.status(500).json({ message: '删除Prompt模板失败' });
  }
}
