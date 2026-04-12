import Taro from '@tarojs/taro';

/**
 * 消息推送服务
 */
class NotificationService {
  /**
   * 订阅消息模板ID
   */
  private templateIds = {
    taskAccepted: 'TEMPLATE_ID_1', // 任务被接单
    taskSubmitted: 'TEMPLATE_ID_2', // 任务已提交
    paymentSuccess: 'TEMPLATE_ID_3', // 支付成功
    amendmentRequest: 'TEMPLATE_ID_4', // 追加需求
    disputeUpdate: 'TEMPLATE_ID_5', // 申诉更新
  };

  /**
   * 请求订阅消息权限
   */
  async requestSubscribeMessage(templateIds: string[]) {
    try {
      if (process.env.TARO_ENV !== 'weapp') {
        console.log('非微信环境，跳过订阅消息');
        return { success: false };
      }

      const res = await Taro.requestSubscribeMessage({
        tmplIds: templateIds
      });

      return { success: true, data: res };
    } catch (error: any) {
      console.error('请求订阅消息失败:', error);
      return { success: false, error };
    }
  }

  /**
   * 订阅任务相关通知
   */
  async subscribeTaskNotifications() {
    const templateIds = [
      this.templateIds.taskAccepted,
      this.templateIds.taskSubmitted,
      this.templateIds.amendmentRequest
    ];

    return await this.requestSubscribeMessage(templateIds);
  }

  /**
   * 订阅支付相关通知
   */
  async subscribePaymentNotifications() {
    const templateIds = [
      this.templateIds.paymentSuccess
    ];

    return await this.requestSubscribeMessage(templateIds);
  }

  /**
   * 订阅申诉相关通知
   */
  async subscribeDisputeNotifications() {
    const templateIds = [
      this.templateIds.disputeUpdate
    ];

    return await this.requestSubscribeMessage(templateIds);
  }

  /**
   * 发送本地通知
   */
  showLocalNotification(title: string, content: string) {
    Taro.showToast({
      title: `${title}: ${content}`,
      icon: 'none',
      duration: 3000
    });
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount() {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/notifications/unread-count',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200 && res.data.success) {
        return res.data.data.count || 0;
      }
      return 0;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      return 0;
    }
  }

  /**
   * 设置TabBar徽标
   */
  async updateTabBarBadge() {
    try {
      const unreadCount = await this.getUnreadCount();

      if (unreadCount > 0) {
        Taro.setTabBarBadge({
          index: 0, // 首页
          text: unreadCount > 99 ? '99+' : String(unreadCount)
        });
      } else {
        Taro.removeTabBarBadge({
          index: 0
        });
      }
    } catch (error) {
      console.error('更新TabBar徽标失败:', error);
    }
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(notificationIds: number[]) {
    try {
      const token = Taro.getStorageSync('token');

      await Taro.request({
        url: 'http://localhost:3000/api/v1/notifications/mark-read',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          notificationIds
        }
      });

      // 更新徽标
      await this.updateTabBarBadge();
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  }

  /**
   * 获取消息列表
   */
  async getNotifications(params?: { page?: number; limit?: number; type?: string }) {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/notifications',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: params
      });

      if (res.statusCode === 200 && res.data.success) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error('获取消息列表失败:', error);
      return [];
    }
  }

  /**
   * 清空所有消息
   */
  async clearAllNotifications() {
    try {
      const token = Taro.getStorageSync('token');

      await Taro.request({
        url: 'http://localhost:3000/api/v1/notifications/clear',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 更新徽标
      await this.updateTabBarBadge();
    } catch (error) {
      console.error('清空消息失败:', error);
    }
  }
}

export default new NotificationService();
