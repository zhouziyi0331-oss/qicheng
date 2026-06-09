/**
 * 赛道选择控制器
 * 实现学生赛道选择和路径展示功能
 */

import { Request, Response } from 'express';
import { pool } from '../utils/db';
import { logger } from '../utils/logger';

/**
 * 获取赛道推荐和分析
 * GET /api/v1/students/track-recommendation
 */
export async function getTrackRecommendation(req: Request, res: Response) {
  const userId = req.user?.userId;

  try {
    // 1. 查询用户画像和赛道分析
    const result = await pool.query(
      `SELECT
        uap.track_analysis,
        uap.track_recommendation,
        u.selected_track,
        u.track_selected_at
       FROM user_ability_profiles uap
       JOIN users u ON u.id = uap.user_id
       WHERE uap.user_id = $1
       ORDER BY uap.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'PROFILE_NOT_FOUND',
        message: '请先完成38题测评'
      });
    }

    const profile = result.rows[0];

    // 2. 如果已经选择赛道，返回选择结果
    if (profile.selected_track) {
      return res.json({
        success: true,
        data: {
          hasSelected: true,
          selectedTrack: profile.selected_track,
          selectedAt: profile.track_selected_at,
          trackAnalysis: profile.track_analysis
        }
      });
    }

    // 3. 返回赛道推荐
    res.json({
      success: true,
      data: {
        hasSelected: false,
        trackAnalysis: profile.track_analysis,
        recommendedTrack: profile.track_recommendation ||
          (profile.track_analysis?.content?.score > profile.track_analysis?.dev?.score ? 'content' : 'dev')
      }
    });

  } catch (error) {
    logger.error('Get track recommendation failed', { error, userId });
    res.status(500).json({
      success: false,
      message: '获取赛道推荐失败'
    });
  }
}

/**
 * 选择赛道
 * POST /api/v1/students/select-track
 */
export async function selectTrack(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { track } = req.body;

  // 验证赛道类型
  if (!['content', 'dev'].includes(track)) {
    return res.status(400).json({
      success: false,
      message: '无效的赛道类型，必须是 content 或 dev'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. 检查是否已经选择过赛道
    const userResult = await client.query(
      'SELECT selected_track FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].selected_track) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        code: 'TRACK_ALREADY_SELECTED',
        message: '您已经选择过赛道，如需更改请联系管理员'
      });
    }

    // 2. 更新用户选择的赛道
    await client.query(
      `UPDATE users
       SET selected_track = $1, track_selected_at = NOW()
       WHERE id = $2`,
      [track, userId]
    );

    // 3. 更新画像表的 track_recommendation
    await client.query(
      `UPDATE user_ability_profiles
       SET track_recommendation = $1
       WHERE user_id = $2`,
      [track, userId]
    );

    await client.query('COMMIT');

    logger.info('Track selected successfully', { userId, track });

    res.json({
      success: true,
      message: '赛道选择成功',
      data: {
        selectedTrack: track,
        selectedAt: new Date()
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Select track failed', { error, userId, track });
    res.status(500).json({
      success: false,
      message: '赛道选择失败'
    });
  } finally {
    client.release();
  }
}

/**
 * 获取赛道路径对比
 * GET /api/v1/students/track-paths
 */
export async function getTrackPaths(req: Request, res: Response) {
  try {
    // 返回两条赛道的完整路径信息
    const paths = {
      content: {
        name: 'AI内容创作',
        description: '图片、视频、图文、短剧、品牌视觉',
        levels: [
          {
            level: 0,
            name: '涉水者',
            description: 'AI生成单张图片/简单图文',
            requirements: '完成首单',
            typicalTasks: ['AI生成海报', 'AI生成图文', '简单图片编辑'],
            estimatedIncome: '¥100-300/单',
            unlocks: []
          },
          {
            level: 1,
            name: '试流者',
            description: 'AI生成系列图/短视频',
            requirements: '完成3单，评分≥70',
            typicalTasks: ['系列海报设计', '短视频制作', '品牌视觉设计'],
            estimatedIncome: '¥300-800/单',
            unlocks: []
          },
          {
            level: 2,
            name: '行舟者',
            description: 'AI生成完整视频/短剧',
            requirements: '完成5单，评分≥75',
            typicalTasks: ['完整视频制作', '短剧创作', '品牌宣传片'],
            estimatedIncome: '¥800-2000/单',
            unlocks: []
          },
          {
            level: 3,
            name: '知向者',
            description: 'AI生成长漫剧/系列IP内容',
            requirements: '完成8单，评分≥80',
            typicalTasks: ['长漫剧创作', 'IP内容开发', '系列内容策划'],
            estimatedIncome: '¥2000-5000/单',
            unlocks: []
          },
          {
            level: 4,
            name: '自流者',
            description: '品牌内容矩阵/商业运营',
            requirements: '完成12单，评分≥85',
            typicalTasks: ['品牌内容矩阵', '商业内容运营', '内容战略规划'],
            estimatedIncome: '¥5000-10000/单',
            unlocks: ['社区浏览权', '被邀请入队']
          },
          {
            level: 5,
            name: '河成者',
            description: '内容战略/团队协作项目',
            requirements: '完成20单，评分≥90',
            typicalTasks: ['内容战略咨询', '团队协作项目', '大型内容项目'],
            estimatedIncome: '¥10000+/单',
            unlocks: ['社区组队权', '申请大师']
          },
          {
            level: 6,
            name: '联合体',
            description: '跨领域共创项目、创建队伍、万字毕业报告',
            requirements: '完成30单，评分≥95，提交毕业报告',
            typicalTasks: ['跨领域共创', '创建队伍', '导师级项目'],
            estimatedIncome: '¥20000+/单',
            unlocks: ['创建队伍', '导师权限', '毕业证书']
          }
        ]
      },
      dev: {
        name: 'AI工具开发',
        description: '小程序、Agent、工作流、自动化系统',
        levels: [
          {
            level: 0,
            name: '涉水者',
            description: 'AI辅助简单文档/表格',
            requirements: '完成首单',
            typicalTasks: ['AI生成文档', 'AI处理表格', '简单数据整理'],
            estimatedIncome: '¥100-300/单',
            unlocks: []
          },
          {
            level: 1,
            name: '试流者',
            description: 'AI生成简单小程序/工具',
            requirements: '完成3单，评分≥70',
            typicalTasks: ['简单小程序', '工具脚本', '自动化工具'],
            estimatedIncome: '¥300-800/单',
            unlocks: []
          },
          {
            level: 2,
            name: '行舟者',
            description: 'AI搭建功能性小程序',
            requirements: '完成5单，评分≥75',
            typicalTasks: ['功能性小程序', '业务系统', 'Web应用'],
            estimatedIncome: '¥800-2000/单',
            unlocks: []
          },
          {
            level: 3,
            name: '知向者',
            description: 'AI搭建基础Agent',
            requirements: '完成8单，评分≥80',
            typicalTasks: ['基础Agent', '智能助手', '自动化流程'],
            estimatedIncome: '¥2000-5000/单',
            unlocks: []
          },
          {
            level: 4,
            name: '自流者',
            description: '复杂Agent/自动化系统',
            requirements: '完成12单，评分≥85',
            typicalTasks: ['复杂Agent', '自动化系统', '智能工作流'],
            estimatedIncome: '¥5000-10000/单',
            unlocks: ['社区浏览权', '被邀请入队']
          },
          {
            level: 5,
            name: '河成者',
            description: '大型平台/产品级项目',
            requirements: '完成20单，评分≥90',
            typicalTasks: ['大型平台', '产品级项目', '企业级系统'],
            estimatedIncome: '¥10000+/单',
            unlocks: ['社区组队权', '申请大师']
          },
          {
            level: 6,
            name: '联合体',
            description: '跨领域共创项目、创建队伍、万字毕业报告',
            requirements: '完成30单，评分≥95，提交毕业报告',
            typicalTasks: ['跨领域共创', '创建队伍', '导师级项目'],
            estimatedIncome: '¥20000+/单',
            unlocks: ['创建队伍', '导师权限', '毕业证书']
          }
        ]
      }
    };

    res.json({
      success: true,
      data: paths
    });

  } catch (error) {
    logger.error('Get track paths failed', { error });
    res.status(500).json({
      success: false,
      message: '获取赛道路径失败'
    });
  }
}

/**
 * 获取当前用户的赛道信息
 * GET /api/v1/students/my-track
 */
export async function getMyTrack(req: Request, res: Response) {
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT
        u.selected_track,
        u.track_selected_at,
        uap.track_analysis,
        COUNT(DISTINCT o.id) as completed_orders,
        AVG(r.overall_rating) as avg_rating
       FROM users u
       LEFT JOIN user_ability_profiles uap ON u.id = uap.user_id
       LEFT JOIN orders o ON o.student_id = u.id AND o.status = 'completed'
       LEFT JOIN ratings r ON r.order_id = o.id AND r.rater_role = 'company'
       WHERE u.id = $1
       GROUP BY u.id, u.selected_track, u.track_selected_at, uap.track_analysis`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户信息未找到'
      });
    }

    const data = result.rows[0];

    res.json({
      success: true,
      data: {
        selectedTrack: data.selected_track,
        selectedAt: data.track_selected_at,
        trackAnalysis: data.track_analysis,
        progress: {
          completedOrders: parseInt(data.completed_orders) || 0,
          avgRating: parseFloat(data.avg_rating) || 0
        }
      }
    });

  } catch (error) {
    logger.error('Get my track failed', { error, userId });
    res.status(500).json({
      success: false,
      message: '获取赛道信息失败'
    });
  }
}
