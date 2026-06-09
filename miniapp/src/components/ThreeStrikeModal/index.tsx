import Taro from '@tarojs/taro';
import { View, Button, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './index.scss';

/**
 * 三次审核兜底弹窗
 *
 * 功能：
 * 1. 检测第三次审核失败
 * 2. 提供两个选项：转单 或 召唤大师
 * 3. 显示转单学生列表或大师列表
 */

interface ThreeStrikeModalProps {
  visible: boolean;
  taskId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TransferCandidate {
  id: string;
  nickname: string;
  avatar_url: string;
  current_level: number;
  tasks_completed: number;
  avg_task_quality: number;
  active_tasks: number;
}

interface Master {
  id: string;
  nickname: string;
  avatar_url: string;
  master_specialties: string[];
  master_fee: number;
  master_total_tasks: number;
  master_avg_rating: number;
  master_bio: string;
}

export default function ThreeStrikeModal({
  visible,
  taskId,
  onClose,
  onSuccess,
}: ThreeStrikeModalProps) {
  const [step, setStep] = useState<'choice' | 'transfer' | 'master'>('choice');
  const [transferCandidates, setTransferCandidates] = useState<TransferCandidate[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 获取转单候选学生
  const fetchTransferCandidates = async () => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${taskId}/transfer-candidates`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setTransferCandidates(res.data.data);
      }
    } catch (error) {
      Taro.showToast({
        title: '获取学生列表失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取可召唤大师列表
  const fetchMasters = async () => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${taskId}/available-masters`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setMasters(res.data.data);
      }
    } catch (error) {
      Taro.showToast({
        title: '获取大师列表失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 执行转单
  const handleTransfer = async () => {
    if (!selectedId) {
      Taro.showToast({
        title: '请选择接包学生',
        icon: 'none',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${taskId}/transfer`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
        data: {
          toStudentId: selectedId,
          reason: '任务难度超出能力范围',
        },
      });

      if (res.data.success) {
        Taro.showToast({
          title: '转单成功',
          icon: 'success',
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      Taro.showToast({
        title: '转单失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 召唤大师
  const handleSummonMaster = async () => {
    if (!selectedId) {
      Taro.showToast({
        title: '请选择大师',
        icon: 'none',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${taskId}/summon-master`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
        data: {
          masterId: selectedId,
          message: '需要专业指导帮助',
        },
      });

      if (res.data.success) {
        Taro.showToast({
          title: '大师已召唤',
          icon: 'success',
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      Taro.showToast({
        title: '召唤失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View className='three-strike-modal'>
      <View className='modal-mask' onClick={onClose} />
      <View className='modal-content'>
        {/* 选择阶段 */}
        {step === 'choice' && (
          <View className='choice-step'>
            <View className='modal-header'>
              <Text className='title'>任务遇到困难？</Text>
              <Text className='subtitle'>
                你已经提交了3次，但都未通过审核。
                {'\n'}
                别担心，我们为你准备了两个解决方案：
              </Text>
            </View>

            <View className='options'>
              <View
                className='option-card'
                onClick={() => {
                  setStep('transfer');
                  fetchTransferCandidates();
                }}
              >
                <View className='option-icon'>🔄</View>
                <View className='option-title'>转单给其他学生</View>
                <View className='option-desc'>
                  你将获得20%的转单费用
                  {'\n'}
                  接包学生获得80%的任务费用
                </View>
              </View>

              <View
                className='option-card'
                onClick={() => {
                  setStep('master');
                  fetchMasters();
                }}
              >
                <View className='option-icon'>👨‍🏫</View>
                <View className='option-title'>召唤大师指导</View>
                <View className='option-desc'>
                  专业大师一对一指导
                  {'\n'}
                  帮助你完成任务
                </View>
              </View>
            </View>

            <Button className='cancel-btn' onClick={onClose}>
              我再试试
            </Button>
          </View>
        )}

        {/* 转单阶段 */}
        {step === 'transfer' && (
          <View className='transfer-step'>
            <View className='modal-header'>
              <Text className='title'>选择接包学生</Text>
              <Text className='subtitle'>
                以下学生与任务匹配度较高，可以接手这个任务
              </Text>
            </View>

            {loading ? (
              <View className='loading'>加载中...</View>
            ) : (
              <View className='candidates-list'>
                {transferCandidates.map((candidate) => (
                  <View
                    key={candidate.id}
                    className={`candidate-card ${
                      selectedId === candidate.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedId(candidate.id)}
                  >
                    <Image
                      className='avatar'
                      src={candidate.avatar_url}
                      mode='aspectFill'
                    />
                    <View className='info'>
                      <View className='name-level'>
                        <Text className='name'>{candidate.nickname}</Text>
                        <Text className='level'>Lv.{candidate.current_level}</Text>
                      </View>
                      <View className='stats'>
                        <Text className='stat'>
                          完成{candidate.tasks_completed}单
                        </Text>
                        <Text className='stat'>
                          质量{(candidate.avg_task_quality * 100).toFixed(0)}%
                        </Text>
                        <Text className='stat'>
                          进行中{candidate.active_tasks}单
                        </Text>
                      </View>
                    </View>
                    {selectedId === candidate.id && (
                      <View className='check-icon'>✓</View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View className='actions'>
              <Button className='back-btn' onClick={() => setStep('choice')}>
                返回
              </Button>
              <Button
                className='confirm-btn'
                onClick={handleTransfer}
                loading={loading}
                disabled={!selectedId}
              >
                确认转单
              </Button>
            </View>
          </View>
        )}

        {/* 召唤大师阶段 */}
        {step === 'master' && (
          <View className='master-step'>
            <View className='modal-header'>
              <Text className='title'>选择大师</Text>
              <Text className='subtitle'>
                以下大师擅长该领域，可以为你提供专业指导
              </Text>
            </View>

            {loading ? (
              <View className='loading'>加载中...</View>
            ) : (
              <View className='masters-list'>
                {masters.map((master) => (
                  <View
                    key={master.id}
                    className={`master-card ${
                      selectedId === master.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedId(master.id)}
                  >
                    <Image
                      className='avatar'
                      src={master.avatar_url}
                      mode='aspectFill'
                    />
                    <View className='info'>
                      <View className='name-rating'>
                        <Text className='name'>{master.nickname}</Text>
                        <Text className='rating'>
                          ⭐ {master.master_avg_rating?.toFixed(1) || '5.0'}
                        </Text>
                      </View>
                      <View className='specialties'>
                        {master.master_specialties.map((skill) => (
                          <Text key={skill} className='skill-tag'>
                            {skill}
                          </Text>
                        ))}
                      </View>
                      <Text className='bio'>{master.master_bio}</Text>
                      <View className='stats'>
                        <Text className='stat'>
                          指导{master.master_total_tasks}次
                        </Text>
                        <Text className='fee'>¥{master.master_fee}</Text>
                      </View>
                    </View>
                    {selectedId === master.id && (
                      <View className='check-icon'>✓</View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View className='actions'>
              <Button className='back-btn' onClick={() => setStep('choice')}>
                返回
              </Button>
              <Button
                className='confirm-btn'
                onClick={handleSummonMaster}
                loading={loading}
                disabled={!selectedId}
              >
                召唤大师
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
