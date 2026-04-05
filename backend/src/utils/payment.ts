import crypto from 'crypto';

interface WechatPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

interface AlipayParams {
  orderString: string;
}

/**
 * 生成微信支付参数
 * 文档: https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_4.shtml
 */
export function generateWechatPayParams(
  orderId: string,
  amount: number,
  description: string
): WechatPayParams {
  const appId = process.env.WECHAT_APP_ID || 'wx_demo_app_id';
  const mchId = process.env.WECHAT_MCH_ID || 'mch_demo_id';
  const apiKey = process.env.WECHAT_API_KEY || 'demo_key_32_characters_long!!!';

  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const prepayId = `prepay_id_${orderId}_${Date.now()}`;

  // 签名字符串
  const signStr = [
    appId,
    timeStamp,
    nonceStr,
    `prepay_id=${prepayId}`,
  ].join('\n') + '\n';

  // HMAC-SHA256 签名
  const paySign = crypto
    .createHmac('sha256', apiKey)
    .update(signStr)
    .digest('hex')
    .toUpperCase();

  return {
    appId,
    timeStamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'HMAC-SHA256',
    paySign,
  };
}

/**
 * 生成支付宝支付参数
 * 文档: https://opendocs.alipay.com/open/204/105051
 */
export function generateAlipayParams(
  orderId: string,
  amount: number,
  subject: string
): AlipayParams {
  const appId = process.env.ALIPAY_APP_ID || '2021000000000000';
  const privateKey = process.env.ALIPAY_PRIVATE_KEY || 'demo_private_key';

  const bizContent = JSON.stringify({
    out_trade_no: orderId,
    total_amount: (amount / 100).toFixed(2),
    subject,
    product_code: 'QUICK_MSECURITY_PAY',
  });

  const params: Record<string, string> = {
    app_id: appId,
    method: 'alipay.trade.app.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    version: '1.0',
    biz_content: bizContent,
  };

  // 排序并拼接
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');

  // RSA2 签名 (生产环境需要真实私钥)
  const sign = crypto
    .createSign('RSA-SHA256')
    .update(signStr)
    .sign(privateKey, 'base64');

  params.sign = sign;

  // 返回完整订单字符串
  const orderString = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');

  return { orderString };
}

/**
 * 验证微信支付回调签名
 */
export function verifyWechatSignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string
): boolean {
  const apiKey = process.env.WECHAT_API_KEY || 'demo_key_32_characters_long!!!';

  const signStr = [timestamp, nonce, body].join('\n') + '\n';
  const expectedSign = crypto
    .createHmac('sha256', apiKey)
    .update(signStr)
    .digest('hex')
    .toUpperCase();

  return signature === expectedSign;
}

/**
 * 验证支付宝回调签名
 */
export function verifyAlipaySignature(
  params: Record<string, string>,
  signature: string
): boolean {
  const publicKey = process.env.ALIPAY_PUBLIC_KEY || 'demo_public_key';

  // 移除 sign 和 sign_type
  const { sign, sign_type, ...rest } = params;

  // 排序并拼接
  const sortedKeys = Object.keys(rest).sort();
  const signStr = sortedKeys.map(k => `${k}=${rest[k]}`).join('&');

  // RSA2 验签
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(signStr);

  try {
    return verify.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}
