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
export declare function generateWechatPayParams(orderId: string, amount: number, description: string): WechatPayParams;
/**
 * 生成支付宝支付参数
 * 文档: https://opendocs.alipay.com/open/204/105051
 */
export declare function generateAlipayParams(orderId: string, amount: number, subject: string): AlipayParams;
/**
 * 验证微信支付回调签名
 */
export declare function verifyWechatSignature(timestamp: string, nonce: string, body: string, signature: string): boolean;
/**
 * 验证支付宝回调签名
 */
export declare function verifyAlipaySignature(params: Record<string, string>, signature: string): boolean;
export {};
//# sourceMappingURL=payment.d.ts.map