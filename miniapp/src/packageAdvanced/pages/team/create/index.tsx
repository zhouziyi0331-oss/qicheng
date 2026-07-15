import Taro from '@tarojs/taro';
import { View, Button, Input, Textarea, Picker } from '@tarojs/components';
import { useState } from 'react';
import { tokenManager } from '../../../../utils/token';
import { getApiUrl } from '../../../../config';
import './index.scss';

/**
 * 创建队伍页面
 *
 * 权限：仅Lv.6可用
 * 功能：
 * 1. 填写队伍信息
 * 2. 选择赛道和技能要求
 * 3. 创建队伍并发布招募
 */

export default function CreateTeam() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 5,
    track: 'dev',
    requiredSkills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const trackOptions = [
    { label: '开发赛道', value: 'dev' },
    { label: '内容赛道', value: 'content' },
    { label: '混合赛道', value: 'mixed' },
  ];

  const memberOptions = [3, 4, 5, 6, 7, 8, 9, 10];

  // 添加技能标签
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;

    if (formData.requiredSkills.includes(skillInput.trim())) {
      Taro.showToast({
        title: '技能已存在',
        icon: 'none',
      });
      return;
    }

    setFormData({
      ...formData,
      requiredSkills: [...formData.requiredSkills, skillInput.trim()],
    });
    setSkillInput('');
  };

  // 删除技能标签
  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter((s) => s !== skill),
    });
  };

  // 创建队伍
  const handleSubmit = async () => {
    // 验证
    if (!formData.name.trim()) {
      Taro.showToast({
        title: '请输入队伍名称',
        icon: 'none',
      });
      return;
    }

    if (!formData.description.trim()) {
      Taro.showToast({
        title: '请输入队伍描述',
        icon: 'none',
      });
      return;
    }

    if (formData.requiredSkills.length === 0) {
      Taro.showToast({
        title: '请至少添加一个技能要求',
        icon: 'none',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await Taro.request({
        url: getApiUrl('/api/v1/teams-new'),
        method: 'POST',
        header: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
        data: formData,
      });

      if (res.data.success) {
        Taro.showToast({
          title: '队伍创建成功',
          icon: 'success',
        });

        // 跳转到队伍详情页
        setTimeout(() => {
          Taro.navigateTo({
            url: `/pages/team/detail/index?id=${res.data.data.teamId}`,
          });
        }, 1500);
      }
    } catch (error: any) {
      const message = error.data?.error || '创建失败';
      Taro.showToast({
        title: message,
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='create-team-page'>
      <View className='header'>
        <View className='title'>创建队伍</View>
        <View className='subtitle'>组建你的梦之队，一起完成项目</View>
      </View>

      <View className='form'>
        {/* 队伍名称 */}
        <View className='form-item'>
          <View className='label'>
            <Text className='required'>*</Text>
            队伍名称
          </View>
          <Input
            className='input'
            placeholder='给你的队伍起个响亮的名字'
            value={formData.name}
            maxlength={30}
            onInput={(e) =>
              setFormData({ ...formData, name: e.detail.value })
            }
          />
          <View className='hint'>{formData.name.length}/30</View>
        </View>

        {/* 队伍描述 */}
        <View className='form-item'>
          <View className='label'>
            <Text className='required'>*</Text>
            队伍描述
          </View>
          <Textarea
            className='textarea'
            placeholder='介绍一下你的队伍和项目目标'
            value={formData.description}
            maxlength={500}
            onInput={(e) =>
              setFormData({ ...formData, description: e.detail.value })
            }
          />
          <View className='hint'>{formData.description.length}/500</View>
        </View>

        {/* 赛道选择 */}
        <View className='form-item'>
          <View className='label'>
            <Text className='required'>*</Text>
            赛道
          </View>
          <Picker
            mode='selector'
            range={trackOptions}
            rangeKey='label'
            value={trackOptions.findIndex((t) => t.value === formData.track)}
            onChange={(e) =>
              setFormData({
                ...formData,
                track: trackOptions[e.detail.value].value,
              })
            }
          >
            <View className='picker'>
              {trackOptions.find((t) => t.value === formData.track)?.label}
            </View>
          </Picker>
        </View>

        {/* 最大成员数 */}
        <View className='form-item'>
          <View className='label'>
            <Text className='required'>*</Text>
            最大成员数
          </View>
          <Picker
            mode='selector'
            range={memberOptions}
            value={memberOptions.indexOf(formData.maxMembers)}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxMembers: memberOptions[e.detail.value],
              })
            }
          >
            <View className='picker'>{formData.maxMembers}人</View>
          </Picker>
        </View>

        {/* 技能要求 */}
        <View className='form-item'>
          <View className='label'>
            <Text className='required'>*</Text>
            技能要求
          </View>
          <View className='skill-input-wrapper'>
            <Input
              className='skill-input'
              placeholder='输入技能名称，如：React'
              value={skillInput}
              onInput={(e) => setSkillInput(e.detail.value)}
              onConfirm={handleAddSkill}
            />
            <Button className='add-skill-btn' onClick={handleAddSkill}>
              添加
            </Button>
          </View>
          <View className='skill-tags'>
            {formData.requiredSkills.map((skill) => (
              <View key={skill} className='skill-tag'>
                <Text>{skill}</Text>
                <Text
                  className='remove-icon'
                  onClick={() => handleRemoveSkill(skill)}
                >
                  ×
                </Text>
              </View>
            ))}
          </View>
          {formData.requiredSkills.length === 0 && (
            <View className='hint'>请至少添加一个技能要求</View>
          )}
        </View>
      </View>

      {/* 提示信息 */}
      <View className='tips'>
        <View className='tip-title'>◇ 温馨提示</View>
        <View className='tip-item'>• 创建队伍后，你将自动成为队长</View>
        <View className='tip-item'>• Lv.5+的学生可以申请加入你的队伍</View>
        <View className='tip-item'>• 你可以邀请外部成员，但不能超过总人数的30%</View>
        <View className='tip-item'>• 队伍创建后会自动发布到社区招募板块</View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-wrapper'>
        <Button
          className='submit-btn'
          onClick={handleSubmit}
          loading={loading}
        >
          创建队伍
        </Button>
      </View>
    </View>
  );
}
