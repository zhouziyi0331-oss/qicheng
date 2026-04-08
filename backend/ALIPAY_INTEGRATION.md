# 支付宝支付集成指南

## 📋 前置准备

### 1. 申请支付宝商家账号
1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 注册并创建应用
3. 提交企业资质审核
4. 获取以下信息：
   - AppID
   - 应用私钥（privateKey）
   - 支付宝公钥（alipayPublicKey）

### 2. 配置应用
1. 登录支付宝开放平台
2. 进入"我的应用"
3. 配置应用信息：
   - 应用网关（回调地址）
   - 授权回调地址
   - 接口加签方式（RSA2）

---

## 🔧 环境配置

### 1. 安装依赖
```bash
cd backend
npm install alipay-sdk
```

### 2. 配置环境变量
在 `backend/.env` 中添加：
```env
# 支付宝配置
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAltIRd...
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://api.qicheng.com/api/v1/payments/alipay/notify
ALIPAY_RETURN_URL=https://qicheng.com/payment/success
```

### 3. 生成密钥对
```bash
# 使用支付宝提供的密钥生成工具
# 下载地址：https://opendocs.alipay.com/common/02kipl
```

---

## 💻 代码实现

### 1. 创建支付宝支付服务
```typescript
// backend/src/services/alipay.ts
import AlipaySdk from 'alipay-sdk';
import AlipayFormData from 'alipay-sdk/lib/form';
import { config } from '../../config';
import logger from '../utils/logger';

const alipaySdk = new AlipaySdk({
  appId: config.alipay.appId,
  privateKey: config.alipay.privateKey,
  alipayPublicKey: config.alipay.publicKey,
  gateway: config.alipay.gateway,
  signType: 'RSA2',
  charset: 'utf-8',
  version: '1.0',
});

/**
 * 创建H5支付订单（网页端）
 */
export async function createWebPayment(params: {
  orderId: string;
  amount: number;
  subject: string;
  body?: string;
}) {
  try {
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('notifyUrl', config.alipay.notifyUrl);
    formData.addField('returnUrl', config.alipay.returnUrl);
    formData.addField('bizContent', {
      outTradeNo: params.orderId,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: params.amount.toFixed(2),
      subject: params.subject,
      body: params.body || params.subject,
    });

    const result = await alipaySdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData }
    );

    logger.info('Alipay web payment created', { orderId: params.orderId });
    return result;
  } catch (error) {
    logger.error('Alipay web payment creation failed', { error, orderId: params.orderId });
    throw error;
  }
}

/**
 * 创建手机网站支付（H5）
 */
export async function createH5Payment(params: {
  orderId: string;
  amount: number;
  subject: string;
  body?: string;
}) {
  try {
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('notifyUrl', config.alipay.notifyUrl);
    formData.addField('returnUrl', config.alipay.returnUrl);
    formData.addField('bizContent', {
      outTradeNo: params.orderId,
      productCode: 'QUICK_WAP_WAY',
      totalAmount: params.amount.toFixed(2),
      subject: params.subject,
      body: params.body || params.subject,
      quitUrl: config.alipay.returnUrl,
    });

    const result = await alipaySdk.exec(
      'alipay.trade.wap.pay',
      {},
      { formData }
    );

    logger.info('Alipay H5 payment created', { orderId: params.orderId });
    return result;
  } catch (error) {
    logger.error('Alipay H5 payment creation failed', { error, orderId: params.orderId });
    throw error;
  }
}

/**
 * 查询订单状态
 */
export async function queryPaymentStatus(orderId: string) {
  try {
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: {
        outTradeNo: orderId,
      },
    });

    return result;
  } catch (error) {
    logger.error('Alipay payment query failed', { error, orderId });
    throw error;
  }
}

/**
 * 申请退款
 */
export async function refundPayment(params: {
  orderId: string;
  refundAmount: number;
  refundReason: string;
}) {
  try {
    const result = await alipaySdk.exec('alipay.trade.refund', {
      bizContent: {
        outTradeNo: params.orderId,
        refundAmount: params.refundAmount.toFixed(2),
        refundReason: params.refundReason,
      },
    });

    logger.info('Alipay refund created', { orderId: params.orderId });
    return result;
  } catch (error) {
    logger.error('Alipay refund failed', { error, orderId: params.orderId });
    throw error;
  }
}

/**
 * 验证支付回调签名
 */
export function verifyNotifySignature(postData: any): boolean {
  try {
    return alipaySdk.checkNotifySign(postData);
  } catch (error) {
    logger.error('Alipay notify signature verification failed', { error });
    return false;
  }
}

/**
 * 转账到支付宝账户（提现功能）
 */
export async function transferToAccount(params: {
  orderId: string;
  alipayAccount: string;
  realName: string;
  amount: number;
  remark?: string;
}) {
  try {
    const result = await alipaySdk.exec('alipay.fund.trans.uni.transfer', {
      bizContent: {
        outBizNo: params.orderId,
        transAmount: params.amount.toFixed(2),
        productCode: 'TRANS_ACCOUNT_NO_PWD',
        bizScene: 'DIRECT_TRANSFER',
        orderTitle: '启程OPC提现',
        payeeInfo: {
          identity: params.alipayAccount,
          identityType: 'ALIPAY_LOGON_ID',
          name: params.realName,
        },
        remark: params.remark || '启程OPC平台提现',
      },
    });

    logger.info('Alipay transfer created', { orderId: params.orderId });
    return result;
  } catch (error) {
    logger.error('Alipay transfer failed', { error, orderId: params.orderId });
    throw error;
  }
}
```

### 2. 更新支付控制器
```typescript
// backend/src/routes/payments/controller.ts
import { createWebPayment, createH5Payment, verifyNotifySignature } from '../../services/alipay';

/**
 * POST /payments/alipay/create - 创建支付宝支付订单
 */
export async function createAlipayPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { taskId, amount, subject, paymentType = 'web' } = req.body;

    // 1. 创建支付订单
    const orderId = `PAY_${Date.now()}_${userId.slice(0, 8)}`;
    
    let paymentUrl;
    if (paymentType === 'h5') {
      paymentUrl = await createH5Payment({
        orderId,
        amount,
        subject,
        body: `启程OPC - ${subject}`,
      });
    } else {
      paymentUrl = await createWebPayment({
        orderId,
        amount,
        subject,
        body: `启程OPC - ${subject}`,
      });
    }

    // 2. 保存订单记录
    await query(
      `INSERT INTO payments (id, task_id, student_id, gross_amount, status, payment_method)
       VALUES ($1, $2, $3, $4, 'pending', 'alipay')`,
      [orderId, taskId, userId, amount]
    );

    res.json({
      success: true,
      data: {
        orderId,
        paymentUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/alipay/notify - 支付宝支付回调
 */
export async function alipayPaymentNotify(req: Request, res: Response) {
  try {
    // 1. 验证签名
    const isValid = verifyNotifySignature(req.body);
    if (!isValid) {
      logger.error('Alipay payment notify signature invalid');
      return res.send('fail');
    }

    const { out_trade_no, trade_status, total_amount } = req.body;

    // 2. 处理支付结果
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      await withTransaction(async (client) => {
        // 更新支付状态
        await client.query(
          `UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = $1`,
          [out_trade_no]
        );

        // 更新任务状态
        const payment = await queryOne('SELECT task_id FROM payments WHERE id = $1', [out_trade_no]);
        if (payment && payment.task_id) {
          await client.query(
            `UPDATE tasks SET payment_status = 'paid' WHERE id = $1`,
            [payment.task_id]
          );
        }
      });

      logger.info('Alipay payment success', { orderId: out_trade_no });
    }

    // 3. 返回成功响应
    res.send('success');
  } catch (error) {
    logger.error('Alipay payment notify processing failed', { error });
    res.send('fail');
  }
}

/**
 * POST /payments/alipay/withdraw - 支付宝提现
 */
export async function alipayWithdraw(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { amount, alipayAccount, realName } = req.body;

    // 1. 验证余额
    const balance = await queryOne(
      'SELECT balance FROM student_balances WHERE user_id = $1',
      [userId]
    );

    if (!balance || balance.balance < amount) {
      throw new AppError(400, '余额不足', 'INSUFFICIENT_BALANCE');
    }

    if (amount < 10) {
      throw new AppError(400, '提现金额不能低于10元', 'AMOUNT_TOO_LOW');
    }

    // 2. 创建提现订单
    const withdrawId = `WD_${Date.now()}_${userId.slice(0, 8)}`;

    await withTransaction(async (client) => {
      // 扣除余额
      await client.query(
        `UPDATE student_balances
         SET balance = balance - $1, updated_at = NOW()
         WHERE user_id = $2`,
        [amount, userId]
      );

      // 创建提现记录
      await client.query(
        `INSERT INTO withdrawals
         (id, user_id, amount, withdraw_method, account_info, status)
         VALUES ($1, $2, $3, 'alipay', $4, 'processing')`,
        [withdrawId, userId, amount, JSON.stringify({ alipayAccount, realName })]
      );

      // 调用支付宝转账接口
      const transferResult = await transferToAccount({
        orderId: withdrawId,
        alipayAccount,
        realName,
        amount,
        remark: '启程OPC平台提现',
      });

      // 更新提现状态
      if (transferResult.code === '10000') {
        await client.query(
          `UPDATE withdrawals SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [withdrawId]
        );
      } else {
        // 转账失败，退回余额
        await client.query(
          `UPDATE student_balances SET balance = balance + $1 WHERE user_id = $2`,
          [amount, userId]
        );
        await client.query(
          `UPDATE withdrawals SET status = 'failed', failed_reason = $1 WHERE id = $2`,
          [transferResult.msg, withdrawId]
        );
        throw new AppError(500, '提现失败：' + transferResult.msg, 'WITHDRAW_FAILED');
      }
    });

    logger.info('Alipay withdraw success', { userId, withdrawId, amount });

    res.json({
      success: true,
      message: '提现成功',
      data: { withdrawId },
    });
  } catch (err) {
    next(err);
  }
}
```

### 3. 更新路由
```typescript
// backend/src/routes/payments/index.ts
router.post('/alipay/create', authenticate, controller.createAlipayPayment);
router.post('/alipay/notify', controller.alipayPaymentNotify); // 不需要认证
router.post('/alipay/withdraw', authenticate, controller.alipayWithdraw);
```

---

## 🌐 前端集成

### 1. 网页端支付
```typescript
// frontend/lib/payment.ts
export async function payWithAlipay(taskId: string, amount: number, subject: string) {
  try {
    const res = await axios.post('/api/v1/payments/alipay/create', {
      taskId,
      amount,
      subject,
      paymentType: 'web',
    });

    if (res.data.success) {
      // 跳转到支付宝支付页面
      window.location.href = res.data.data.paymentUrl;
    }
  } catch (error) {
    console.error('Alipay payment failed', error);
    throw error;
  }
}
```

### 2. 移动端H5支付
```typescript
// frontend/lib/payment.ts
export async function payWithAlipayH5(taskId: string, amount: number, subject: string) {
  try {
    const res = await axios.post('/api/v1/payments/alipay/create', {
      taskId,
      amount,
      subject,
      paymentType: 'h5',
    });

    if (res.data.success) {
      // 跳转到支付宝H5支付页面
      window.location.href = res.data.data.paymentUrl;
    }
  } catch (error) {
    console.error('Alipay H5 payment failed', error);
    throw error;
  }
}
```

### 3. 提现功能
```typescript
// frontend/app/withdraw/page.tsx
const handleWithdraw = async () => {
  try {
    const res = await axios.post('/api/v1/payments/alipay/withdraw', {
      amount: withdrawAmount,
      alipayAccount: alipayAccount,
      realName: realName,
    });

    if (res.data.success) {
      alert('提现成功，预计2小时内到账');
      router.push('/profile');
    }
  } catch (error: any) {
    alert(error.response?.data?.message || '提现失败');
  }
};
```

---

## 🧪 测试流程

### 1. 沙箱环境测试
1. 使用支付宝提供的沙箱环境
2. 下载沙箱版支付宝APP
3. 使用沙箱账号登录测试

### 2. 真实环境测试
1. 配置生产环境AppID和密钥
2. 使用小额金额测试（0.01元）
3. 验证支付回调是否正常
4. 验证提现功能是否正常

---

## 🔒 安全注意事项

1. **密钥安全**
   - 私钥不要提交到Git
   - 使用环境变量管理
   - 定期更换密钥

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

### Q1: 支付失败，提示"应用未上线"
**A:** 在支付宝开放平台将应用上线，或使用沙箱环境测试。

### Q2: 回调接口收不到通知
**A:** 
1. 检查回调URL是否可公网访问
2. 检查URL是否使用HTTPS
3. 在开放平台查看回调日志

### Q3: 签名验证失败
**A:** 
1. 检查私钥和公钥是否匹配
2. 检查签名方式是否为RSA2
3. 检查字符编码是否为UTF-8

### Q4: 提现失败
**A:**
1. 检查是否开通转账权限
2. 检查收款账户是否正确
3. 检查实名信息是否匹配

---

## 📚 参考文档

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [电脑网站支付](https://opendocs.alipay.com/open/270/105898)
- [手机网站支付](https://opendocs.alipay.com/open/203/105288)
- [单笔转账](https://opendocs.alipay.com/open/02byuo)
- [alipay-sdk npm包](https://www.npmjs.com/package/alipay-sdk)
