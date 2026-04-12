import Taro from '@tarojs/taro';

/**
 * 支付服务
 */
class PaymentService {
  /**
   * 创建支付订单
   */
  async createPayment(taskId: string, paymentType: 'deposit' | 'final', amount: number) {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/payments/create',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          taskId,
          paymentType,
          amount
        }
      });

      if (res.statusCode === 200 && res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || '创建支付订单失败');
      }
    } catch (error: any) {
      console.error('创建支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 调用微信支付
   */
  async requestWechatPayment(paymentData: any) {
    try {
      await Taro.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType || 'RSA',
        paySign: paymentData.paySign
      });

      return { success: true };
    } catch (error: any) {
      if (error.errMsg === 'requestPayment:fail cancel') {
        return { success: false, cancelled: true };
      }
      throw error;
    }
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(orderId: string) {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/payments/${orderId}/status`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200 && res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || '查询支付状态失败');
      }
    } catch (error: any) {
      console.error('查询支付状态失败:', error);
      throw error;
    }
  }

  /**
   * 申请退款
   */
  async requestRefund(orderId: string, reason: string) {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/payments/${orderId}/refund`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason
        }
      });

      if (res.statusCode === 200 && res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || '申请退款失败');
      }
    } catch (error: any) {
      console.error('申请退款失败:', error);
      throw error;
    }
  }

  /**
   * 获取支付记录
   */
  async getPaymentHistory(params?: { page?: number; limit?: number; status?: string }) {
    try {
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/payments/history',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: params
      });

      if (res.statusCode === 200 && res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || '获取支付记录失败');
      }
    } catch (error: any) {
      console.error('获取支付记录失败:', error);
      throw error;
    }
  }
}

export default new PaymentService();
