import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { connectDatabase } from '../config/database'
import { User } from '../models/User'

dotenv.config()

/**
 * 创建测试用户并生成JWT token
 */
async function createTestUser() {
  try {
    await connectDatabase()

    // 检查是否已存在测试用户
    let user = await User.findOne({ openId: 'test-open-id-001' })

    if (user) {
      console.log('✓ 测试用户已存在')
    } else {
      // 创建新测试用户
      user = await User.create({
        openId: 'test-open-id-001',
        nickname: '测试学生',
        avatar: 'https://example.com/avatar.png',
        level: 1,
        exp: 0,
        balance: 0,
        role: 'user',
        isTestData: true
      })
      console.log('✓ 测试用户创建成功')
    }

    // 生成JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-testing-only'
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        openId: user.openId,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    console.log('\n=================================')
    console.log('测试用户信息：')
    console.log('=================================')
    console.log('User ID:', user._id.toString())
    console.log('Nickname:', user.nickname)
    console.log('OpenID:', user.openId)
    console.log('\nJWT Token:')
    console.log(token)
    console.log('\n使用方式：')
    console.log('export TEST_TOKEN="' + token + '"')
    console.log('curl -H "Authorization: Bearer $TEST_TOKEN" http://localhost:3000/api/opc/latest')
    console.log('=================================\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error: any) {
    console.error('✗ 创建测试用户失败:', error.message)
    process.exit(1)
  }
}

createTestUser()
