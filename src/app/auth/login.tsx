import React, { useState } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // TODO: Implement authentication logic
    router.replace('/(main)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#9CD5F4' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#9CD5F4" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#FFFFFF' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Section with edge-to-edge Mascot2 and Sky Blue header */}
          <View
            style={{
              backgroundColor: '#9CD5F4',
              width: '100%',
              paddingTop: insets.top,
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <Mascot2Svg width={width} />
          </View>

          {/* White Card Content */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 28,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center' }}>
              {/* Title & Subtitle */}
              <View style={{ alignItems: 'center', marginBottom: 26 }}>
                <Text
                  style={{
                    fontFamily: 'ChelseaMarket',
                    fontSize: 25,
                    color: '#222222',
                    textAlign: 'center',
                  }}
                >
                  Masuk
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 13.5,
                      color: '#222222',
                    }}
                  >
                    Baru mengenal Denisa?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/register')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontFamily: 'ChelseaMarket',
                        fontSize: 13.5,
                        color: '#F5B842',
                      }}
                    >
                      Buat akun
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Inputs */}
              <View style={{ gap: 14 }}>
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

                {/* Password Input + Eye Button */}
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
              </View>
            </View>

            {/* Bottom Masuk Button */}
            <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center', marginTop: 40 }}>
              <Button
                title="Masuk"
                variant="filled"
                onPress={handleLogin}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
