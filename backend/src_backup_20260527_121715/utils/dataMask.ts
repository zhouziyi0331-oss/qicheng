/**
 * 数据脱敏工具
 */

/**
 * 手机号脱敏
 * 138****0099
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const phoneStr = String(phone);
  if (phoneStr.length !== 11) return phoneStr;
  return phoneStr.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 邮箱脱敏
 * abc***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const emailStr = String(email);
  const [username, domain] = emailStr.split('@');
  if (!domain) return emailStr;

  if (username.length <= 3) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.slice(0, 3)}***@${domain}`;
}

/**
 * 身份证脱敏
 * 110***********1234
 */
export function maskIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '';
  const idCardStr = String(idCard);
  if (idCardStr.length < 8) return idCardStr;
  return idCardStr.replace(/(\d{3})\d+(\d{4})/, '$1***********$2');
}

/**
 * 银行卡脱敏
 * 6222 **** **** 1234
 */
export function maskBankCard(bankCard: string | null | undefined): string {
  if (!bankCard) return '';
  const cardStr = String(bankCard).replace(/\s/g, '');
  if (cardStr.length < 8) return cardStr;
  return cardStr.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
}

/**
 * 姓名脱敏
 * 张三 -> 张*
 * 欧阳娜娜 -> 欧阳**
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return '';
  const nameStr = String(name);
  if (nameStr.length <= 1) return nameStr;
  if (nameStr.length === 2) {
    return nameStr[0] + '*';
  }
  // 复姓保留前两个字
  return nameStr.slice(0, 2) + '*'.repeat(nameStr.length - 2);
}

/**
 * 根据管理员权限决定是否脱敏
 */
export function maskDataByPermission(
  data: any,
  adminRole: string,
  sensitiveFields: string[] = ['phone', 'email', 'id_card', 'bank_card']
): any {
  // 超级管理员可以看到所有数据
  if (adminRole === 'super_admin') {
    return data;
  }

  // 普通管理员需要脱敏
  const maskedData = { ...data };

  sensitiveFields.forEach(field => {
    if (maskedData[field]) {
      switch (field) {
        case 'phone':
          maskedData[field] = maskPhone(maskedData[field]);
          break;
        case 'email':
          maskedData[field] = maskEmail(maskedData[field]);
          break;
        case 'id_card':
          maskedData[field] = maskIdCard(maskedData[field]);
          break;
        case 'bank_card':
          maskedData[field] = maskBankCard(maskedData[field]);
          break;
        case 'name':
          maskedData[field] = maskName(maskedData[field]);
          break;
      }
    }
  });

  return maskedData;
}

/**
 * 批量脱敏数组数据
 */
export function maskArrayData(
  dataArray: any[],
  adminRole: string,
  sensitiveFields: string[] = ['phone', 'email']
): any[] {
  if (adminRole === 'super_admin') {
    return dataArray;
  }

  return dataArray.map(item => maskDataByPermission(item, adminRole, sensitiveFields));
}
