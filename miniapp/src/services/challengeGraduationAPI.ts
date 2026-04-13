import Taro from '@tarojs/taro';
import request from './request';

/**
 * 跳级挑战API
 */
export const challengeAPI = {
  /**
   * 获取可用的挑战任务
   */
  getAvailableChallenges: () => {
    return request({
      url: '/api/v1/challenge-graduation/challenges/available',
      method: 'GET'
    });
  },

  /**
   * 开始挑战
   */
  startChallenge: (challengeTaskId: number) => {
    return request({
      url: '/api/v1/challenge-graduation/challenges/start',
      method: 'POST',
      data: { challengeTaskId }
    });
  },

  /**
   * 提交挑战作品
   */
  submitChallenge: (challengeId: number, submissionUrl: string, submissionContent: string) => {
    return request({
      url: `/api/v1/challenge-graduation/challenges/${challengeId}/submit`,
      method: 'POST',
      data: { submissionUrl, submissionContent }
    });
  },

  /**
   * 获取挑战历史
   */
  getChallengeHistory: () => {
    return request({
      url: '/api/v1/challenge-graduation/challenges/history',
      method: 'GET'
    });
  }
};

/**
 * 毕业系统API
 */
export const graduationAPI = {
  /**
   * 检查毕业资格
   */
  checkEligibility: () => {
    return request({
      url: '/api/v1/challenge-graduation/graduation/eligibility',
      method: 'GET'
    });
  },

  /**
   * 提交毕业申请
   */
  applyForGraduation: (data: {
    portfolioUrl: string;
    selfIntroduction: string;
    careerGoals: string;
  }) => {
    return request({
      url: '/api/v1/challenge-graduation/graduation/apply',
      method: 'POST',
      data
    });
  },

  /**
   * 获取毕业生权益
   */
  getGraduateBenefits: () => {
    return request({
      url: '/api/v1/challenge-graduation/graduation/benefits',
      method: 'GET'
    });
  }
};
