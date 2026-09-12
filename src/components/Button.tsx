import React from 'react';
import { TouchableOpacity, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';

type ButtonVariant = 'filled' | 'outlined';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'filled',
  className = '',
  style,
  textStyle,
}: ButtonProps) {
  const isFilled = variant === 'filled';

  const defaultContainerStyle: ViewStyle = isFilled
    ? {
        width: '100%',
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#9CD5F4',
      }
    : {
        width: '100%',
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#F5B842',
      };

  const defaultTextStyle: TextStyle = {
    fontFamily: 'ChelseaMarket',
    fontSize: 17,
    color: isFilled ? '#222222' : '#F5B842',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[defaultContainerStyle, style]}
      className={className}
    >
      <Text style={[defaultTextStyle, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
