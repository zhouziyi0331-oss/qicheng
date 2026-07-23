import dotenv from 'dotenv'
dotenv.config()

import { connectDatabase } from '../config/database'
import { User } from '../models/User'
import { StudentTagProfile } from '../models/Tag'

/**
 * 清理旧用户数据（没有画像的）
 */

async function cleanupOldUsers() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  清理旧用户数据')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await connectDatabase()

    // 获取所有用户
    const users = await User.find({})
    console.log(`总用户数: ${users.length}\n`)

    const usersToDelete = []

    for (const user of users) {
      const profile = await StudentTagProfile.findOne({ userId: user._id })

      if (!profile) {
        usersToDelete.push(user)
        console.log(`将删除: ${user.phone || user._id.toString().slice(-6)} (无画像)`)
      } else {
        console.log(`保留: ${user.phone || user._id.toString().slice(-6)} (有画像)`)
      }
    }

    if (usersToDelete.length === 0) {
      console.log('\n✓ 没有需要清理的用户')
      process.exit(0)
    }

    console.log(`\n将删除 ${usersToDelete.length} 个旧用户`)
    console.log('开始删除...\n')

    for (const user of usersToDelete) {
      await User.deleteOne({ _id: user._id })
      console.log(`✓ 已删除: ${user.phone || user._id.toString().slice(-6)}`)
    }

    console.log(`\n✅ 清理完成！删除了 ${usersToDelete.length} 个旧用户`)
    console.log(`剩余用户数: ${users.length - usersToDelete.length}`)

    process.exit(0)

  } catch (error: any) {
    console.error('\n✗ 清理失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

cleanupOldUsers()
