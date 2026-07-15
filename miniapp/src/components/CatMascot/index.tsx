import { View } from '@tarojs/components'
import './index.scss'

interface CatMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  state?: 'default' | 'happy' | 'thinking' | 'encourage'
  showBook?: boolean
  className?: string
}

export default function CatMascot({
  size = 'md',
  state = 'default',
  showBook = true,
  className = ''
}: CatMascotProps) {
  return (
    <View className={`cat-mascot cat-mascot--${size} cat-mascot--${state} ${className}`}>
      <View className="cat-image">
        <View className="cat-drawing">
          {showBook && (
            <View className="cat-book">
              <View className="book-stack">
                <View className="book book--1"></View>
                <View className="book book--2"></View>
              </View>
            </View>
          )}
          <View className="cat-head">
            <View className="cat-eyes">
              <View className="cat-eye"></View>
              <View className="cat-eye"></View>
            </View>
            <View className="cat-nose"></View>
            <View className="cat-whiskers">
              <View className="whisker whisker--left-1"></View>
              <View className="whisker whisker--left-2"></View>
              <View className="whisker whisker--right-1"></View>
              <View className="whisker whisker--right-2"></View>
            </View>
          </View>
          <View className="cat-body"></View>
        </View>
      </View>
    </View>
  )
}
