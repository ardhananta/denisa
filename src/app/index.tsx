import React from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MascotSvg from '@/components/MascotSvg';
import Button from '@/components/Button';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Mascot scale: spans nicely across the screen bottom
  const mascotWidth = Math.min(Math.max(width * 1.08, 340), 440);
  const mascotHeight = mascotWidth / (402 / 217);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FAF8EE',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8EE" />

      {/* Decorative bubbles at top */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 240,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Large soft sky-blue circle - top left */}
        <View
          style={{
            position: 'absolute',
            width: 195,
            height: 195,
            borderRadius: 100,
            top: -40,
            left: -50,
            backgroundColor: '#A0D8EB',
          }}
        />
        {/* Soft yellow circle - top center/right */}
        <View
          style={{
            position: 'absolute',
            width: 76,
            height: 76,
            borderRadius: 38,
            top: 32,
            left: '52%',
            backgroundColor: '#FDE682',
          }}
        />
        {/* Warm golden-yellow circle - top right */}
        <View
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: 90,
            top: 25,
            right: -55,
            backgroundColor: '#F6BA44',
          }}
        />
      </View>

      {/* Center Content Section (Title + Subtitle + Action Buttons) */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: Math.max(insets.top + 20, 60),
          paddingBottom: mascotHeight * 0.85 + Math.max(insets.bottom, 16),
          zIndex: 10,
        }}
      >
        {/* Title & Subtitle */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: 'ChelseaMarket',
              fontSize: 25,
              color: '#222222',
              textAlign: 'center',
              lineHeight: 32,
            }}
          >
            Selamat datang di Denisa
          </Text>
          <Text
            style={{
              fontFamily: 'ChelseaMarket',
              fontSize: 14,
              color: '#222222',
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Deteksi Dini Sahabat Autis
          </Text>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            width: '100%',
            maxWidth: 350,
            paddingHorizontal: 32,
            gap: 14,
          }}
        >
          <Button
            title="Masuk"
            variant="filled"
            onPress={() => router.push('/auth/login')}
          />
          <Button
            title="Daftar"
            variant="outlined"
            onPress={() => router.push('/auth/register')}
          />
        </View>
      </View>

      {/* Mascot anchored at bottom, lifted above Android navigation bar */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom - 4, 0),
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        <MascotSvg width={mascotWidth} />
      </View>
    </View>
  );
}
