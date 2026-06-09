/**
 * 人格标签映射工具
 *
 * 这个文件是允许的映射，因为它只是UI显示的翻译，不是数据本身
 * 真实的人格标签数据来自后端API
 */

export const PERSONALITY_LABELS: Record<string, string> = {
  visual_storyteller: '视觉叙事者',
  system_builder: '系统构建者',
  creative_executor: '创意执行者',
  balanced_learner: '全面学习者'
};

export const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  visual_storyteller: '你擅长用画面讲故事，能看到各个元素之间的联系',
  system_builder: '你习惯先理解底层逻辑再动手，擅长设计规则和系统',
  creative_executor: '你享受从0到1的创作过程，喜欢快速出稿再打磨',
  balanced_learner: '你是一个全面发展的学习者'
};

/**
 * 获取人格标签的中文显示名称
 */
export function getPersonalityLabel(tag: string): string {
  return PERSONALITY_LABELS[tag] || tag;
}

/**
 * 获取人格标签的描述（备用）
 * 优先使用API返回的profile_summary
 */
export function getPersonalityDescription(tag: string): string {
  return PERSONALITY_DESCRIPTIONS[tag] || '';
}

/**
 * 获取人格标签的颜色（用于UI显示）
 */
export function getPersonalityColor(tag: string): string {
  const colors: Record<string, string> = {
    visual_storyteller: '#7c3aed', // 紫色
    system_builder: '#2563eb',     // 蓝色
    creative_executor: '#dc2626',  // 红色
    balanced_learner: '#16a34a'    // 绿色
  };
  return colors[tag] || '#6b7280'; // 默认灰色
}
