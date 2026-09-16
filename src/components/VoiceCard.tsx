import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Easing,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export interface VoiceCardProps {
  width: number;
  minHeight?: number;
  cardColor?: string;
  isListening?: boolean;
  onPressMic?: () => void;
  showMic?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function VoiceCard({
  width,
  minHeight = 168,
  cardColor = '#E2852E',
  isListening = false,
  onPressMic,
  showMic = true,
  children,
  style,
}: VoiceCardProps) {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [pulseOpacity] = useState(() => new Animated.Value(0.6));

  // Pulse ring animation when listening or tapped
  useEffect(() => {
    if (!isListening) {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [isListening, pulseAnim, pulseOpacity]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 90,
    }).start();
  };

  const micButtonSize = 58;
  const micOverlap = showMic ? micButtonSize / 2 : 0;

  return (
    <View style={[{ width, alignItems: 'center', marginBottom: micOverlap }, style]}>
      {/* Orange Speech Card Body */}
      <View
        style={[
          styles.cardBody,
          {
            width,
            minHeight,
            backgroundColor: cardColor,
          },
        ]}
      >
        {/* Content Area (Typewriter Text) */}
        <View style={[styles.cardContent, !showMic && { paddingBottom: 20 }]}>
          {children}
        </View>
      </View>

      {/* Floating Microphone Button Centered on Bottom Edge */}
      {showMic && (
        <View
          style={[
            styles.micButtonWrapper,
            {
              bottom: -micButtonSize / 2,
            },
          ]}
        >
          {/* Animated Pulse Ring */}
          {isListening && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseOpacity,
                },
              ]}
            />
          )}

          <TouchableOpacity
            activeOpacity={0.9}
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

                {/* Sparkle Star 1 - Top Left */}
                <Path
                  d="M15 17L16 14L17 17L20 18L17 19L16 22L15 19L12 18Z"
                  fill="#E5C25D"
                />

                {/* Sparkle Dot 2 - Bottom Left */}
                <Circle cx={15.5} cy={37.5} r={1.5} fill="#E5C25D" />

                {/* Sparkle Dot 3 - Top Right */}
                <Circle cx={43.5} cy={18.5} r={1.5} fill="#E5C25D" />

                {/* Sparkle Star 4 - Mid Right */}
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
                {/* Mic Cradle Arc */}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    borderRadius: 24,
    shadowColor: '#C47020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    justifyContent: 'center',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36, // Space for overlapping mic button
  },
  micButtonWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
  },
  pulseRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: '#E5C25D',
    backgroundColor: 'rgba(229, 194, 93, 0.2)',
  },
  micButtonTouchable: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#A85E15',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
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
