import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackgroundTopSvg from '@/components/BackgroundTopSvg';
import AnimatedMascot from '@/components/AnimatedMascot';
import VoiceCard from '@/components/VoiceCard';
import TypewriterText from '@/components/TypewriterText';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [replayKey, setReplayKey] = useState(0);

  // Background Top dimensions (matches SVG aspect ratio 402/382)
  const bgTopWidth = width;
  const bgTopHeight = bgTopWidth * (382 / 402);

  // Mascot dimensions (proportionate to screen, aspect ratio 384/308)
  const mascotWidth = Math.min(Math.max(width * 0.82, 280), 340);
  const mascotHeight = mascotWidth / (384 / 308);

  // Card dimensions (rounded card with bottom mic cutout)
  const cardWidth = Math.min(Math.max(width - 44, 290), 350);
  const cardHeight = Math.min(Math.max(cardWidth * 0.47, 145), 170);

  const greetingMessage =
    'Halo, Aku Denis! mari kita masuk\nke sesi Dynamic Mchat Interview\ndengan menjawab beberapa\npertanyaan berikut!';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Sky Extension for devices with notch / Dynamic Island */}
      <View
        pointerEvents="none"
        style={[
          styles.skyExtension,
          { height: insets.top + 20 },
        ]}
      />

      {/* Top Scenery Background (Sky, Sun, Mountains, Dunes, Clouds) */}
      <View pointerEvents="none" style={styles.bgTopContainer}>
        <BackgroundTopSvg width={bgTopWidth} height={bgTopHeight} />
      </View>

      {/* Main Content Layout */}
      <View
        style={[
          styles.contentContainer,
          {
            paddingTop: insets.top + Math.max((height - insets.top - insets.bottom - 520) * 0.06, 8),
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Upper Spacer to align mascot gracefully */}
        <View style={styles.topFlexSpacer} />

        {/* Mascot in the Center - Automatically moving and cycling through 3 poses */}
        <View style={styles.mascotWrapper}>
          <AnimatedMascot
            width={mascotWidth}
            height={mascotHeight}
            autoCycle={true}
            cycleInterval={2800}
            enableFloating={true}
            enableBlink={true}
            enableTapToCycle={true}
          />
        </View>

        {/* Subtitle / Voice Card Section */}
        <View style={styles.bottomSection}>
          <View style={styles.cardWrapper}>
            <VoiceCard
              width={cardWidth}
              height={cardHeight}
              cardColor="#E2852E"
              onPressMic={() => {
                // Re-trigger typewriter speech on mic press
                setReplayKey((k) => k + 1);
              }}
            >
              <TypewriterText
                key={replayKey}
                text={greetingMessage}
                speed={36}
                delay={300}
                style={styles.cardText}
              />
            </VoiceCard>
          </View>

          {/* Orange Action Button from Reference UI */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.actionButton, { width: cardWidth }]}
            onPress={() => {
              // Action when user continues
            }}
          >
            <Text style={styles.actionButtonText}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE474', // Exact sand color transitioning seamlessly from scenery
    overflow: 'hidden',
  },
  skyExtension: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ABE0F0', // Sky blue color
    zIndex: 0,
  },
  bgTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  topFlexSpacer: {
    flex: 0.1,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 4,
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 13.5,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  actionButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E2852E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C47020',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
