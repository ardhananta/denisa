import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export interface VoiceCardProps {
  width: number;
  height?: number;
  cardColor?: string;
  onPressMic?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function VoiceCard({
  width,
  height = 175,
  cardColor = '#E2852E',
  onPressMic,
  children,
  style,
}: VoiceCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Corner radius of the card
  const r = 18;

  // Smooth flared notch dimensions
  const halfW = 40; // notch spans 80px total width
  const depth = 25; // notch arch height
  const cx = width / 2;
  const leftNotch = cx - halfW;
  const rightNotch = cx + halfW;

  // Smooth SVG Path with concave dome cutout at bottom center
  const cardPath = [
    `M ${r} 0`,
    `H ${width - r}`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `V ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `H ${rightNotch}`,
    `C ${cx + halfW * 0.52} ${height}, ${cx + halfW * 0.32} ${height - depth}, ${cx} ${height - depth}`,
    `C ${cx - halfW * 0.32} ${height - depth}, ${cx - halfW * 0.52} ${height}, ${leftNotch} ${height}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${height - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  };

  const micButtonSize = 58;
  // Position mic button nested into the arch notch
  const micButtonTop = height - depth + 6;

  return (
    <View style={[{ width, alignItems: 'center' }, style]}>
      {/* Notched Card Body */}
      <View style={{ width, height, position: 'relative' }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path d={cardPath} fill={cardColor} />
        </Svg>

        {/* Card Content Area (Text Writer) */}
        {children && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                paddingHorizontal: 18,
                paddingTop: 16,
                paddingBottom: depth + 16,
              },
            ]}
          >
            {children}
          </View>
        )}
      </View>

      {/* Floating Microphone Button Nested in the Notch */}
      <View
        style={{
          position: 'absolute',
          top: micButtonTop,
          alignSelf: 'center',
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPressMic}
          style={styles.micButtonTouchable}
        >
          <Animated.View
            style={[
              styles.micButtonContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Svg width={micButtonSize} height={micButtonSize} viewBox="0 0 58 58" fill="none">
              {/* Outer Golden Border Rim */}
              <Circle
                cx={29}
                cy={29}
                r={26.5}
                stroke="#E5C25D"
                strokeWidth={3.5}
                fill="#FFFFFF"
              />

              {/* Sparkle Dot 1 - Top Left */}
              <Path
                d="M15 17L16 14L17 17L20 18L17 19L16 22L15 19L12 18Z"
                fill="#E5C25D"
              />

              {/* Sparkle Dot 2 - Bottom Left */}
              <Circle cx={15.5} cy={37.5} r={1.5} fill="#E5C25D" />

              {/* Sparkle Dot 3 - Top Right */}
              <Circle cx={43.5} cy={18.5} r={1.5} fill="#E5C25D" />

              {/* Sparkle Dot 4 - Mid Right */}
              <Path
                d="M44 33L45 30.5L46 33L48.5 34L46 35L45 37.5L44 35L41.5 34Z"
                fill="#E5C25D"
              />

              {/* Microphone Icon in Terracotta Orange */}
              {/* Mic Capsule */}
              <Path
                d="M29 18C26.7909 18 25 19.7909 25 22V28C25 30.2091 26.7909 32 29 32C31.2091 32 33 30.2091 33 28V22C33 19.7909 31.2091 18 29 18Z"
                fill="#E2852E"
              />
              {/* Mic Cradle / Arc */}
              <Path
                d="M22 26V28C22 31.866 25.134 35 29 35C32.866 35 36 31.866 36 28V26"
                stroke="#E2852E"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              {/* Mic Stem */}
              <Path
                d="M29 35V39"
                stroke="#E2852E"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              {/* Mic Base Bar */}
              <Path
                d="M25 39H33"
                stroke="#E2852E"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  micButtonTouchable: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#C47020',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  micButtonContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
