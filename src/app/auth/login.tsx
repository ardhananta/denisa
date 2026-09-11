import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import Button from '@/components/Button';
import Mascot2Svg from '@/components/Mascot2Svg';

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={7.5} stroke="#262626" strokeWidth={2.4} />
      <Circle cx={12} cy={12} r={3.4} fill="#262626" />
      {!visible && (
        <Path
          d="M4.5 19.5L19.5 4.5"
          stroke="#262626"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // TODO: Implement authentication logic
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FEED87' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEED87" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Section with edge-to-edge Mascot2 and built-in white convex curve */}
          <View
            style={{
              backgroundColor: '#FEED87',
              width: '100%',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <Mascot2Svg width="100%" />
          </View>

          {/* White Card Content */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 28,
              paddingTop: 10,
              paddingBottom: 40,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center' }}>
              {/* Title & Subtitle */}
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <Text
                  style={{
                    fontFamily: 'ChelseaMarket',
                    fontSize: 25,
                    color: '#262626',
                    textAlign: 'center',
                  }}
                >
                  Masuk
                </Text>
                <Text
                  style={{
                    fontFamily: 'ChelseaMarket',
                    fontSize: 13.5,
                    color: '#262626',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Baru mengenal Denisa?
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/auth/register')}
                  activeOpacity={0.7}
                  style={{ marginTop: 2 }}
                >
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 13.5,
                      color: '#F5B842',
                      textAlign: 'center',
                    }}
                  >
                    Buat akun
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Inputs */}
              <View style={{ gap: 14 }}>
                {/* Email Input */}
                <TextInput
                  style={{
                    backgroundColor: '#FCE588',
                    height: 54,
                    borderRadius: 14,
                    paddingHorizontal: 20,
                    fontFamily: 'ChelseaMarket',
                    fontSize: 15,
                    color: '#262626',
                  }}
                  placeholder="Alamat Email"
                  placeholderTextColor="#262626"
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
                      backgroundColor: '#FCE588',
                      height: 54,
                      borderRadius: 14,
                      paddingHorizontal: 20,
                      fontFamily: 'ChelseaMarket',
                      fontSize: 15,
                      color: '#262626',
                    }}
                    placeholder="Kata Sandi"
                    placeholderTextColor="#262626"
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
                      backgroundColor: '#FCE588',
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
            <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center', marginTop: 48 }}>
              <Button
                title="Masuk"
                variant="filled"
                onPress={handleLogin}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

