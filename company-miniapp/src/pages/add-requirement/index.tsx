import { View, Text, Textarea, Picker } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

export default function AddRequirement() {
  const router = useRouter();
  const taskId = router.params.taskId;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 追加类型
  const [amendmentType, setAmendmentType] = useState('add_requirement');
  const amendmentTypes = [
    { label: '追加任务需求', value: 'add_requirement' },
    { label: '延长截止时间', value: 'extend_deadline' },
    { label: '增加任务预算', value: 'increase_budget' }
  ];

  // 表单数据
  const [description, setDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    loadTaskInfo();
  }, []);

  const loadTaskInfo = async () => {
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${taskId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setTask(res.data.data);
        // 设置默认新截止日期为当前截止日期后7天
        if (res.data.data.deadline) {
          const currentDeadline = new Date(res.data.data.deadline);
          currentDeadline.setDate(currentDeadline.getDate() + 7);
          setNewDeadline(currentDeadline.toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('加载任务信息失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e: any) => {
    const index = e.detail.value;
    setAmendmentType(amendmentTypes[index].value);
  };

  const handleDateChange = (e: any) => {
    setNewDeadline(e.detail.value);
  };

  const handleSubmit = async () => {
    // 验证
    if (!description.trim()) {
      Taro.showToast({
        title: '请填写变更说明',
        icon: 'none'
      });
      return;
    }

    if (amendmentType === 'extend_deadline' && !newDeadline) {
      Taro.showToast({
        title: '请选择新的截止日期',
        icon: 'none'
      });
      return;
    }

    if (amendmentType === 'increase_budget') {
      if (!newBudget || parseFloat(newBudget) <= 0) {
        Taro.showToast({
          title: '请输入有效的新预算',
          icon: 'none'
        });
        return;
      }

      if (parseFloat(newBudget) <= parseFloat(task.company_price)) {
        Taro.showToast({
          title: '新预算必须大于原预算',
          icon: 'none'
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = Taro.getStorageSync('token');

      const requestData: any = {
        taskId: parseInt(taskId!),
        amendmentType,
        description: description.trim()
      };

      if (amendmentType === 'extend_deadline') {
        requestData.newDeadline = newDeadline;
      }

      if (amendmentType === 'increase_budget') {
        requestData.newBudget = parseFloat(newBudget);
      }

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/tasks/amendments',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: requestData
      });

      if (res.statusCode === 200) {
        Taro.showToast({
          title: '提交成功，等待学生确认',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 2000);
      } else {
        throw new Error(res.data.message || '提交失败');
      }
    } catch (error: any) {
      console.error('提交追加需求失败:', error);
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="add-requirement-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const currentTypeIndex = amendmentTypes.findIndex(t => t.value === amendmentType);

  return (
    <View className="add-requirement-page">
      {/* 任务信息 */}
      <View className="task-card">
        <Text className="task-title">{task?.title}</Text>
        <View className="task-meta">
          <Text className="meta-item">预算: ¥{task?.company_price}</Text>
          <Text className="meta-item">
            截止: {task?.deadline ? new Date(task.deadline).toLocaleDateString() : '未设置'}
          </Text>
        </View>
      </View>

      {/* 变更类型 */}
      <View className="form-section">
        <View className="section-header">
          <Text className="section-title">变更类型</Text>
          <Text className="required">*</Text>
        </View>
        <Picker
          mode="selector"
          range={amendmentTypes}
          rangeKey="label"
          value={currentTypeIndex}
          onChange={handleTypeChange}
        >
          <View className="picker">
            <Text className="picker-text">
              {amendmentTypes[currentTypeIndex].label}
            </Text>
            <Text className="picker-arrow">›</Text>
          </View>
        </Picker>
      </View>

      {/* 变更说明 */}
      <View className="form-section">
        <View className="section-header">
          <Text className="section-title">变更说明</Text>
          <Text className="required">*</Text>
        </View>
        <Textarea
          className="textarea"
          placeholder="请详细说明变更原因和具体内容..."
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          maxlength={500}
        />
        <Text className="char-count">{description.length}/500</Text>
      </View>

      {/* 延长时间 */}
      {amendmentType === 'extend_deadline' && (
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">新的截止日期</Text>
            <Text className="required">*</Text>
          </View>
          <Picker
            mode="date"
            value={newDeadline}
            start={new Date().toISOString().split('T')[0]}
            onChange={handleDateChange}
          >
            <View className="picker">
              <Text className="picker-text">
                {newDeadline || '请选择日期'}
              </Text>
              <Text className="picker-arrow">›</Text>
            </View>
          </Picker>
          <Text className="hint">
            原截止日期: {task?.deadline ? new Date(task.deadline).toLocaleDateString() : '未设置'}
          </Text>
        </View>
      )}

      {/* 增加预算 */}
      {amendmentType === 'increase_budget' && (
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">新的任务预算</Text>
            <Text className="required">*</Text>
          </View>
          <View className="input-wrapper">
            <Text className="input-prefix">¥</Text>
            <input
              className="input"
              type="digit"
              placeholder="请输入新预算"
              value={newBudget}
              onInput={(e: any) => setNewBudget(e.detail.value)}
            />
          </View>
          <Text className="hint">
            原预算: ¥{task?.company_price}
          </Text>
          {newBudget && parseFloat(newBudget) > parseFloat(task?.company_price) && (
            <View className="budget-diff">
              <Text className="diff-label">增加金额:</Text>
              <Text className="diff-amount">
                +¥{(parseFloat(newBudget) - parseFloat(task?.company_price)).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 温馨提示 */}
      <View className="tips-card">
        <Text className="tips-title">💡 温馨提示</Text>
        <Text className="tips-item">• 追加需求需要学生同意后才能生效</Text>
        <Text className="tips-item">• 学生有权拒绝不合理的追加需求</Text>
        <Text className="tips-item">• 增加预算需要补充支付差额</Text>
        <Text className="tips-item">• 请与学生保持良好沟通</Text>
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View
          className={`submit-btn ${submitting ? 'disabled' : ''}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text className="submit-text">
            {submitting ? '提交中...' : '提交变更申请'}
          </Text>
        </View>
      </View>
    </View>
  );
}
