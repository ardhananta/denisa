import Button from '@/components/Button';
import Mascot2Svg from '@/components/Mascot2Svg';
import { apiService, CompleteRegistrationPayload } from '@/services/api';
import { storageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Form states
  const [childName, setChildName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState<'laki-laki' | 'perempuan' | null>(null);
  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [notes, setNotes] = useState('');
  const [instrumentType, setInstrumentType] = useState<'mchat_rf' | 'csbs_dp' | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mascot pop-up animation values (matches login & register)
  const [mascotTranslateY] = useState(() => new Animated.Value(55));
  const [mascotScale] = useState(() => new Animated.Value(0.9));

  // Form transition animation values (smooth fade and slide up)
  const [formOpacity] = useState(() => new Animated.Value(0));
  const [formTranslateY] = useState(() => new Animated.Value(24));

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
        duration: 220,
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

  // Live age calculation
  const calculatedAge = useMemo(() => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y) || year.trim().length !== 4) return null;

    const dob = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const now = new Date();
    if (isNaN(dob.getTime()) || dob > now) return null;
    if (dob.getUTCFullYear() !== y || dob.getUTCMonth() !== m - 1 || dob.getUTCDate() !== d) return null;

    let years = now.getUTCFullYear() - dob.getUTCFullYear();
    let months = now.getUTCMonth() - dob.getUTCMonth();
    let days = now.getUTCDate() - dob.getUTCDate();

    if (days < 0) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMonths = years * 12 + months;
    return { years, months, totalMonths };
  }, [day, month, year]);

  const validate = (): { valid: boolean; error?: string; dobIso?: string } => {
    // 1. Child Name
    const trimmedName = childName.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      return { valid: false, error: 'Nama wajib diisi (2-100 karakter)' };
    }

    // 2. Date of birth validation
    const d = parseInt(day.trim(), 10);
    const m = parseInt(month.trim(), 10);
    const y = parseInt(year.trim(), 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12) {
      return { valid: false, error: 'Masukkan tanggal lahir anak yang valid (Hari 1-31, Bulan 1-12)' };
    }

    if (year.trim().length !== 4) {
      return { valid: false, error: 'Tahun lahir harus 4 digit angka (misal: 2023)' };
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();

    if (y < currentYear - 8 || y > currentYear) {
      return { valid: false, error: `Tahun lahir harus antara ${currentYear - 8} dan ${currentYear}` };
    }

    const dob = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));

    // Precise calendar check (leap years, 28/29/30/31 days)
    if (
      dob.getUTCFullYear() !== y ||
      dob.getUTCMonth() !== m - 1 ||
      dob.getUTCDate() !== d
    ) {
      return { valid: false, error: 'Tanggal lahir tidak sesuai kalender (misal: 31 Februari atau 31 April)' };
    }

    if (dob > now) {
      return { valid: false, error: 'Tanggal lahir anak tidak boleh di masa depan' };
    }

    // Age bound checks: min 1 month, max 7 years
    const diffMs = now.getTime() - dob.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (totalDays < 30) {
      return { valid: false, error: 'Usia anak minimal 1 bulan untuk melakukan skrining tumbuh kembang' };
    }

    const ageInMonths = Math.floor(totalDays / 30.4375);
    if (ageInMonths > 84) {
      return { valid: false, error: 'Skrining diperuntukkan bagi balita (maksimal usia 7 tahun)' };
    }

    const dobIso = dob.toISOString();

    // 3. Gender
    if (!gender) {
      return { valid: false, error: 'Pilih jenis kelamin anak' };
    }

    // 4. Gestational weeks
    if (gestationalWeeks.trim()) {
      const gw = parseInt(gestationalWeeks.trim(), 10);
      if (isNaN(gw) || gw < 20 || gw > 44) {
        return { valid: false, error: 'Usia gestasi harus 20-44 minggu' };
      }
    }

    return { valid: true, dobIso };
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    const { valid, error, dobIso } = validate();
    if (!valid || !dobIso) {
      setErrorMessage(error || 'Data anak belum lengkap');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CompleteRegistrationPayload = {
        child_name: childName.trim(),
        date_of_birth: dobIso,
        gender: gender!,
        notes: notes.trim() || undefined,
      };

      if (gestationalWeeks.trim()) {
        payload.gestational_weeks = parseInt(gestationalWeeks.trim(), 10);
      }

      if (instrumentType) {
        payload.instrument_type = instrumentType;
      }

      const res = await apiService.completeRegistration(payload);

      const firstAudio = res.data?.audio_base64 || res.data?.session?.audio_base64;
      if (res.data?.session) {
        await storageService.setActiveSession({
          ...res.data.session,
          first_question: res.data.first_question,
          audio_base64: firstAudio,
        });
      }
      if (res.data?.child) {
        await storageService.setActiveChild(res.data.child);
      }

      // Automatically navigate to Interactive Screening Room with audio
      router.replace({
        pathname: '/(main)/mchat',
        params: {
          sessionId: res.data?.session?.id,
          firstQuestion: res.data?.first_question,
          firstQuestionAudio: firstAudio,
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data anak. Periksa koneksi backend.');
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Header with Mascot2 & spring animation (Exact same layout as login & register) */}
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

          {/* Form Card Container with Curved Dome Header overlapping Mascot */}
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
                paddingBottom: Math.max(insets.bottom, 24) + 20,
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
                <View style={{ alignItems: 'center', marginBottom: 22 }}>
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 25,
                      color: '#222222',
                      textAlign: 'center',
                    }}
                  >
                    Lengkapi Data Anak
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 13.5,
                      color: '#222222',
                      textAlign: 'center',
                      marginTop: 4,
                      lineHeight: 18,
                    }}
                  >
                    Informasi ini digunakan untuk menyesuaikan skrining tumbuh kembang
                  </Text>
                </View>

                {/* Error Banner */}
                {errorMessage && (
                  <View
                    style={{
                      backgroundColor: '#FDE8E8',
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      marginBottom: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#E53E3E',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'ChelseaMarket',
                        fontSize: 13,
                        color: '#C53030',
                        lineHeight: 18,
                      }}
                    >
                      {errorMessage}
                    </Text>
                  </View>
                )}

                {/* Form Inputs */}
                {/* 1. Nama Lengkap Anak */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#222222', marginBottom: 6 }}>
                    Nama Lengkap Anak <Text style={{ color: '#E53E3E' }}>*</Text>
                  </Text>
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
                    placeholder="Contoh: Adik Kenzo"
                    placeholderTextColor="#888888"
                    value={childName}
                    onChangeText={(val) => {
                      setChildName(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* 2. Tanggal Lahir (HH / BB / TTTT) */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#222222', marginBottom: 6 }}>
                    Tanggal Lahir Anak <Text style={{ color: '#E53E3E' }}>*</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: '#FDEAA1',
                        height: 54,
                        borderRadius: 14,
                        textAlign: 'center',
                        fontFamily: 'ChelseaMarket',
                        fontSize: 15,
                        color: '#222222',
                      }}
                      placeholder="HH"
                      placeholderTextColor="#888888"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={day}
                      onChangeText={(val) => {
                        const digits = val.replace(/[^0-9]/g, '');
                        if (digits === '') {
                          setDay('');
                        } else {
                          const num = parseInt(digits, 10);
                          if (num < 1) {
                            setDay(digits.length === 1 ? digits : '1');
                          } else if (num > 31) {
                            setDay('31');
                          } else {
                            setDay(digits);
                          }
                        }
                        if (errorMessage) setErrorMessage(null);
                      }}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: '#FDEAA1',
                        height: 54,
                        borderRadius: 14,
                        textAlign: 'center',
                        fontFamily: 'ChelseaMarket',
                        fontSize: 15,
                        color: '#222222',
                      }}
                      placeholder="BB"
                      placeholderTextColor="#888888"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={month}
                      onChangeText={(val) => {
                        const digits = val.replace(/[^0-9]/g, '');
                        if (digits === '') {
                          setMonth('');
                        } else {
                          const num = parseInt(digits, 10);
                          if (num < 1) {
                            setMonth(digits.length === 1 ? digits : '1');
                          } else if (num > 12) {
                            setMonth('12');
                          } else {
                            setMonth(digits);
                          }
                        }
                        if (errorMessage) setErrorMessage(null);
                      }}
                    />
                    <TextInput
                      style={{
                        flex: 1.4,
                        backgroundColor: '#FDEAA1',
                        height: 54,
                        borderRadius: 14,
                        textAlign: 'center',
                        fontFamily: 'ChelseaMarket',
                        fontSize: 15,
                        color: '#222222',
                      }}
                      placeholder="TTTT"
                      placeholderTextColor="#888888"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={year}
                      onChangeText={(val) => {
                        const digits = val.replace(/[^0-9]/g, '');
                        setYear(digits);
                        if (errorMessage) setErrorMessage(null);
                      }}
                    />
                  </View>

                  {/* Live Calculated Age Feedback */}
                  {calculatedAge && (
                    <View
                      style={{
                        marginTop: 8,
                        backgroundColor:
                          calculatedAge.totalMonths >= 16 && calculatedAge.totalMonths <= 30
                            ? '#E6FFFA'
                            : '#EBF8FF',
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor:
                          calculatedAge.totalMonths >= 16 && calculatedAge.totalMonths <= 30
                            ? '#38B2AC'
                            : '#90CDF4',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 2a5 5 0 100 10A5 5 0 0012 2zM4 20a8 8 0 0116 0"
                            stroke={
                              calculatedAge.totalMonths >= 16 && calculatedAge.totalMonths <= 30
                                ? '#234E52'
                                : '#2A4365'
                            }
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                        <Text
                          style={{
                            fontFamily: 'ChelseaMarket',
                            fontSize: 12.5,
                            color:
                              calculatedAge.totalMonths >= 16 && calculatedAge.totalMonths <= 30
                                ? '#234E52'
                                : '#2A4365',
                          }}
                        >
                          Usia: {calculatedAge.years > 0 ? `${calculatedAge.years} tahun ` : ''}
                          {calculatedAge.months} bulan ({calculatedAge.totalMonths} bln)
                        </Text>
                      </View>
                      {calculatedAge.totalMonths >= 16 && calculatedAge.totalMonths <= 30 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M12 2l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 11l-3.75 2.75 1.5-4.5L6 6.5h4.5L12 2z"
                              fill="#285E61"
                            />
                          </Svg>
                          <Text
                            style={{
                              fontFamily: 'ChelseaMarket',
                              fontSize: 11,
                              color: '#285E61',
                              fontWeight: 'bold',
                            }}
                          >
                            Ideal M-CHAT-R/F
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* 3. Jenis Kelamin */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#222222', marginBottom: 6 }}>
                    Jenis Kelamin <Text style={{ color: '#E53E3E' }}>*</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setGender('laki-laki');
                        if (errorMessage) setErrorMessage(null);
                      }}
                      style={{
                        flex: 1,
                        height: 54,
                        borderRadius: 14,
                        backgroundColor: gender === 'laki-laki' ? '#9CD5F4' : '#F4F4F4',
                        borderWidth: 2,
                        borderColor: gender === 'laki-laki' ? '#59B2E3' : '#E2E2E2',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'ChelseaMarket',
                          fontSize: 14,
                          color: gender === 'laki-laki' ? '#1A4D6E' : '#666666',
                        }}
                      >
                        👦 Laki-laki
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setGender('perempuan');
                        if (errorMessage) setErrorMessage(null);
                      }}
                      style={{
                        flex: 1,
                        height: 54,
                        borderRadius: 14,
                        backgroundColor: gender === 'perempuan' ? '#FBCFE8' : '#F4F4F4',
                        borderWidth: 2,
                        borderColor: gender === 'perempuan' ? '#F472B6' : '#E2E2E2',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'ChelseaMarket',
                          fontSize: 14,
                          color: gender === 'perempuan' ? '#831843' : '#666666',
                        }}
                      >
                        👧 Perempuan
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Usia Gestasi (Opsional) */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#222222', marginBottom: 6 }}>
                    Usia Gestasi (Opsional, 20–44 minggu)
                  </Text>
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
                    placeholder="Contoh: 39 (minggu)"
                    placeholderTextColor="#888888"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={gestationalWeeks}
                    onChangeText={(val) => {
                      setGestationalWeeks(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                </View>

                {/* 5. Catatan / Kondisi Lahir (Opsional) */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#222222', marginBottom: 6 }}>
                    Catatan Khusus (Opsional)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FDEAA1',
                      minHeight: 70,
                      borderRadius: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      fontFamily: 'ChelseaMarket',
                      fontSize: 14,
                      color: '#222222',
                      textAlignVertical: 'top',
                    }}
                    placeholder="Lahir cukup bulan, aktif dan sehat..."
                    placeholderTextColor="#888888"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* 6. Pilihan Instrumen Skrining */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#222222', marginBottom: 6 }}>
                    Instrumen Skrining
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setInstrumentType('')}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: instrumentType === '' ? '#F5B842' : '#F4F4F4',
                        borderWidth: 1.5,
                        borderColor: instrumentType === '' ? '#E0A330' : '#E2E2E2',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'ChelseaMarket',
                          fontSize: 12.5,
                          color: instrumentType === '' ? '#FFFFFF' : '#666666',
                        }}
                      >
                        Otomatis
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setInstrumentType('mchat_rf')}
                      style={{
                        flex: 1.2,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: instrumentType === 'mchat_rf' ? '#F5B842' : '#F4F4F4',
                        borderWidth: 1.5,
                        borderColor: instrumentType === 'mchat_rf' ? '#E0A330' : '#E2E2E2',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'ChelseaMarket',
                          fontSize: 12.5,
                          color: instrumentType === 'mchat_rf' ? '#FFFFFF' : '#666666',
                        }}
                      >
                        M-CHAT-R/F
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setInstrumentType('csbs_dp')}
                      style={{
                        flex: 1.1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: instrumentType === 'csbs_dp' ? '#F5B842' : '#F4F4F4',
                        borderWidth: 1.5,
                        borderColor: instrumentType === 'csbs_dp' ? '#E0A330' : '#E2E2E2',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'ChelseaMarket',
                          fontSize: 12.5,
                          color: instrumentType === 'csbs_dp' ? '#FFFFFF' : '#666666',
                        }}
                      >
                        CSBS DP
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Button - Identical to Login/Register button */}
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Mulai Skrining Sekarang"
                    variant="filled"
                    loading={isLoading}
                    disabled={isLoading}
                    onPress={handleSubmit}
                  />
                </View>

                {/* Back to login / Switch Account */}
                <TouchableOpacity
                  onPress={async () => {
                    await storageService.clearAll();
                    router.replace('/auth/login');
                  }}
                  activeOpacity={0.7}
                  style={{ marginTop: 16, alignItems: 'center', paddingVertical: 6 }}
                >
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 13.5,
                      color: '#F5B842',
                    }}
                  >
                    Keluar / Ganti Akun
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
