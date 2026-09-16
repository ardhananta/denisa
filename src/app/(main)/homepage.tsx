import Button from '@/components/Button';
import MascotSvg from '@/components/MascotSvg';
import { apiService } from '@/services/api';
import { storageService, StoredUser } from '@/services/storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
  Image as SvgImage,
} from 'react-native-svg';

// Custom Navigation Icons matching reference
function HomeIcon({ active }: { active?: boolean }) {
  const bodyColor = active ? '#E2852E' : '#D48D1A';
  const smileColor = active ? '#FFFFFF' : '#FDE882';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L3.5 9.8C2.8 10.4 2.5 11.2 2.5 12V19.5C2.5 20.9 3.6 22 5 22H19C20.4 22 21.5 20.9 21.5 19.5V12C21.5 11.2 21.2 10.4 20.5 9.8L12 2.5Z"
        fill={bodyColor}
      />
      <Path
        d="M9 14.5C9.8 16.2 10.8 17 12 17C13.2 17 14.2 16.2 15 14.5"
        stroke={smileColor}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProgressIcon({ active }: { active?: boolean }) {
  const heartColor = active ? '#E2852E' : '#D48D1A';
  const pulseColor = active ? '#FFFFFF' : '#FDE882';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={heartColor}
      />
      <Path
        d="M5.5 9.5H8.2L9.8 6.5L13.2 13L14.8 9.5H18.5"
        stroke={pulseColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ active }: { active?: boolean }) {
  const color = active ? '#E2852E' : '#D48D1A';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={7.5} r={4.5} fill={color} />
      <Path
        d="M4.5 19.5C4.5 16.2 7.8 14.2 12 14.2C16.2 14.2 19.5 16.2 19.5 19.5V20.5C19.5 21.1 19 21.5 18.4 21.5H5.6C5 21.5 4.5 21.1 4.5 20.5V19.5Z"
        fill={color}
      />
    </Svg>
  );
}

export default function HomepageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'beranda' | 'proggres' | 'profile'>('beranda');

  // App data state
  const [user, setUser] = useState<StoredUser | null>(null);
  const [activeChild, setActiveChild] = useState<any | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Exact scale based on original 402x355 design
  const scale = width / 402;
  const bannerHeight = 355 * scale;

  useEffect(() => {
    (async () => {
      const storedUser = await storageService.getUser();
      setUser(storedUser);

      const child = await storageService.getActiveChild();
      if (child) {
        setActiveChild(child);
      } else {
        // Fetch children from API if not yet in storage
        try {
          const res = await apiService.getChildren();
          if (res.data && res.data.length > 0) {
            setActiveChild(res.data[0]);
            await storageService.setActiveChild(res.data[0]);
          }
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  // Fetch assessment history when switching to Proggres tab
  useEffect(() => {
    if (activeTab === 'proggres') {
      (async () => {
        setLoadingHistory(true);
        try {
          const res = await apiService.getAssessments();
          if (res.data) {
            setAssessments(res.data);
          }
        } catch (err) {
          console.warn('Failed to load assessments history:', err);
        } finally {
          setLoadingHistory(false);
        }
      })();
    }
  }, [activeTab]);

  const handleStartScreening = async () => {
    const session = await storageService.getActiveSession();
    if (session) {
      router.push('/(main)/mchat');
      return;
    }

    if (!activeChild) {
      router.push('/auth/complete-registration');
      return;
    }

    router.push('/(main)/mchat');
  };

  const handleLogout = async () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun Denisa?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await storageService.clearAll();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const childDisplayName = activeChild?.name || 'Ananda';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#82D2FB" />

      {activeTab === 'beranda' && (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom, 16) + 88,
            backgroundColor: '#FFFFFF',
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Hero Banner Section */}
          <View
            style={{
              width: width,
              height: bannerHeight,
              position: 'relative',
            }}
          >
            {/* Vector-Clipped Hero Banner */}
            <Svg
              width={width}
              height={bannerHeight}
              viewBox="0 0 402 355"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <Defs>
                <ClipPath id="bannerShape">
                  <Path d="M0 0 H402 V307.2 C402 307.2 344.5 355 194.2 355 C43.8 355 0 307.2 0 307.2 Z" />
                </ClipPath>
              </Defs>

              <G clipPath="url(#bannerShape)">
                <Rect x="0" y="0" width="402" height="355" fill="#82D2FB" />
                <SvgImage
                  x="-24"
                  y="101"
                  width="452"
                  height="254"
                  preserveAspectRatio="none"
                  href={require('@/assets/images/homebanner.png')}
                />
              </G>
            </Svg>

            {/* Top Sky Greeting Text */}
            <View
              style={{
                position: 'absolute',
                top: Math.max(insets.top + 4, 16),
                left: 16,
                right: 16,
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: 'ChelseaMarket',
                  fontSize: 19,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: 26,
                  textShadowColor: 'rgba(0, 0, 0, 0.22)',
                  textShadowOffset: { width: 0, height: 1.5 },
                  textShadowRadius: 3,
                }}
              >
                Halo bunda, bagaimana
              </Text>
              <Text
                style={{
                  fontFamily: 'ChelseaMarket',
                  fontSize: 19,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: 26,
                  textShadowColor: 'rgba(0, 0, 0, 0.22)',
                  textShadowOffset: { width: 0, height: 1.5 },
                  textShadowRadius: 3,
                }}
              >
                kondisi <Text style={{ color: '#FFE600' }}>{childDisplayName}</Text> hari ini?
              </Text>
            </View>

            {/* Centered 3D "Mulai" Button on Rollercoaster Cart */}
            <View
              style={{
                position: 'absolute',
                top: 236 * scale,
                left: 0,
                right: 0,
                alignItems: 'center',
                zIndex: 15,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleStartScreening}
                style={{
                  backgroundColor: '#F3BE46',
                  borderRadius: 28,
                  paddingBottom: 5,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 42,
                    paddingVertical: 10,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'ChelseaMarket',
                      fontSize: 18,
                      color: '#262626',
                      textAlign: 'center',
                    }}
                  >
                    Mulai
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Layanan Denisa Section */}
          <View style={{ paddingTop: 18 }}>
            <Text
              style={{
                fontFamily: 'ChelseaMarket',
                fontSize: 22,
                color: '#262626',
                marginBottom: 16,
                paddingHorizontal: 24,
              }}
            >
              Layanan Denisa
            </Text>

            {/* Service Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                gap: 16,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleStartScreening}
                style={styles.serviceCard}
              >
                <Text style={styles.serviceTag}>M-CHAT-R/F</Text>
                <Text style={styles.serviceTitle}>Skrining Dini ASD</Text>
                <Text style={styles.serviceDesc}>
                  Wawancara klinis cerdas berbasis suara bersama Denis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/auth/complete-registration')}
                style={[styles.serviceCard, { backgroundColor: '#FDEAA1' }]}
              >
                <Text style={[styles.serviceTag, { color: '#B7791F', backgroundColor: '#FEFCBF' }]}>
                  Profil Anak
                </Text>
                <Text style={styles.serviceTitle}>Data Tumbuh Kembang</Text>
                <Text style={styles.serviceDesc}>
                  Pantau usia gestasi, catatan khusus, dan milestone perkembangan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('proggres')}
                style={[styles.serviceCard, { backgroundColor: '#FED7D7' }]}
              >
                <Text style={[styles.serviceTag, { color: '#9B2C2C', backgroundColor: '#FFF5F5' }]}>
                  Laporan
                </Text>
                <Text style={styles.serviceTitle}>Riwayat Klinis</Text>
                <Text style={styles.serviceDesc}>
                  Akses rekomendasi dokter anak dan rangkuman risiko kapan saja
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* Tab 2: Progres / Riwayat Skrining */}
      {activeTab === 'proggres' && (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 16) + 88,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 24, color: '#222222', marginBottom: 6 }}>
            Riwayat Skrining
          </Text>
          <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13, color: '#666666', marginBottom: 20 }}>
            Catatan pemeriksaan tumbuh kembang ananda {childDisplayName}
          </Text>

          {loadingHistory ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#E2852E" />
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13, color: '#888', marginTop: 10 }}>
                Memuat riwayat skrining...
              </Text>
            </View>
          ) : assessments.length === 0 ? (
            <View style={styles.emptyCard}>
              <MascotSvg width={180} />
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 16, color: '#333333', marginTop: 14 }}>
                Belum ada riwayat skrining
              </Text>
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 12.5, color: '#777777', textAlign: 'center', marginTop: 6, marginBottom: 16 }}>
                Lakukan skrining awal M-CHAT bersama Denis untuk melihat analisis risiko tumbuh kembang.
              </Text>
              <Button
                title="Mulai Skrining Baru"
                variant="filled"
                onPress={handleStartScreening}
                style={{ backgroundColor: '#E2852E', height: 46 }}
                textStyle={{ fontSize: 15, color: '#FFFFFF' }}
              />
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {assessments.map((item, idx) => (
                <View key={item.id || idx} style={styles.historyCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 15, color: '#222222' }}>
                      {item.instrument_type === 'mchat_rf' ? 'M-CHAT-R/F' : 'CSBS DP'}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {item.status === 'completed' ? 'Selesai' : 'Dalam Proses'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 12, color: '#777777', marginTop: 4 }}>
                    ID Sesi: {item.id}
                  </Text>
                  {item.summary && (
                    <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13, color: '#444444', marginTop: 8 }}>
                      {item.summary}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Tab 3: Profile */}
      {activeTab === 'profile' && (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 16) + 88,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 24, color: '#222222', marginBottom: 20 }}>
            Profil Pengguna
          </Text>

          {/* User Details Card */}
          <View style={styles.profileCard}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#9CD5F4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <ProfileIcon active />
            </View>
            <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 18, color: '#222222' }}>
              {user?.display_name || 'Bunda / Ayah'}
            </Text>
            <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13, color: '#777777', marginTop: 2 }}>
              {user?.email || '-'}
            </Text>
          </View>

          {/* Child Details Card */}
          <View style={[styles.profileCard, { alignItems: 'flex-start', marginTop: 16 }]}>
            <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 15, color: '#222222', marginBottom: 8 }}>
              Data Ananda Tercinta
            </Text>
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#444' }}>
                Nama: <Text style={{ color: '#E2852E' }}>{activeChild?.name || '-'}</Text>
              </Text>
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#444' }}>
                Jenis Kelamin: <Text style={{ color: '#E2852E' }}>{activeChild?.gender || '-'}</Text>
              </Text>
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13.5, color: '#444' }}>
                Tanggal Lahir: <Text style={{ color: '#E2852E' }}>{activeChild?.date_of_birth ? new Date(activeChild.date_of_birth).toLocaleDateString('id-ID') : '-'}</Text>
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/auth/complete-registration')}
              style={{ marginTop: 14 }}
            >
              <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 13, color: '#3182CE' }}>
                + Tambah / Perbarui Data Anak
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logout Action */}
          <View style={{ marginTop: 28 }}>
            <Button
              title="Keluar dari Akun"
              variant="outlined"
              onPress={handleLogout}
              style={{ borderColor: '#E53E3E' }}
              textStyle={{ color: '#E53E3E' }}
            />
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Navigation Container */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + 4,
          left: 24,
          right: 24,
          zIndex: 20,
        }}
      >
        {/* Description on top-left of bottom bar */}
        <View
          style={{
            alignSelf: 'flex-start',
            marginBottom: 6,
            marginLeft: 8,
            paddingHorizontal: 14,
            paddingVertical: 4,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            shadowColor: '#E2852E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontFamily: 'ChelseaMarket',
              fontSize: 12,
              color: '#E2852E',
            }}
          >
            {activeTab === 'beranda'
              ? 'Beranda'
              : activeTab === 'proggres'
                ? 'Progres'
                : 'Profile'}
          </Text>
        </View>

        {/* Floating Bottom Navigation Bar */}
        <View
          style={{
            height: 64,
            backgroundColor: '#FDE882',
            borderRadius: 32,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: 16,
            shadowColor: '#A8801A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {/* Tab 1: Beranda */}
          <TouchableOpacity
            onPress={() => setActiveTab('beranda')}
            activeOpacity={0.85}
            style={styles.navTabBtn}
          >
            {activeTab === 'beranda' ? (
              <View style={styles.activeTabBubble}>
                <HomeIcon active />
              </View>
            ) : (
              <HomeIcon active={false} />
            )}
          </TouchableOpacity>

          {/* Tab 2: Proggres */}
          <TouchableOpacity
            onPress={() => setActiveTab('proggres')}
            activeOpacity={0.85}
            style={styles.navTabBtn}
          >
            {activeTab === 'proggres' ? (
              <View style={styles.activeTabBubble}>
                <ProgressIcon active />
              </View>
            ) : (
              <ProgressIcon active={false} />
            )}
          </TouchableOpacity>

          {/* Tab 3: Profile */}
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.85}
            style={styles.navTabBtn}
          >
            {activeTab === 'profile' ? (
              <View style={styles.activeTabBubble}>
                <ProfileIcon active />
              </View>
            ) : (
              <ProfileIcon active={false} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navTabBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#F3BE46',
    shadowColor: '#8A5D0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  serviceCard: {
    width: 180,
    height: 240,
    backgroundColor: '#A6DCED',
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceTag: {
    alignSelf: 'flex-start',
    fontFamily: 'ChelseaMarket',
    fontSize: 11,
    color: '#2B6CB0',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  serviceTitle: {
    fontFamily: 'ChelseaMarket',
    fontSize: 16,
    color: '#222222',
  },
  serviceDesc: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
  },
  emptyCard: {
    backgroundColor: '#FAF8EE',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDEAA1',
  },
  historyCard: {
    backgroundColor: '#FAF8EE',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EAD6',
  },
  statusBadge: {
    backgroundColor: '#C6F6D5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 11.5,
    color: '#22543D',
  },
  profileCard: {
    backgroundColor: '#FAF8EE',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EAD6',
  },
});
