# 微信支付集成指南

## 📋 前置准备

### 1. 申请微信支付商户号
1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 注册并提交企业资质
3. 等待审核通过（通常3-7个工作日）
4. 获取以下信息：
   - 商户号（mchId）
   - API密钥（apiKey）
   - API证书（apiclient_cert.p12）

### 2. 配置小程序支付
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"微信支付" -> "商户号管理"
3. 绑定商户号到小程序
4. 获取小程序AppID

---

## 🔧 环境配置

### 1. 安装依赖
```bash
cd backend
npm install wechatpay-node-v3
```

### 2. 配置环境变量
在 `backend/.env` 中添加：
```env
# 微信支付配置
WECHAT_PAY_APPID=wx1234567890abcdef
WECHAT_PAY_MCHID=1234567890
WECHAT_PAY_SERIAL_NO=5157F09EFDC096DE15EBE81A47057A7232F1B8E1
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WECHAT_PAY_API_V3_KEY=your_api_v3_key_32_characters
WECHAT_PAY_NOTIFY_URL=https://api.qicheng.com/api/v1/payments/wechat/notify
```

### 3. 放置证书文件
```bash
mkdir -p backend/certs
# 将微信支付证书放入 backend/certs/ 目录
# - apiclient_key.pem (商户私钥)
# - apiclient_cert.pem (商户证书)
```

---

## 💻 代码实现

### 1. 创建微信支付服务
```typescript
// backend/src/services/wechatPay.ts
import Payment from 'wechatpay-node-v3';
import { config } from '../../config';
import logger from '../utils/logger';

const payment = new Payment({
  appid: config.wechatPay.appId,
  mchid: config.wechatPay.mchId,
  serial_no: config.wechatPay.serialNo,
  publicKey: Buffer.from(config.wechatPay.publicKey),
  privateKey: Buffer.from(config.wechatPay.privateKey),
  key: config.wechatPay.apiV3Key,
});

/**
 * 创建小程序支付订单
 */
export async function createMiniProgramPayment(params: {
  orderId: string;
  openid: string;
  amount: number;
  description: string;
}) {
  try {
    const result = await payment.transactions_jsapi({
      appid: config.wechatPay.appId,
      mchid: config.wechatPay.mchId,
      description: params.description,
      out_trade_no: params.orderId,
      notify_url: config.wechatPay.notifyUrl,
      amount: {
        total: Math.round(params.amount * 100), // 转换为分
        currency: 'CNY',
      },
      payer: {
        openid: params.openid,
      },
    });

    logger.info('WeChat payment created', { orderId: params.orderId });
    return result;
  } catch (error) {
    logger.error('WeChat payment creation failed', { error, orderId: params.orderId });
    throw error;
  }
}

/**
 * 查询订单状态
 */
export async function queryPaymentStatus(orderId: string) {
  try {
    const result = await payment.query({
      out_trade_no: orderId,
    });
    return result;
  } catch (error) {
    logger.error('WeChat payment query failed', { error, orderId });
    throw error;
  }
}

/**
 * 申请退款
 */
export async function refundPayment(params: {
  orderId: string;
  refundId: string;
  totalAmount: number;
  refundAmount: number;
  reason: string;
}) {
  try {
    const result = await payment.refunds({
      out_trade_no: params.orderId,
      out_refund_no: params.refundId,
      reason: params.reason,
      amount: {
        refund: Math.round(params.refundAmount * 100),
        total: Math.round(params.totalAmount * 100),
        currency: 'CNY',
      },
    });

    logger.info('WeChat refund created', { orderId: params.orderId, refundId: params.refundId });
    return result;
  } catch (error) {
    logger.error('WeChat refund failed', { error, orderId: params.orderId });
    throw error;
  }
}

/**
 * 验证支付回调签名
 */
export function verifyNotifySignature(headers: any, body: any): boolean {
  try {
    return payment.verifySign(headers, body);
  } catch (error) {
    logger.error('WeChat notify signature verification failed', { error });
    return false;
  }
}

/**
 * 解密回调数据
 */
export function decryptNotifyData(ciphertext: string, nonce: string, associated_data: string) {
  try {
    return payment.decipher_gcm(ciphertext, associated_data, nonce);
  } catch (error) {
    logger.error('WeChat notify data decryption failed', { error });
    throw error;
  }
}
```

### 2. 更新支付控制器
```typescript
// backend/src/routes/payments/controller.ts
import { createMiniProgramPayment, verifyNotifySignature, decryptNotifyData } from '../../services/wechatPay';

/**
 * POST /payments/wechat/create - 创建微信支付订单
 */
export async function createWechatPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { taskId, amount, description } = req.body;

    // 1. 获取用户openid
    const user = await queryOne('SELECT wechat_openid FROM users WHERE id = $1', [userId]);
    if (!user || !user.wechat_openid) {
      throw new AppError(400, '请先绑定微信账号', 'WECHAT_NOT_BOUND');
    }

    // 2. 创建支付订单
    const orderId = `PAY_${Date.now()}_${userId.slice(0, 8)}`;
    const paymentResult = await createMiniProgramPayment({
      orderId,
      openid: user.wechat_openid,
      amount,
      description,
    });

    // 3. 保存订单记录
    await query(
      `INSERT INTO payments (id, task_id, student_id, gross_amount, status, payment_method)
       VALUES ($1, $2, $3, $4, 'pending', 'wechat')`,
      [orderId, taskId, userId, amount]
    );

    res.json({
      success: true,
      data: {
        orderId,
        paymentParams: paymentResult,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/wechat/notify - 微信支付回调
 */
export async function wechatPaymentNotify(req: Request, res: Response) {
  try {
    // 1. 验证签名
    const isValid = verifyNotifySignature(req.headers, req.body);
    if (!isValid) {
      logger.error('WeChat payment notify signature invalid');
      return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
    }

    // 2. 解密数据
    const { ciphertext, nonce, associated_data } = req.body.resource;
    const decryptedData = decryptNotifyData(ciphertext, nonce, associated_data);
    const paymentData = JSON.parse(decryptedData);

    // 3. 处理支付结果
    if (paymentData.trade_state === 'SUCCESS') {
      await withTransaction(async (client) => {
        // 更新支付状态
        await client.query(
          `UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = $1`,
          [paymentData.out_trade_no]
        );

        // 更新任务状态（如果是任务支付）
        const payment = await queryOne('SELECT task_id FROM payments WHERE id = $1', [paymentData.out_trade_no]);
        if (payment && payment.task_id) {
          await client.query(
            `UPDATE tasks SET payment_status = 'paid' WHERE id = $1`,
            [payment.task_id]
          );
        }
      });

      logger.info('WeChat payment success', { orderId: paymentData.out_trade_no });
    }

    // 4. 返回成功响应
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    logger.error('WeChat payment notify processing failed', { error });
    res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
}
```

### 3. 更新路由
```typescript
// backend/src/routes/payments/index.ts
router.post('/wechat/create', authenticate, controller.createWechatPayment);
router.post('/wechat/notify', controller.wechatPaymentNotify); // 不需要认证
```

---

## 📱 小程序端集成

### 1. 调用支付接口
```typescript
// miniapp/src/services/payment.ts
export async function payWithWechat(taskId: string, amount: number, description: string) {
  try {
    // 1. 创建支付订单
    const res = await Taro.request({
      url: `${API_BASE}/payments/wechat/create`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${getToken()}`,
      },
      data: { taskId, amount, description },
    });

    if (!res.data.success) {
      throw new Error(res.data.message);
    }

    const { orderId, paymentParams } = res.data.data;

    // 2. 调起微信支付
    await Taro.requestPayment({
      timeStamp: paymentParams.timeStamp,
      nonceStr: paymentParams.nonceStr,
      package: paymentParams.package,
      signType: paymentParams.signType,
      paySign: paymentParams.paySign,
    });

    // 3. 支付成功
    return { success: true, orderId };
  } catch (error: any) {
    if (error.errMsg === 'requestPayment:fail cancel') {
      throw new Error('用户取消支付');
    }
    throw error;
  }
}
```

### 2. 使用示例
```typescript
// miniapp/src/pages/tasks/detail.tsx
const handlePayment = async () => {
  try {
    Taro.showLoading({ title: '支付中...' });
    
    const result = await payWithWechat(
      taskId,
      taskDetail.budget_net,
      `启程OPC - ${taskDetail.title}`
    );

    Taro.hideLoading();
    Taro.showToast({ title: '支付成功', icon: 'success' });
    
    // 跳转到任务执行页面
    Taro.navigateTo({ url: `/pages/tasks/working?id=${taskId}` });
  } catch (error: any) {
    Taro.hideLoading();
    Taro.showToast({ title: error.message || '支付失败', icon: 'none' });
  }
};
```

---

## 🧪 测试流程

### 1. 沙箱环境测试
1. 使用微信支付提供的沙箱环境
2. 配置沙箱商户号和密钥
3. 使用测试金额（0.01元）进行测试

### 2. 真实环境测试
1. 配置生产环境商户号
2. 使用小额金额测试（1元）
3. 验证支付回调是否正常
4. 验证订单状态更新是否正确

---

## 🔒 安全注意事项

1. **证书安全**
   - 证书文件不要提交到Git
   - 使用环境变量管理敏感信息
   - 定期更换API密钥

2. **签名验证**
   - 必须验证回调签名
   - 防止伪造支付通知

3. **金额校验**
   - 回调时验证金额是否匹配
   - 防止金额篡改

4. **幂等性**
   - 支付回调可能重复
   - 使用订单号保证幂等性

---

## 📞 常见问题

### Q1: 支付失败，提示"商户号未配置"
**A:** 检查小程序是否已绑定商户号，在微信公众平台 -> 微信支付 -> 商户号管理中绑定。

### Q2: 回调接口收不到通知
**A:** 
1. 检查回调URL是否可公网访问
2. 检查URL是否使用HTTPS
3. 在商户平台查看回调日志

### Q3: 签名验证失败
**A:** 
1. 检查证书是否正确
2. 检查API密钥是否正确
3. 检查时间戳是否在有效期内

---

## 📚 参考文档

- [微信支付官方文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [小程序支付接入指南](https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_8_0.shtml)
- [wechatpay-node-v3 SDK](https://github.com/klover2/wechatpay-node-v3-ts)
