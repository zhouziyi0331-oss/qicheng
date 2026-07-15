import Taro from '@tarojs/taro';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { taskTranslationAPI } from '../../../services/api';
import './index.scss';

/**
 * 学生端 - 任务详情页（翻译版本）
 *
 * 功能：
 * 1. 显示启程老师的任务翻译
 * 2. 功能模块拆解
 * 3. 你需要做什么 / 你会学到什么
 * 4. 难度评估（多维度）
 * 5. 接受推荐任务
 */

interface TaskTranslation {
  taskId: string;
  studentFriendlyTitle: string;
  studentFriendlyDescription: string;
  functionalModules: FunctionalModule[];
  whatYouWillDo: string;
  whatYouWillLearn: string;
  estimatedHours: number;
  requiredSkills: SkillRequirement[];
  difficulty: DifficultyAssessment;
  learningValue: number;
  careerImpact: number;
}

interface FunctionalModule {
  module: string;
  description: string;
  skills: string[];
  difficulty: number;
  estimatedHours: number;
}

interface SkillRequirement {
  skill: string;
  proficiency: number;
  weight: number;
  why: string;
}

interface DifficultyAssessment {
  technical: number;
  cognitive: number;
  execution: number;
  communication: number;
  overall: number;
}

export default function TaskDetailTranslatedPage() {
  const [taskId, setTaskId] = useState('');
  const [translation, setTranslation] = useState<TaskTranslation | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const id = instance.router?.params?.taskId;
    if (id) {
      setTaskId(id);
      fetchTranslation(id);
    }
  }, []);

  // 获取任务翻译
  const fetchTranslation = async (id: string) => {
    try {
      setLoading(true);

      const res = await taskTranslationAPI.getTranslation(id);

      if (res.success) {
        setTranslation(res.data.translation);
      }
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 切换模块展开/收起
  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  // 接受推荐任务
  const acceptRecommendation = async () => {
    try {
      const res = await taskTranslationAPI.acceptRecommendation(taskId);

      if (res.success) {
        Taro.showToast({
          title: '已接受任务推荐',
          icon: 'success',
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    } catch (error) {
      Taro.showToast({
        title: '操作失败',
        icon: 'none',
      });
    }
  };

  // 获取难度颜色
  const getDifficultyColor = (value: number) => {
    if (value >= 8) return '#f5222d';
    if (value >= 6) return '#faad14';
    if (value >= 4) return '#1890ff';
    return '#52c41a';
  };

  if (loading) {
    return (
      <View className='task-detail-translated-page'>
        <View className='loading'>加载中...</View>
      </View>
    );
  }

  if (!translation) {
    return (
      <View className='task-detail-translated-page'>
        <View className='error'>任务翻译不存在</View>
      </View>
    );
  }

  return (
    <View className='task-detail-translated-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='teacher-badge'>
          <Text className='teacher-icon'>●‍●</Text>
          <Text className='teacher-text'>启程老师帮你理解这个任务</Text>
        </View>
        <View className='task-title'>{translation.studentFriendlyTitle}</View>
      </View>

      <ScrollView scrollY className='content'>
        {/* 任务描述 */}
        <View className='section'>
          <View className='section-title'>▪ 任务简介</View>
          <View className='section-content'>
            <Text className='description-text'>
              {translation.studentFriendlyDescription}
            </Text>
          </View>
        </View>

        {/* 功能模块拆解 */}
        <View className='section'>
          <View className='section-title'>● 功能模块拆解</View>
          <View className='modules-list'>
            {translation.functionalModules.map((module, index) => (
              <View key={index} className='module-card'>
                <View
                  className='module-header'
                  onClick={() => toggleModule(index)}
                >
                  <View className='module-info'>
                    <Text className='module-name'>{module.module}</Text>
                    <View className='module-meta'>
                      <Text className='module-hours'>
                        ~{module.estimatedHours}小时
                      </Text>
                      <Text
                        className='module-difficulty'
                        style={{
                          color: getDifficultyColor(module.difficulty),
                        }}
                      >
                        难度{module.difficulty}/10
                      </Text>
                    </View>
                  </View>
                  <Text className='expand-icon'>
                    {expandedModules.has(index) ? '▼' : '▶'}
                  </Text>
                </View>

                {expandedModules.has(index) && (
                  <View className='module-body'>
                    <View className='module-description'>
                      {module.description}
                    </View>
                    <View className='module-skills'>
                      <Text className='skills-label'>需要技能：</Text>
                      {module.skills.map((skill, idx) => (
                        <View key={idx} className='skill-tag'>
                          {skill}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 你需要做什么 */}
        <View className='section'>
          <View className='section-title'>✓ 你需要做什么</View>
          <View className='section-content'>
            <Text className='content-text'>{translation.whatYouWillDo}</Text>
          </View>
        </View>

        {/* 你会学到什么 */}
        <View className='section highlight'>
          <View className='section-title'>◆ 你会学到什么</View>
          <View className='section-content'>
            <Text className='content-text'>{translation.whatYouWillLearn}</Text>
          </View>
        </View>

        {/* 技能要求 */}
        <View className='section'>
          <View className='section-title'>● 技能要求</View>
          <View className='skills-list'>
            {translation.requiredSkills.map((skill, index) => (
              <View key={index} className='skill-item'>
                <View className='skill-header'>
                  <Text className='skill-name'>{skill.skill}</Text>
                  <Text className='skill-proficiency'>
                    需要熟练度: {Math.round(skill.proficiency * 100)}%
                  </Text>
                </View>
                <View className='skill-bar'>
                  <View
                    className='skill-fill'
                    style={{
                      width: `${skill.proficiency * 100}%`,
                      background: getDifficultyColor(skill.proficiency * 10),
                    }}
                  />
                </View>
                <View className='skill-why'>{skill.why}</View>
              </View>
            ))}
          </View>
        </View>

        {/* 难度评估 */}
        <View className='section'>
          <View className='section-title'>● 难度评估</View>
          <View className='difficulty-chart'>
            {[
              { key: 'technical', label: '技术难度' },
              { key: 'cognitive', label: '认知难度' },
              { key: 'execution', label: '执行难度' },
              { key: 'communication', label: '沟通难度' },
            ].map((item) => {
              const value = translation.difficulty[item.key as keyof DifficultyAssessment];
              return (
                <View key={item.key} className='difficulty-item'>
                  <Text className='difficulty-label'>{item.label}</Text>
                  <View className='difficulty-bar'>
                    <View
                      className='difficulty-fill'
                      style={{
                        width: `${(value / 10) * 100}%`,
                        background: getDifficultyColor(value),
                      }}
                    />
                  </View>
                  <Text
                    className='difficulty-value'
                    style={{ color: getDifficultyColor(value) }}
                  >
                    {value}/10
                  </Text>
                </View>
              );
            })}

            <View className='overall-difficulty'>
              <Text className='overall-label'>综合难度</Text>
              <Text
                className='overall-value'
                style={{
                  color: getDifficultyColor(translation.difficulty.overall),
                }}
              >
                {translation.difficulty.overall}/10
              </Text>
            </View>
          </View>
        </View>

        {/* 成长价值 */}
        <View className='section'>
          <View className='section-title'>● 成长价值</View>
          <View className='value-cards'>
            <View className='value-card'>
              <Text className='value-icon'>●</Text>
              <Text className='value-label'>学习价值</Text>
              <Text className='value-score'>
                {Math.round(translation.learningValue * 100)}%
              </Text>
            </View>
            <View className='value-card'>
              <Text className='value-icon'>●</Text>
              <Text className='value-label'>职业影响</Text>
              <Text className='value-score'>
                {Math.round(translation.careerImpact * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 预计工作时间 */}
        <View className='section'>
          <View className='time-estimate'>
            <Text className='time-icon'>●</Text>
            <Text className='time-text'>
              预计工作时间: {translation.estimatedHours} 小时
            </Text>
          </View>
        </View>

        {/* 底部占位 */}
        <View style={{ height: '200px' }} />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <Button className='accept-btn' onClick={acceptRecommendation}>
          接受这个任务
        </Button>
      </View>
    </View>
  );
}
