import Taro from '@tarojs/taro';
import { request } from './request';

/**
 * 沟通中转API
 */
export const communicationAPI = {
  /**
   * 企业添加任务补充说明
   */
  addClarification: (taskId: number, content: string, attachments?: any[]) => {
    return request({
      url: '/communication/clarifications',
      method: 'POST',
      data: { taskId, content, attachments }
    });
  },

  /**
   * 获取任务补充说明列表
   */
  getClarifications: (taskId: number) => {
    return request({
      url: `/communication/clarifications/${taskId}`,
      method: 'GET'
    });
  },

  /**
   * 学生提问（AI回答）
   */
  askQuestion: (taskId: number, question: string) => {
    return request({
      url: '/communication/questions',
      method: 'POST',
      data: { taskId, question }
    });
  },

  /**
   * 转发问题给企业
   */
  forwardToCompany: (questionId: number) => {
    return request({
      url: `/communication/questions/${questionId}/forward`,
      method: 'POST'
    });
  },

  /**
   * 企业回答学生问题
   */
  answerQuestion: (questionId: number, answer: string) => {
    return request({
      url: `/communication/questions/${questionId}/answer`,
      method: 'POST',
      data: { answer }
    });
  },

  /**
   * 获取任务问答列表
   */
  getQuestions: (taskId: number) => {
    return request({
      url: `/communication/questions/${taskId}`,
      method: 'GET'
    });
  },

  /**
   * 标记AI回答是否有帮助
   */
  markAIAnswerHelpful: (questionId: number, isHelpful: boolean) => {
    return request({
      url: `/communication/questions/${questionId}/helpful`,
      method: 'POST',
      data: { isHelpful }
    });
  },

  /**
   * 发送中转消息
   */
  sendMessage: (taskId: number, receiverId: number, content: string, attachments?: any[]) => {
    return request({
      url: '/communication/messages',
      method: 'POST',
      data: { taskId, receiverId, content, attachments }
    });
  },

  /**
   * 获取中转消息列表
   */
  getMessages: (taskId: number) => {
    return request({
      url: `/communication/messages/${taskId}`,
      method: 'GET'
    });
  },

  /**
   * 获取未读消息数
   */
  getUnreadCount: () => {
    return request({
      url: '/communication/unread-count',
      method: 'GET'
    });
  }
};
