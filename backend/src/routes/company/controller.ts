import { Request, Response, NextFunction } from 'express';
import { queryOne, query } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await queryOne(
      `SELECT u.id, u.email, u.nickname, u.created_at,
              cp.company_name, cp.industry, cp.scale, cp.contact_person,
              cp.contact_phone, cp.address, cp.description, cp.logo_url,
              cp.verified_at, cp.total_tasks_posted, cp.total_paid
       FROM users u
       JOIN company_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (!profile) throw new AppError(404, '企业档案不存在', 'NOT_FOUND');
    res.json(profile);
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { companyName, industry, scale, contactPerson, contactPhone, address, description, logoUrl } = req.body;
    await query(
      `UPDATE company_profiles SET
        company_name = COALESCE($1, company_name),
        industry = COALESCE($2, industry),
        scale = COALESCE($3, scale),
        contact_person = COALESCE($4, contact_person),
        contact_phone = COALESCE($5, contact_phone),
        address = COALESCE($6, address),
        description = COALESCE($7, description),
        logo_url = COALESCE($8, logo_url),
        updated_at = NOW()
       WHERE user_id = $9`,
      [companyName, industry, scale, contactPerson, contactPhone, address, description, logoUrl, userId]
    );
    res.json({ success: true, message: '信息已更新' });
  } catch (err) { next(err); }
}
