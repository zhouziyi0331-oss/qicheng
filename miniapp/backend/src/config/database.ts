import mongoose from 'mongoose'

export const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qicheng_opc'

    await mongoose.connect(mongoUri)

    console.log('✓ MongoDB连接成功')
  } catch (error) {
    console.error('✗ MongoDB连接失败:', error)
    process.exit(1)
  }
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB运行时错误:', err)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB连接断开')
})
