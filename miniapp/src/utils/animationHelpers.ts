/**
 * 动画工具函数库
 * 提供通用的动画辅助函数
 */

/**
 * 数字翻滚动画（老虎机效果）
 * @param element - DOM元素
 * @param target - 目标数字
 * @param duration - 动画时长（ms）
 * @param onComplete - 完成回调
 */
export function animateNumber(
  element: HTMLElement,
  target: number,
  duration: number = 800,
  onComplete?: () => void
) {
  const start = 0;
  const startTime = performance.now();
  const decimalPlaces = target % 1 !== 0 ? 2 : 0;

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用easeOut缓动
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * easeOut;

    element.textContent = current.toFixed(decimalPlaces);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toFixed(decimalPlaces);
      onComplete?.();
    }
  }

  requestAnimationFrame(update);
}

/**
 * 打字机效果
 * @param text - 要显示的文本
 * @param speed - 每个字符的延迟（ms）
 * @param onChar - 每个字符的回调
 * @param onComplete - 完成回调
 */
export function typewriterEffect(
  text: string,
  speed: number = 50,
  onChar?: (char: string, index: number) => void,
  onComplete?: () => void
): () => void {
  let index = 0;
  let timeoutId: NodeJS.Timeout;
  let cancelled = false;

  function type() {
    if (cancelled || index >= text.length) {
      if (!cancelled && index >= text.length) {
        onComplete?.();
      }
      return;
    }

    const char = text[index];
    onChar?.(char, index);
    index++;

    timeoutId = setTimeout(type, speed);
  }

  type();

  // 返回取消函数
  return () => {
    cancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * 交错动画延迟计算
 * @param index - 元素索引
 * @param baseDelay - 基础延迟（ms）
 * @param increment - 每个元素的增量（ms）
 */
export function staggerDelay(
  index: number,
  baseDelay: number = 0,
  increment: number = 100
): number {
  return baseDelay + index * increment;
}

/**
 * 弹性缓动函数
 * @param t - 进度 (0-1)
 * @param overshoot - 回弹幅度
 */
export function easeElastic(t: number, overshoot: number = 0.5): number {
  const c1 = 1.70158 * overshoot;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * 等待指定时间
 * @param ms - 毫秒数
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 震动反馈（微信小程序）
 * @param type - 震动类型
 */
export function vibrate(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof wx !== 'undefined' && wx.vibrateShort) {
    wx.vibrateShort({ type });
  }
}

/**
 * 播放音效（微信小程序）
 * @param src - 音频文件路径
 */
export function playSound(src: string) {
  if (typeof wx !== 'undefined' && wx.createInnerAudioContext) {
    const audio = wx.createInnerAudioContext();
    audio.src = src;
    audio.play();
    audio.onEnded(() => {
      audio.destroy();
    });
  }
}

/**
 * 序列动画执行器
 * @param animations - 动画数组，每项包含函数和延迟
 */
export async function sequence(
  animations: Array<{
    fn: () => void | Promise<void>;
    delay?: number;
  }>
) {
  for (const { fn, delay = 0 } of animations) {
    await fn();
    if (delay > 0) {
      await wait(delay);
    }
  }
}

/**
 * 并行动画执行器
 * @param animations - 动画函数数组
 */
export async function parallel(
  animations: Array<() => void | Promise<void>>
) {
  await Promise.all(animations.map(fn => fn()));
}

/**
 * 获取主题颜色
 */
export function getThemeColor(variable: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

/**
 * 设置主题颜色
 */
export function setThemeColor(variable: string, value: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(variable, value);
}

/**
 * 根据人格标签切换主题
 */
export function switchTheme(personaTag: string) {
  if (typeof document === 'undefined') return;
  document.body.setAttribute('data-persona', personaTag);
}

/**
 * 数字格式化
 */
export function formatNumber(num: number, decimalPlaces: number = 0): string {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

/**
 * 金额格式化
 */
export function formatCurrency(amount: number): string {
  return `¥${formatNumber(amount, 2)}`;
}

/**
 * 检测是否支持CSS属性
 */
export function supportsCSSProperty(property: string): boolean {
  if (typeof document === 'undefined') return false;
  return property in document.documentElement.style;
}

/**
 * 检测是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 动画时长调整（考虑用户偏好）
 */
export function adjustedDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}
