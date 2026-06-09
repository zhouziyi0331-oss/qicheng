import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

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

interface Difficulty {
  technical: number;
  cognitive: number;
  execution: number;
  communication: number;
  overall: number;
}

interface TaskTranslation {
  taskId: string;
  studentFriendlyTitle: string;
  studentFriendlyDescription: string;
  functionalModules: FunctionalModule[];
  whatYouWillDo: string;
  whatYouWillLearn: string;
  estimatedHours: number;
  requiredSkills: SkillRequirement[];
  difficulty: Difficulty;
  learningValue: number;
  careerImpact: number;
}

interface Props {
  taskId: string;
}

export default function TaskTranslation({ taskId }: Props) {
  const [translation, setTranslation] = useState<TaskTranslation | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  useEffect(() => {
    loadTranslation();
  }, [taskId]);

  const loadTranslation = async () => {
    setLoading(true);
    try {
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${taskId}/translation`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setTranslation(res.data.translation);
      }
    } catch (error) {
      console.error('加载任务翻译失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    const stars = Math.round(difficulty / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return '#52c41a';
    if (difficulty <= 6) return '#faad14';
    return '#ff4d4f';
  };

  const getProficiencyLabel = (proficiency: number) => {
    if (proficiency >= 0.8) return '熟练';
    if (proficiency >= 0.6) return '中等';
    return '入门';
  };

  if (loading) {
    return (
      <View className="task-translation loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!translation) {
    return null;
  }

  return (
    <View className="task-translation">
      <View className="translation-header">
        <View className="header-icon">👨‍🏫</View>
        <View className="header-content">
          <Text className="header-title">启程老师帮你理解这个任务</Text>
          <Text className="header-subtitle">用通俗易懂的语言解释任务内容</Text>
        </View>
      </View>

      <View className="section friendly-description">
        <View className="section-header">
          <Text className="section-icon">📝</Text>
          <Text className="section-title">任务简介</Text>
        </View>
        <Text className="description-text">{translation.studentFriendlyDescription}</Text>
      </View>

      <View className="section modules">
        <View className="section-header">
          <Text className="section-icon">🧩</Text>
          <Text className="section-title">功能模块拆解</Text>
        </View>
        {translation.functionalModules.map((module, index) => (
          <View
            key={index}
            className={`module-card ${expandedModule === index ? 'expanded' : ''}`}
            onClick={() => setExpandedModule(expandedModule === index ? null : index)}
          >
            <View className="module-header">
              <View className="module-info">
                <Text className="module-name">{module.module}</Text>
                <View className="module-meta">
                  <Text className="module-difficulty">
                    难度: {getDifficultyStars(module.difficulty)}
                  </Text>
                  <Text className="module-time">约{module.estimatedHours}小时</Text>
                </View>
              </View>
              <Text className="expand-icon">{expandedModule === index ? '▼' : '▶'}</Text>
            </View>
            {expandedModule === index && (
              <View className="module-content">
                <Text className="module-description">{module.description}</Text>
                <View className="module-skills">
                  <Text className="skills-label">需要技能：</Text>
                  {module.skills.map((skill, idx) => (
                    <View key={idx} className="skill-tag">
                      {skill}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="section what-to-do">
        <View className="section-header">
          <Text className="section-icon">✅</Text>
          <Text className="section-title">你需要做什么</Text>
        </View>
        <Text className="content-text">{translation.whatYouWillDo}</Text>
      </View>

      <View className="section what-to-learn">
        <View className="section-header">
          <Text className="section-icon">📚</Text>
          <Text className="section-title">你会学到什么</Text>
        </View>
        <Text className="content-text">{translation.whatYouWillLearn}</Text>
      </View>

      <View className="section skills-required">
        <View className="section-header">
          <Text className="section-icon">🛠️</Text>
          <Text className="section-title">技能要求</Text>
        </View>
        {translation.requiredSkills.map((skill, index) => (
          <View key={index} className="skill-item">
            <View className="skill-header">
              <Text className="skill-name">{skill.skill}</Text>
              <Text className="skill-proficiency">{getProficiencyLabel(skill.proficiency)}</Text>
            </View>
            <View className="skill-bar">
              <View
                className="skill-bar-fill"
                style={{ width: `${skill.proficiency * 100}%` }}
              />
            </View>
            <Text className="skill-why">{skill.why}</Text>
          </View>
        ))}
      </View>

      <View className="section difficulty-assessment">
        <View className="section-header">
          <Text className="section-icon">📊</Text>
          <Text className="section-title">难度评估</Text>
        </View>
        <View className="difficulty-grid">
          <View className="difficulty-item">
            <Text className="difficulty-label">技术难度</Text>
            <Text
              className="difficulty-value"
              style={{ color: getDifficultyColor(translation.difficulty.technical) }}
            >
              {translation.difficulty.technical.toFixed(1)}
            </Text>
            <Text className="difficulty-stars">
              {getDifficultyStars(translation.difficulty.technical)}
            </Text>
          </View>
          <View className="difficulty-item">
            <Text className="difficulty-label">认知难度</Text>
            <Text
              className="difficulty-value"
              style={{ color: getDifficultyColor(translation.difficulty.cognitive) }}
            >
              {translation.difficulty.cognitive.toFixed(1)}
            </Text>
            <Text className="difficulty-stars">
              {getDifficultyStars(translation.difficulty.cognitive)}
            </Text>
          </View>
          <View className="difficulty-item">
            <Text className="difficulty-label">执行难度</Text>
            <Text
              className="difficulty-value"
              style={{ color: getDifficultyColor(translation.difficulty.execution) }}
            >
              {translation.difficulty.execution.toFixed(1)}
            </Text>
            <Text className="difficulty-stars">
              {getDifficultyStars(translation.difficulty.execution)}
            </Text>
          </View>
          <View className="difficulty-item">
            <Text className="difficulty-label">沟通难度</Text>
            <Text
              className="difficulty-value"
              style={{ color: getDifficultyColor(translation.difficulty.communication) }}
            >
              {translation.difficulty.communication.toFixed(1)}
            </Text>
            <Text className="difficulty-stars">
              {getDifficultyStars(translation.difficulty.communication)}
            </Text>
          </View>
        </View>
        <View className="overall-difficulty">
          <Text className="overall-label">综合难度</Text>
          <Text
            className="overall-value"
            style={{ color: getDifficultyColor(translation.difficulty.overall) }}
          >
            {translation.difficulty.overall.toFixed(1)}/10
          </Text>
        </View>
      </View>

      <View className="section value-assessment">
        <View className="section-header">
          <Text className="section-icon">💎</Text>
          <Text className="section-title">价值评估</Text>
        </View>
        <View className="value-grid">
          <View className="value-item">
            <Text className="value-label">学习价值</Text>
            <View className="value-bar">
              <View
                className="value-bar-fill learning"
                style={{ width: `${translation.learningValue * 100}%` }}
              />
            </View>
            <Text className="value-percentage">
              {(translation.learningValue * 100).toFixed(0)}%
            </Text>
          </View>
          <View className="value-item">
            <Text className="value-label">职业影响</Text>
            <View className="value-bar">
              <View
                className="value-bar-fill career"
                style={{ width: `${translation.careerImpact * 100}%` }}
              />
            </View>
            <Text className="value-percentage">
              {(translation.careerImpact * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View className="section time-estimate">
        <View className="section-header">
          <Text className="section-icon">⏱️</Text>
          <Text className="section-title">预计工作时间</Text>
        </View>
        <View className="time-content">
          <Text className="time-value">{translation.estimatedHours}</Text>
          <Text className="time-unit">小时</Text>
        </View>
      </View>
    </View>
  );
}
