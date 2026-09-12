import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Button from '@/components/Button';
import Mascot2Svg from '@/components/Mascot2Svg';

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={7.5} stroke="#222222" strokeWidth={2.4} />
      <Circle cx={12} cy={12} r={3.4} fill="#222222" />
      {!visible && (
        <Path
          d="M4.5 19.5L19.5 4.5"
          stroke="#222222"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

interface AuthScreenProps {
  initialMode: 'login' | 'register';
}

export default function AuthScreen({ initialMode }: AuthScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Active form mode: 'login' or 'register' (switches seamlessly without unmounting screen)
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mascot pop-up animation values (pops up from inside the card to the top)
  const mascotTranslateY = useRef(new Animated.Value(55)).current;
  const mascotScale = useRef(new Animated.Value(0.9)).current;

  // Form transition animation values (smooth fade and slide inside the card)
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(24)).current;

  // On initial mount: Mascot pops up from inside the card to the top
  useEffect(() => {
    Animated.parallel([
      Animated.spring(mascotTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.spring(mascotScale, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 20,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(formTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mascotTranslateY, mascotScale, formOpacity, formTranslateY]);

  // Seamless, zero-flicker transition between Login and Register
  const switchMode = (newMode: 'login' | 'register') => {
    // 1. Quick dip into the card and fade out form (120ms)
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 18,
        duration: 210,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(mascotTranslateY, {
        toValue: 200, 
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode(newMode);

      Animated.parallel([
        Animated.spring(mascotTranslateY, {
          toValue: 0,
          friction: 6.5,
          tension: 48,
          useNativeDriver: true,
        }),
        Animated.spring(mascotScale, {
          toValue: 1,
          friction: 6.5,
          tension: 48,
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSubmit = () => {
    // TODO: Implement authentication/registration logic
    router.replace('/(main)');
  };

  const isLogin = mode === 'login';

  return (
    <View style={{ flex: 1, backgroundColor: '#9CD5F4' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#9CD5F4" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#9CD5F4' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#9CD5F4' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={{
              backgroundColor: '#9CD5F4',
              width: '100%',
              paddingTop: insets.top,
              alignItems: 'center',
              zIndex: 0,
            }}
          >
            <Mascot2Svg
              width={width}
              animTranslateY={mascotTranslateY}
              animScale={mascotScale}
            />
          </View>

          {/* Form Card Container with Curved Dome Header */}
          <View
            style={{
              flex: 1,
              marginTop: -110,
              zIndex: 1,
            }}
          >
            {/* Smooth convex dome arch across the entire width */}
            <Svg
              width="100%"
              height={50}
              viewBox="0 0 400 50"
              preserveAspectRatio="none"
              style={{ marginBottom: -1 }}
            >
              <Path
                d="M 0 50 Q 200 0 400 50 L 400 52 L 0 52 Z"
                fill="#FFFFFF"
              />
            </Svg>

            {/* Main Form Body */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 28,
                paddingTop: 14,
                paddingBottom: Math.max(insets.bottom, 24) + 16,
                justifyContent: isLogin ? 'space-between' : undefined,
              }}
            >
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 360,
                alignSelf: 'center',
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              }}
            >
              {/* Title & Subtitle */}
              <View style={{ alignItems: 'center', marginBottom: isLogin ? 26 : 22 }}>
                <Text
                  style={{
                    fontFamily: 'ChelseaMarket',
                    fontSize: 25,
                    color: '#222222',
                    textAlign: 'center',
                  }}
                >
                  {isLogin ? 'Masuk' : 'Buat Akun'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 13.5,
                      color: '#222222',
                    }}
                  >
                    {isLogin ? 'Baru mengenal Denisa? ' : 'Sudah punya akun? '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => switchMode(isLogin ? 'register' : 'login')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontFamily: 'ChelseaMarket',
                        fontSize: 13.5,
                        color: '#F5B842',
                      }}
                    >
                      {isLogin ? 'Buat akun' : 'Masuk'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Inputs */}
              <View style={{ gap: 14 }}>
                {/* Name Input (Register Only) */}
                {!isLogin && (
                  <TextInput
                    style={{
                      backgroundColor: '#FDEAA1',
                      height: 54,
                      borderRadius: 14,
                      paddingHorizontal: 20,
                      fontFamily: 'ChelseaMarket',
                      fontSize: 15,
                      color: '#222222',
                    }}
                    placeholder="Nama Lengkap"
                    placeholderTextColor="#222222"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                )}

                {/* Email Input */}
                <TextInput
                  style={{
                    backgroundColor: '#FDEAA1',
                    height: 54,
                    borderRadius: 14,
                    paddingHorizontal: 20,
                    fontFamily: 'ChelseaMarket',
                    fontSize: 15,
                    color: '#222222',
                  }}
                  placeholder="Alamat Email"
                  placeholderTextColor="#222222"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Password Input + Eye Toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: '#FDEAA1',
                      height: 54,
                      borderRadius: 14,
                      paddingHorizontal: 20,
                      fontFamily: 'ChelseaMarket',
                      fontSize: 15,
                      color: '#222222',
                    }}
                    placeholder="Kata Sandi"
                    placeholderTextColor="#222222"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    style={{
                      width: 54,
                      height: 54,
                      backgroundColor: '#FDEAA1',
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <EyeIcon visible={showPassword} />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input + Eye Toggle (Register Only) */}
                {!isLogin && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: '#FDEAA1',
                        height: 54,
                        borderRadius: 14,
                        paddingHorizontal: 20,
                        fontFamily: 'ChelseaMarket',
                        fontSize: 15,
                        color: '#222222',
                      }}
                      placeholder="Konfirmasi Sandi"
                      placeholderTextColor="#222222"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />

                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      activeOpacity={0.7}
                      style={{
                        width: 54,
                        height: 54,
                        backgroundColor: '#FDEAA1',
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Action Button */}
              <View style={{ marginTop: isLogin ? 40 : 32 }}>
                <Button
                  title={isLogin ? 'Masuk' : 'Daftar'}
                  variant="filled"
                  onPress={handleSubmit}
                />
              </View>
            </Animated.View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
