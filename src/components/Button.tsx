import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

type ButtonVariant = 'filled' | 'outlined';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  className?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'filled',
  className = '',
}: ButtonProps) {
  const isFilled = variant === 'filled';

  const containerClasses = isFilled
    ? 'w-full py-3.5 rounded-full items-center justify-center bg-[#A0D8EB]'
    : 'w-full py-3.5 rounded-full items-center justify-center bg-white border-2 border-[#F5B842]';

  const textClasses = isFilled
    ? 'text-[17px] font-chelsea text-[#222222]'
    : 'text-[17px] font-chelsea text-[#F5B842]';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`${containerClasses} ${className}`}
    >
      <Text className={textClasses}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

