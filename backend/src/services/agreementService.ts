import pool from '../config/database';

/**
 * 协议管理服务
 */
export class AgreementService {
  /**
   * 获取当前有效的协议
   */
  static async getActiveAgreements() {
    const result = await pool.query(
      `SELECT * FROM user_agreements
       WHERE is_active = TRUE
       ORDER BY agreement_type, version DESC`
    );

    return result.rows;
  }

  /**
   * 获取特定类型的协议
   */
  static async getAgreementByType(agreementType: string) {
    const result = await pool.query(
      `SELECT * FROM user_agreements
       WHERE agreement_type = $1 AND is_active = TRUE
       ORDER BY version DESC
       LIMIT 1`,
      [agreementType]
    );

    return result.rows[0] || null;
  }

  /**
   * 签署协议
   */
  static async signAgreement(
    userId: number,
    agreementId: number,
    ipAddress?: string,
    deviceInfo?: string
  ) {
    // 获取协议信息
    const agreementResult = await pool.query(
      `SELECT agreement_type, version FROM user_agreements WHERE id = $1`,
      [agreementId]
    );

    if (agreementResult.rows.length === 0) {
      throw new Error('协议不存在');
    }

    const { agreement_type, version } = agreementResult.rows[0];

    // 检查是否已签署
    const existingResult = await pool.query(
      `SELECT * FROM user_agreement_signatures
       WHERE user_id = $1 AND agreement_id = $2`,
      [userId, agreementId]
    );

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    // 创建签署记录
    const result = await pool.query(
      `INSERT INTO user_agreement_signatures
       (user_id, agreement_id, agreement_type, agreement_version, ip_address, device_info)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, agreementId, agreement_type, version, ipAddress, deviceInfo]
    );

    return result.rows[0];
  }

  /**
   * 检查用户是否已签署所有必要协议
   */
  static async checkUserAgreements(userId: number) {
    const requiredTypes = ['service_terms', 'privacy_policy', 'data_authorization'];

    const result = await pool.query(
      `SELECT DISTINCT agreement_type
       FROM user_agreement_signatures
       WHERE user_id = $1 AND agreement_type = ANY($2)`,
      [userId, requiredTypes]
    );

    const signedTypes = result.rows.map(row => row.agreement_type);
    const missingTypes = requiredTypes.filter(type => !signedTypes.includes(type));

    return {
      allSigned: missingTypes.length === 0,
      signedTypes,
      missingTypes
    };
  }

  /**
   * 获取用户的协议签署历史
   */
  static async getUserSignatures(userId: number) {
    const result = await pool.query(
      `SELECT uas.*, ua.title, ua.version
       FROM user_agreement_signatures uas
       JOIN user_agreements ua ON uas.agreement_id = ua.id
       WHERE uas.user_id = $1
       ORDER BY uas.signed_at DESC`,
      [userId]
    );

    return result.rows;
  }
}

/**
 * 数据授权服务
 */
export class DataAuthorizationService {
  /**
   * 初始化用户数据授权设置（注册时调用）
   */
  static async initializeAuthorization(userId: number) {
    const result = await pool.query(
      `INSERT INTO data_authorization_settings
       (user_id, basic_data_authorized, task_data_authorized, ability_data_authorized)
       VALUES ($1, TRUE, TRUE, TRUE)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );

    return result.rows[0];
  }

  /**
   * 获取用户授权设置
   */
  static async getAuthorizationSettings(userId: number) {
    const result = await pool.query(
      `SELECT * FROM data_authorization_settings WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * 更新商业化授权设置
   */
  static async updateCommercialAuthorization(
    userId: number,
    authorizationType: string,
    authorized: boolean,
    changeReason?: string,
    ipAddress?: string
  ) {
    // 获取当前值
    const currentResult = await pool.query(
      `SELECT ${authorizationType} as current_value
       FROM data_authorization_settings
       WHERE user_id = $1`,
      [userId]
    );

    const previousValue = currentResult.rows[0]?.current_value || false;

    // 更新授权设置
    const updateQuery = `
      UPDATE data_authorization_settings
      SET ${authorizationType} = $1,
          ${authorizationType.replace('_authorized', '_authorized_at')} = CASE WHEN $1 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [authorized, userId]);

    // 记录变更历史
    await pool.query(
      `INSERT INTO data_authorization_history
       (user_id, authorization_type, previous_value, new_value, change_reason, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, authorizationType, previousValue, authorized, changeReason, ipAddress]
    );

    return result.rows[0];
  }

  /**
   * 获取授权变更历史
   */
  static async getAuthorizationHistory(userId: number) {
    const result = await pool.query(
      `SELECT * FROM data_authorization_history
       WHERE user_id = $1
       ORDER BY changed_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * 批量更新商业化授权
   */
  static async batchUpdateAuthorizations(
    userId: number,
    authorizations: {
      commercial_use_authorized?: boolean;
      marketing_authorized?: boolean;
      third_party_share_authorized?: boolean;
      ai_training_authorized?: boolean;
    },
    ipAddress?: string
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(authorizations)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;

        const timestampKey = key.replace('_authorized', '_authorized_at');
        updates.push(`${timestampKey} = CASE WHEN $${paramIndex - 1} = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END`);
      }
    }

    if (updates.length === 0) {
      throw new Error('没有需要更新的授权设置');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const query = `
      UPDATE data_authorization_settings
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

/**
 * 必读条款服务
 */
export class MandatoryTermsService {
  /**
   * 确认必读条款
   */
  static async confirmTerm(
    userId: number,
    termType: string,
    ipAddress?: string
  ) {
    const result = await pool.query(
      `INSERT INTO mandatory_terms_confirmations
       (user_id, term_type, confirmed, confirmed_at, ip_address)
       VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (user_id, term_type)
       DO UPDATE SET confirmed = TRUE, confirmed_at = CURRENT_TIMESTAMP, ip_address = $3
       RETURNING *`,
      [userId, termType, ipAddress]
    );

    return result.rows[0];
  }

  /**
   * 检查用户是否已确认所有必读条款
   */
  static async checkUserTerms(userId: number) {
    const requiredTerms = ['age_confirmation', 'real_name_commitment', 'data_usage_notice'];

    const result = await pool.query(
      `SELECT term_type, confirmed
       FROM mandatory_terms_confirmations
       WHERE user_id = $1 AND term_type = ANY($2)`,
      [userId, requiredTerms]
    );

    const confirmedTerms = result.rows
      .filter(row => row.confirmed)
      .map(row => row.term_type);

    const missingTerms = requiredTerms.filter(term => !confirmedTerms.includes(term));

    return {
      allConfirmed: missingTerms.length === 0,
      confirmedTerms,
      missingTerms
    };
  }

  /**
   * 获取用户的条款确认记录
   */
  static async getUserTerms(userId: number) {
    const result = await pool.query(
      `SELECT * FROM mandatory_terms_confirmations
       WHERE user_id = $1
       ORDER BY confirmed_at DESC`,
      [userId]
    );

    return result.rows;
  }
}
