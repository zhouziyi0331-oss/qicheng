import { View, Text, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import api from '../../../services/api'
import { checkTextSecurity } from '../../../utils/contentSecurity'
import Loading from '../../../components/Loading'
import './index.scss'

/**
 * 进阶成长计划页面
 *
 * 核心理念：Lv.4（自流者）解锁，帮助学生独立发展
 * 触发条件：完成20个项目 + 等级达到Lv.4 + 找到热情方向
 */

export default function OPCIncubation() {
  const [eligible, setEligible] = useState(false)
  const [requirements, setRequirements] = useState<any>(null)
  const [incubation, setIncubation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [passionDirection, setPassionDirection] = useState('')

  useEffect(() => {
    checkEligibility()
    loadIncubationStatus()
  }, [])

  const checkEligibility = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const response = await api.incubation.checkEligibility(studentId)
      setEligible(response.eligible)
      setRequirements(response.requirements)
    } catch (error) {
      console.error('检查资格失败:', error)
    }
  }

  const loadIncubationStatus = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const response = await api.incubation.getIncubationStatus(studentId)
      if (response.inIncubation) {
        setIncubation(response)
      }
    } catch (error) {
      console.error('加载孵化状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!passionDirection.trim()) {
      Taro.showToast({ title: '请填写热情方向', icon: 'none' })
      return
    }

    // ○ 文本内容安全检查
    const isPassionSecure = await checkTextSecurity(passionDirection)
    if (!isPassionSecure) {
      return
    }

    try {
      const studentId = Taro.getStorageSync('userId')
      await api.incubation.applyForIncubation(studentId, passionDirection)
      Taro.showToast({ title: '申请已提交', icon: 'success' })
      setShowApplyForm(false)
      loadIncubationStatus()
    } catch (error) {
      console.error('申请失败:', error)
      Taro.showToast({ title: '申请失败', icon: 'none' })
    }
  }

  const handleMonthlyUpdate = () => {
    Taro.navigateTo({
      url: '/pages/incubation-update/index'
    })
  }

  if (loading) {
    return <Loading text="正在加载孵化计划..." />
  }

  // 已在孵化计划中
  if (incubation?.inIncubation) {
    return (
      <View className='opc-incubation-page'>
        <View className='status-card incubating'>
          <View className='status-icon'>▲</View>
          <View className='status-title'>
            {incubation.incubation.status === 'applying' && '申请审核中'}
            {incubation.incubation.status === 'incubating' && '孵化中'}
            {incubation.incubation.status === 'graduated' && '已毕业'}
          </View>
          <View className='status-desc'>
            热情方向：{incubation.incubation.passion_direction}
          </View>
        </View>

        {incubation.incubation.status === 'incubating' && (
          <>
            <View className='benefits-card'>
              <View className='benefits-title'>孵化权益</View>
              <View className='benefits-list'>
                <View className='benefit-item'>
                  <View className='benefit-icon'>●</View>
                  <View className='benefit-text'>免费OPC成长报告（¥299）</View>
                </View>
                <View className='benefit-item'>
                  <View className='benefit-icon'>●</View>
                  <View className='benefit-text'>独立接单资格</View>
                </View>
                <View className='benefit-item'>
                  <View className='benefit-icon'>●</View>
                  <View className='benefit-text'>联合体组建支持</View>
                </View>
                <View className='benefit-item'>
                  <View className='benefit-icon'>◆</View>
                  <View className='benefit-text'>创业资源对接</View>
                </View>
              </View>
            </View>

            <View className='commitment-card'>
              <View className='commitment-title'>你的承诺</View>
              <View className='commitment-list'>
                <View className='commitment-item'>✓ 每月更新一次成长报告</View>
                <View className='commitment-item'>✓ 分享探索经验到故事墙</View>
                <View className='commitment-item'>✓ 帮助新人成长</View>
              </View>
              <View className='update-btn' onClick={handleMonthlyUpdate}>
                提交本月更新
              </View>
            </View>

            {incubation.resources.length > 0 && (
              <View className='resources-card'>
                <View className='resources-title'>对接的资源</View>
                <View className='resources-list'>
                  {incubation.resources.map((resource: any) => (
                    <View key={resource.id} className='resource-item'>
                      <View className='resource-name'>{resource.resource_name}</View>
                      <View className='resource-desc'>{resource.resource_description}</View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    )
  }

  // 未达到资格
  if (!eligible) {
    return (
      <View className='opc-incubation-page'>
        <View className='header-card'>
          <View className='header-icon'>◇</View>
          <View className='header-content'>
            <View className='header-title'>进阶成长计划</View>
            <View className='header-desc'>
              帮助自流者独立发展，提供创业资源支持
            </View>
          </View>
        </View>

        <View className='requirements-card'>
          <View className='requirements-title'>解锁条件</View>
          <View className='requirements-list'>
            <View className={`requirement-item ${requirements?.completedTasks.met ? 'met' : ''}`}>
              <View className='requirement-icon'>
                {requirements?.completedTasks.met ? '✓' : '○'}
              </View>
              <View className='requirement-text'>
                完成20个项目（当前：{requirements?.completedTasks.current}/20）
              </View>
            </View>
            <View className={`requirement-item ${requirements?.level.met ? 'met' : ''}`}>
              <View className='requirement-icon'>
                {requirements?.level.met ? '✓' : '○'}
              </View>
              <View className='requirement-text'>
                达到Lv.4自流者（当前：Lv.{requirements?.level.current}）
              </View>
            </View>
            <View className={`requirement-item ${requirements?.passionDirection.met ? 'met' : ''}`}>
              <View className='requirement-icon'>
                {requirements?.passionDirection.met ? '✓' : '○'}
              </View>
              <View className='requirement-text'>
                找到热情方向（至少3个热情火花）
              </View>
            </View>
          </View>
        </View>

        <View className='concept-card'>
          <View className='concept-title'>孵化计划是什么？</View>
          <View className='concept-desc'>
            当你完成20个项目、达到Lv.4、找到自己的热情方向后，平台会帮助你独立发展：
            提供免费OPC报告、独立接单资格、联合体支持、创业资源对接。
            作为交换，你需要每月更新成长报告、分享探索经验、帮助新人成长。
          </View>
        </View>
      </View>
    )
  }

  // 符合资格，显示申请表单
  return (
    <View className='opc-incubation-page'>
      <View className='header-card eligible'>
        <View className='header-icon'>◇</View>
        <View className='header-content'>
          <View className='header-title'>恭喜！你符合孵化资格</View>
          <View className='header-desc'>
            你已经完成了所有条件，可以申请加入进阶成长计划
          </View>
        </View>
      </View>

      {!showApplyForm ? (
        <>
          <View className='benefits-preview'>
            <View className='benefits-title'>孵化权益</View>
            <View className='benefits-grid'>
              <View className='benefit-card'>
                <View className='benefit-icon'>●</View>
                <View className='benefit-name'>免费OPC报告</View>
                <View className='benefit-value'>价值¥299</View>
              </View>
              <View className='benefit-card'>
                <View className='benefit-icon'>●</View>
                <View className='benefit-name'>独立接单</View>
                <View className='benefit-value'>脱离平台</View>
              </View>
              <View className='benefit-card'>
                <View className='benefit-icon'>●</View>
                <View className='benefit-name'>团队支持</View>
                <View className='benefit-value'>组队创业</View>
              </View>
              <View className='benefit-card'>
                <View className='benefit-icon'>◆</View>
                <View className='benefit-name'>资源对接</View>
                <View className='benefit-value'>投资人/导师</View>
              </View>
            </View>
          </View>

          <View className='apply-btn' onClick={() => setShowApplyForm(true)}>
            申请加入孵化计划
          </View>
        </>
      ) : (
        <View className='apply-form'>
          <View className='form-title'>申请表单</View>
          <View className='form-item'>
            <View className='form-label'>你的热情方向是什么？</View>
            <Textarea
              className='form-textarea'
              placeholder='例如：我想用设计帮助更多人表达自己'
              value={passionDirection}
              onInput={(e) => setPassionDirection(e.detail.value)}
              maxlength={200}
            />
            <View className='char-count'>{passionDirection.length}/200</View>
          </View>
          <View className='form-actions'>
            <View className='btn-submit' onClick={handleApply}>
              提交申请
            </View>
            <View className='btn-cancel' onClick={() => setShowApplyForm(false)}>
              取消
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
