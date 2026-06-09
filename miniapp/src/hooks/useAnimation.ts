import { useState, useEffect, useCallback } from 'react';
import { animateNumber as animateNumberHelper } from '../utils/animationHelpers';

/**
 * 打字机效果Hook
 * @param text - 要显示的文本
 * @param speed - 每个字符的延迟（ms）
 */
export function useTypingEffect(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, speed]);

  const reset = useCallback(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, []);

  return { displayText, isComplete, reset };
}

/**
 * 数字翻滚动画Hook
 * @param target - 目标数字
 * @param duration - 动画时长（ms）
 */
export function useNumberAnimation(target: number, duration: number = 800) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const start = 0;
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOut
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * easeOut;

      setCurrent(value);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setCurrent(target);
        setIsAnimating(false);
      }
    }

    requestAnimationFrame(update);
  }, [target, duration]);

  return { current, isAnimating };
}

/**
 * 延迟显示Hook（交错动画用）
 * @param delay - 延迟时间（ms）
 */
export function useDelayedShow(delay: number = 0) {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timeout = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timeout);
    }
  }, [delay]);

  return show;
}

/**
 * 动画序列控制Hook
 */
export function useAnimationSequence(steps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= steps) {
        setIsComplete(true);
      }
      return next;
    });
  }, [steps]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsComplete(false);
  }, []);

  return { currentStep, isComplete, nextStep, reset };
}

/**
 * 主题切换Hook
 */
export function useTheme() {
  const [theme, setTheme] = useState<string>('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const persona = document.body.getAttribute('data-persona') || '';
      setTheme(persona);
    }
  }, []);

  const switchTheme = useCallback((personaTag: string) => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-persona', personaTag);
      setTheme(personaTag);
    }
  }, []);

  const getThemeColor = useCallback((variable: string): string => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  }, []);

  return { theme, switchTheme, getThemeColor };
}

/**
 * 可见性检测Hook（用于入场动画）
 */
export function useInView(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasBeenInView(true);
        }
      },
      options
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { isInView, hasBeenInView };
}

/**
 * 动画状态管理Hook
 */
export function useAnimationState(initialState: string = 'idle') {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<string[]>([initialState]);

  const transition = useCallback((newState: string) => {
    setState(newState);
    setHistory(prev => [...prev, newState]);
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setHistory([initialState]);
  }, [initialState]);

  return { state, history, transition, reset };
}

/**
 * 震动反馈Hook
 */
export function useVibrate() {
  const vibrate = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof wx !== 'undefined' && wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  }, []);

  return vibrate;
}

/**
 * 音效播放Hook
 */
export function useSound() {
  const play = useCallback((src: string) => {
    if (typeof wx !== 'undefined' && wx.createInnerAudioContext) {
      const audio = wx.createInnerAudioContext();
      audio.src = src;
      audio.play();
      audio.onEnded(() => {
        audio.destroy();
      });
    }
  }, []);

  return { play };
}
