import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /admin/startup-guides - 获取所有创业指南
export async function listStartupGuides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guides = await query(
      `SELECT id, section, title, content, order_index, is_active, created_at, updated_at
       FROM startup_guides
       ORDER BY order_index ASC`,
      []
    );
    res.json({ success: true, data: guides });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /admin/startup-guides/:id - 获取单个创业指南
export async function getStartupGuide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const guide = await queryOne(
      `SELECT id, section, title, content, order_index, is_active, created_at, updated_at
       FROM startup_guides WHERE id = $1`,
      [id]
    );

    if (!guide) {
      throw new AppError(404, '创业指南不存在', 'GUIDE_NOT_FOUND');
    }

    res.json({ success: true, data: guide });
  } catch (err: unknown) {
    next(err);
  }
}

// POST /admin/startup-guides - 创建新的创业指南
export async function createStartupGuide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { section, title, content, order_index = 0, is_active = true } = req.body;

    if (!section || !title || !content) {
      throw new AppError(400, '缺少必需字段', 'MISSING_FIELDS');
    }

    const result = await queryOne(
      `INSERT INTO startup_guides (section, title, content, order_index, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, section, title, content, order_index, is_active, created_at`,
      [section, title, content, order_index, is_active]
    );

    res.json({ success: true, data: result, message: '创业指南创建成功' });
  } catch (err: unknown) {
    next(err);
  }
}

// PUT /admin/startup-guides/:id - 更新创业指南
export async function updateStartupGuide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { section, title, content, order_index, is_active } = req.body;

    const guide = await queryOne('SELECT id FROM startup_guides WHERE id = $1', [id]);
    if (!guide) {
      throw new AppError(404, '创业指南不存在', 'GUIDE_NOT_FOUND');
    }

    const result = await queryOne(
      `UPDATE startup_guides
       SET section = COALESCE($1, section),
           title = COALESCE($2, title),
           content = COALESCE($3, content),
           order_index = COALESCE($4, order_index),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, section, title, content, order_index, is_active, updated_at`,
      [section, title, content, order_index, is_active, id]
    );

    res.json({ success: true, data: result, message: '创业指南更新成功' });
  } catch (err: unknown) {
    next(err);
  }
}

// DELETE /admin/startup-guides/:id - 删除创业指南
export async function deleteStartupGuide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const guide = await queryOne('SELECT id FROM startup_guides WHERE id = $1', [id]);
    if (!guide) {
      throw new AppError(404, '创业指南不存在', 'GUIDE_NOT_FOUND');
    }

    await query('DELETE FROM startup_guides WHERE id = $1', [id]);

    res.json({ success: true, message: '创业指南删除成功' });
  } catch (err: unknown) {
    next(err);
  }
}
