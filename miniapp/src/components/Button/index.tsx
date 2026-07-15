import { Button as TaroButton } from '@tarojs/components'
import { ButtonProps as TaroButtonProps } from '@tarojs/components/types/Button'
import './index.scss'

interface ButtonProps extends TaroButtonProps {
  variant?: 'primary' | 'secondary' | 'text'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const buttonClass = `custom-button custom-button--${variant} custom-button--${size} ${className}`

  return (
    <TaroButton className={buttonClass} {...props}>
      {children}
    </TaroButton>
  )
}
