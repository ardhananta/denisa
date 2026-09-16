import Button from '@/components/Button';
import MascotSvg from '@/components/MascotSvg';
import { apiService, FinalizeResultData } from '@/services/api';
import { storageService } from '@/services/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AssessmentResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ sessionId?: string }>();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<FinalizeResultData | null>(null);
  const [childName, setChildName] = useState<string>('Si Kecil');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const child = await storageService.getActiveChild();
        if (child?.name) {
          setChildName(child.name);
        }

        const session = await storageService.getActiveSession();
        const sessionId = params.sessionId || session?.id;

        if (!sessionId) {
          setError('Sesi skrining tidak ditemukan.');
          setLoading(false);
          return;
        }

        const res = await apiService.finalizeAssessment(sessionId);
        setResult(res.data);
      } catch (err: any) {
        console.warn('Finalize error:', err);
        setError(err.message || 'Gagal mengambil hasil skrining.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.sessionId]);

  const mascotWidth = Math.min(Math.max(width * 0.55, 190), 250);

  const mchat = result?.mchat_result || result?.csbs_result;
  const riskLevel = mchat?.risk_level || 'Risiko Rendah';
  const isHighRisk = riskLevel.toLowerCase().includes('tinggi');
  const isMediumRisk = riskLevel.toLowerCase().includes('sedang');

  const badgeBg = isHighRisk ? '#FED7D7' : isMediumRisk ? '#FEEBC8' : '#C6F6D5';
  const badgeTextColor = isHighRisk ? '#C53030' : isMediumRisk ? '#C05621' : '#276749';
  const badgeBorderColor = isHighRisk ? '#FEB2B2' : isMediumRisk ? '#FBD38D' : '#9AE6B4';

  const handleGoToDashboard = async () => {
    // Clear completed active session
    await storageService.clearActiveSession();
    router.replace('/(main)/homepage');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8EE" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 20) + 30,
          paddingHorizontal: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot & Header */}
        <View style={styles.header}>
          <MascotSvg width={mascotWidth} />
          <Text style={styles.title}>Hasil Skrining Tumbuh Kembang</Text>
          <Text style={styles.subtitle}>
            Laporan klinis interaktif untuk <Text style={{ fontWeight: 'bold' }}>{childName}</Text>
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E2852E" />
            <Text style={styles.loadingText}>Memproses laporan klinis...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleGoToDashboard}>
              <Text style={styles.retryBtnText}>Ke Beranda Utama</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Risk Badge Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Kategori Tingkat Risiko</Text>
              <View
                style={[
                  styles.riskBadge,
                  {
                    backgroundColor: badgeBg,
                    borderColor: badgeBorderColor,
                  },
                ]}
              >
                <Text style={[styles.riskBadgeText, { color: badgeTextColor }]}>
                  {riskLevel}
                </Text>
              </View>

              {typeof mchat?.total_score === 'number' && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Total Skor Baku:</Text>
                  <Text style={styles.scoreValue}>{mchat.total_score}</Text>
                </View>
              )}

              {/* Summary */}
              <View style={styles.divider} />
              <Text style={styles.summaryText}>
                {result?.summary || mchat?.summary || 'Skrining telah selesai dilakukan.'}
              </Text>
            </View>

            {/* Action Required Card */}
            {mchat?.action_required && (
              <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: '#E2852E' }]}>
                <Text style={styles.sectionHeader}>Tindak Lanjut yang Disarankan</Text>
                <Text style={styles.bodyText}>{mchat.action_required}</Text>
              </View>
            )}

            {/* Recommendations Card */}
            {mchat?.recommendations && mchat.recommendations.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>Rekomendasi Dokter Anak</Text>
                <View style={{ gap: 10, marginTop: 8 }}>
                  {mchat.recommendations.map((rec, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Complete & Go to Dashboard Button */}
            <View style={{ marginTop: 14 }}>
              <Button
                title="Lanjut ke Dashboard Beranda"
                variant="filled"
                onPress={handleGoToDashboard}
                style={{ backgroundColor: '#E2852E' }}
                textStyle={{ color: '#FFFFFF' }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8EE',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'ChelseaMarket',
    fontSize: 21,
    color: '#222222',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'ChelseaMarket',
    fontSize: 13.5,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#E2852E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  retryBtnText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontFamily: 'ChelseaMarket',
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    marginBottom: 8,
  },
  riskBadge: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  riskBadgeText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  scoreLabel: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#555555',
  },
  scoreValue: {
    fontFamily: 'ChelseaMarket',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  summaryText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#333333',
    lineHeight: 21,
    textAlign: 'center',
  },
  sectionHeader: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#222222',
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 13.5,
    color: '#444444',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: '#E2852E',
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'ChelseaMarket',
    fontSize: 13.5,
    color: '#444444',
    lineHeight: 20,
  },
});
