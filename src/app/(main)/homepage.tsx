import Button from '@/components/Button';
import { Card1Visual, Card2Visual } from '@/components/CardVisuals';
import MascotSvg from '@/components/MascotSvg';
import {
  HeartPulseIcon,
  HomeSmileIcon,
  SparkleDeco,
  UserNavIcon,
} from '@/components/NavIcons';
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
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
  Image as SvgImage,
} from 'react-native-svg';

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

  const handleGameTherapy = () => {
    Alert.alert(
      'Game Terapi Denisa',
      'Fitur Game Terapi membantu stimulasi motorik, komunikasi, dan sensorik ananda secara interaktif.\n\nApakah Anda ingin memulai skrining M-CHAT terlebih dahulu untuk rekomendasi terapi yang tepat?',
      [
        { text: 'Nanti', style: 'cancel' },
        {
          text: 'Mulai Skrining',
          onPress: handleStartScreening,
        },
      ]
    );
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

      {/* Tab 1: Beranda (Main Reference Dashboard) */}
      {activeTab === 'beranda' && (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom, 16) + 90,
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
              backgroundColor: '#FFFFFF',
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
                top: Math.max(insets.top + 8, 20),
                left: 16,
                right: 16,
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: 'ChelseaMarket',
                  fontSize: Math.min(20, width * 0.052),
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: 27,
                  textShadowColor: 'rgba(0, 0, 0, 0.25)',
                  textShadowOffset: { width: 0, height: 1.5 },
                  textShadowRadius: 3,
                }}
              >
                Halo bunda, bagaimana
              </Text>
              <Text
                style={{
                  fontFamily: 'ChelseaMarket',
                  fontSize: Math.min(20, width * 0.052),
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: 27,
                  textShadowColor: 'rgba(0, 0, 0, 0.25)',
                  textShadowOffset: { width: 0, height: 1.5 },
                  textShadowRadius: 3,
                }}
              >
                kondisi <Text style={{ color: '#FFE600' }}>{childDisplayName}</Text> hari ini?
              </Text>
            </View>

            {/* Centered White Pill "Mulai" Button on Rollercoaster Cart */}
            <View
              style={{
                position: 'absolute',
                top: 234 * scale,
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
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 42,
                  paddingVertical: 9,
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: '#EFEFEF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.16,
                  shadowRadius: 5,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'ChelseaMarket',
                    fontSize: 17,
                    color: '#262626',
                    textAlign: 'center',
                  }}
                >
                  Mulai
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Pantau Perkembangan Anak */}
          <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontFamily: 'ChelseaMarket',
                fontSize: 20,
                color: '#262626',
                marginBottom: 16,
                paddingHorizontal: 4,
              }}
            >
              Pantau Perkembangan Anak
            </Text>

            {/* 2-Column Grid Cards matching reference UI */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 14,
              }}
            >
              {/* Card 1: Deteksi Dini */}
              <View style={styles.dashboardCard}>
                {/* Illustration Top Visual */}
                <Card1Visual height={175} />

                {/* Content Section */}
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.cardTitle}>Deteksi Dini</Text>
                    <Text style={styles.cardDescription}>
                      Mulai kenali gejala dini tanda awal autisme pada anak.
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleStartScreening}
                    style={styles.cardOutlinedBtn}
                  >
                    <Text style={styles.cardOutlinedBtnText}>Mulai</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 2: Game Terapi */}
              <View style={styles.dashboardCard}>
                {/* Illustration Top Visual */}
                <Card2Visual height={175} />

                {/* Content Section */}
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.cardTitle}>Game Terapi</Text>
                    <Text style={styles.cardDescription}>
                      Terapkan terapi untuk membantu pertumbuhan anak
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleGameTherapy}
                    style={styles.cardOutlinedBtn}
                  >
                    <Text style={styles.cardOutlinedBtnText}>Mulai</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Tab 2: Progres / Riwayat Skrining */}
      {activeTab === 'proggres' && (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 16) + 90,
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
            paddingBottom: Math.max(insets.bottom, 16) + 90,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontFamily: 'ChelseaMarket', fontSize: 24, color: '#222222', marginBottom: 20 }}>
            Profil Pengguna
          </Text>

          {/* User Details Card */}
          <View style={styles.profileCard}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFE29A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <UserNavIcon color="#E2852E" size={32} />
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

      {/* Floating Bottom Navigation Bar matching reference UI */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + 4,
          left: 24,
          right: 24,
          zIndex: 30,
        }}
      >
        <View style={styles.floatingNavBar}>
          {/* Tab 1: Beranda */}
          <TouchableOpacity
            onPress={() => setActiveTab('beranda')}
            activeOpacity={0.85}
            style={activeTab === 'beranda' ? styles.activeTabPill : styles.inactiveTabBtn}
          >
            {activeTab === 'beranda' ? (
              <View style={styles.activePillContent}>
                <SparkleDeco />
                <HomeSmileIcon color="#DF8026" size={24} />
                <Text style={styles.activePillText}>Beranda</Text>
              </View>
            ) : (
              <HomeSmileIcon color="#FFEE91" size={26} />
            )}
          </TouchableOpacity>

          {/* Tab 2: Proggres */}
          <TouchableOpacity
            onPress={() => setActiveTab('proggres')}
            activeOpacity={0.85}
            style={activeTab === 'proggres' ? styles.activeTabPill : styles.inactiveTabBtn}
          >
            {activeTab === 'proggres' ? (
              <View style={styles.activePillContent}>
                <HeartPulseIcon color="#DF8026" size={24} />
                <Text style={styles.activePillText}>Progres</Text>
              </View>
            ) : (
              <HeartPulseIcon color="#FFEE91" size={26} />
            )}
          </TouchableOpacity>

          {/* Tab 3: Profile */}
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.85}
            style={activeTab === 'profile' ? styles.activeTabPill : styles.inactiveTabBtn}
          >
            {activeTab === 'profile' ? (
              <View style={styles.activePillContent}>
                <UserNavIcon color="#DF8026" size={24} />
                <Text style={styles.activePillText}>Profil</Text>
              </View>
            ) : (
              <UserNavIcon color="#FFEE91" size={26} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Dashboard 2-column cards
  dashboardCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#ECECEC',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15.5,
    color: '#222222',
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: 'ChelseaMarket',
    fontSize: 10.5,
    color: '#444444',
    lineHeight: 14.5,
    marginBottom: 14,
    minHeight: 30,
  },
  cardOutlinedBtn: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2852E',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardOutlinedBtnText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 13.5,
    color: '#E2852E',
    textAlign: 'center',
  },

  // Floating Bottom Navigation Bar
  floatingNavBar: {
    height: 64,
    backgroundColor: '#DF8026',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#B05C0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activeTabPill: {
    height: 48,
    backgroundColor: '#FFEE91',
    borderRadius: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#A0500A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  activePillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activePillText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#DF8026',
  },
  inactiveTabBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sub-tabs styles (History & Profile)
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
