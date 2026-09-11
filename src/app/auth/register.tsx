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

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    // TODO: Implement registration logic
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
            }}
          >
            <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center' }}>
              {/* Title & Subtitle */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: 'ChelseaMarket',
                    fontSize: 25,
                    color: '#262626',
                    textAlign: 'center',
                  }}
                >
                  Buat Akun
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 13.5,
                      color: '#262626',
                    }}
                  >
                    Sudah punya akun?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/login')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontFamily: 'ChelseaMarket',
                        fontSize: 13.5,
                        color: '#F5B842',
                      }}
                    >
                      Masuk
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Inputs */}
              <View style={{ gap: 14 }}>
                {/* Nama Lengkap */}
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
                  placeholder="Nama Lengkap"
                  placeholderTextColor="#262626"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                {/* Alamat Email */}
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

                {/* Kata Sandi + Eye Toggle */}
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

                {/* Konfirmasi Sandi + Eye Toggle */}
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
                    placeholder="Konfirmasi Sandi"
                    placeholderTextColor="#262626"
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
                      backgroundColor: '#FCE588',
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <EyeIcon visible={showConfirmPassword} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Button (labeled Masuk according to the design reference) */}
              <View style={{ marginTop: 36 }}>
                <Button
                  title="Masuk"
                  variant="filled"
                  onPress={handleRegister}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

