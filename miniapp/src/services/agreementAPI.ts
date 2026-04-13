import Taro from '@tarojs/taro';
import request from './request';

/**
 * 协议管理API
 */
export const agreementAPI = {
  /**
   * 获取所有有效协议
   */
  getActiveAgreements: () => {
    return request({
      url: '/api/v1/agreement/agreements',
      method: 'GET'
    });
  },

  /**
   * 获取特定类型的协议
   */
  getAgreementByType: (type: string) => {
    return request({
      url: `/api/v1/agreement/agreements/${type}`,
      method: 'GET'
    });
  },

  /**
   * 签署协议
   */
  signAgreement: (agreementId: number) => {
    return request({
      url: '/api/v1/agreement/agreements/sign',
      method: 'POST',
      data: { agreementId }
    });
  },

  /**
   * 检查用户协议签署状态
   */
  checkUserAgreements: () => {
    return request({
      url: '/api/v1/agreement/agreements/check/status',
      method: 'GET'
    });
  },

  /**
   * 获取用户的协议签署历史
   */
  getUserSignatures: () => {
    return request({
      url: '/api/v1/agreement/agreements/signatures/history',
      method: 'GET'
    });
  }
};

/**
 * 数据授权API
 */
export const dataAuthorizationAPI = {
  /**
   * 获取用户授权设置
   */
  getAuthorizationSettings: () => {
    return request({
      url: '/api/v1/agreement/authorization/settings',
      method: 'GET'
    });
  },

  /**
   * 更新单个授权设置
   */
  updateAuthorization: (authorizationType: string, authorized: boolean, changeReason?: string) => {
    return request({
      url: '/api/v1/agreement/authorization/update',
      method: 'PUT',
      data: { authorizationType, authorized, changeReason }
    });
  },

  /**
   * 批量更新授权设置
   */
  batchUpdateAuthorizations: (authorizations: any) => {
    return request({
      url: '/api/v1/agreement/authorization/batch-update',
      method: 'PUT',
      data: { authorizations }
    });
  },

  /**
   * 获取授权变更历史
   */
  getAuthorizationHistory: () => {
    return request({
      url: '/api/v1/agreement/authorization/history',
      method: 'GET'
    });
  }
};

/**
 * 必读条款API
 */
export const mandatoryTermsAPI = {
  /**
   * 确认必读条款
   */
  confirmTerm: (termType: string) => {
    return request({
      url: '/api/v1/agreement/terms/confirm',
      method: 'POST',
      data: { termType }
    });
  },

  /**
   * 检查用户条款确认状态
   */
  checkUserTerms: () => {
    return request({
      url: '/api/v1/agreement/terms/check/status',
      method: 'GET'
    });
  },

  /**
   * 获取用户的条款确认记录
   */
  getUserTerms: () => {
    return request({
      url: '/api/v1/agreement/terms/history',
      method: 'GET'
    });
  }
};
