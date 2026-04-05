/**
 * 联系方式过滤中间件测试
 * 覆盖: 电话/微信/QQ/邮箱 被屏蔽，正常内容通过
 */
import { filterContactInfo } from '../../src/middleware/contactFilter';

describe('Contact Filter — 联系方式过滤', () => {
  // Returns { filtered: string, wasFiltered: boolean }
  const filter = (text: string) => filterContactInfo(text).filtered;

  describe('手机号过滤', () => {
    it('应过滤 11 位手机号', () => {
      expect(filter('我的手机是13812345678欢迎联系')).not.toContain('13812345678');
    });

    it('应过滤带连字符的手机号', () => {
      expect(filter('138-1234-5678')).not.toContain('138-1234-5678');
    });

    it('应过滤带空格的手机号', () => {
      expect(filter('138 1234 5678')).not.toContain('138 1234 5678');
    });
  });

  describe('微信号过滤', () => {
    it('应过滤「微信」关键词后的账号', () => {
      const result = filter('微信:myhandle123');
      expect(result).not.toContain('myhandle123');
    });

    it('应过滤「wx:」关键词后的账号', () => {
      const result = filter('wx:handle_abc');
      expect(result).not.toContain('handle_abc');
    });

    it('应过滤「weixin:」关键词', () => {
      const result = filter('weixin:user123abc');
      expect(result).not.toContain('user123abc');
    });
  });

  describe('QQ 号过滤', () => {
    it('应过滤 QQ号: 格式', () => {
      const result = filter('QQ号:123456789');
      expect(result).not.toContain('123456789');
    });
  });

  describe('正常内容不应被过滤', () => {
    it('普通文字不受影响', () => {
      const text = '我完成了第一步，正在处理第二步，请查看';
      expect(filter(text)).toBe(text);
    });

    it('任务编号中的数字不受影响', () => {
      const text = '任务ID: TASK-20240101-001';
      expect(filter(text)).toBe(text);
    });

    it('金额描述不受影响', () => {
      const text = '这个任务预算是200元';
      expect(filter(text)).toBe(text);
    });
  });
});
