import AnimatedMascot from '@/components/AnimatedMascot';
import BackgroundTopSvg from '@/components/BackgroundTopSvg';
import VoiceCard from '@/components/VoiceCard';
import { MCHAT_RF_QUESTIONS } from '@/data/mchatQuestions';
import { apiService } from '@/services/api';
import { storageService, StoredSession } from '@/services/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function QuickAnswersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ sessionId?: string }>();

  const [activeSession, setActiveSession] = useState<StoredSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [answeredByDenis, setAnsweredByDenis] = useState<number[]>([1, 2, 3, 4, 5]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Responsive dimensions matching mchat.tsx
  const bgTopWidth = width;
  const bgTopHeight = bgTopWidth * (382 / 402);
  const mascotWidth = Math.min(Math.max(width * 0.82, 270), 330);
  const mascotHeight = mascotWidth / (384 / 308);
  const cardWidth = Math.min(Math.max(width - 44, 290), 356);
  const cardMinHeight = Math.min(Math.max(cardWidth * 0.48, 160), 180);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        let session = await storageService.getActiveSession();
        const sessionId = params.sessionId || session?.id;

        if (sessionId) {
          try {
            const detail = await apiService.getAssessmentDetail(sessionId);
            if (detail.data?.answers) {
              const answeredIds = Object.keys(detail.data.answers).map(Number);
              if (answeredIds.length > 0) {
                setAnsweredByDenis(answeredIds);
              }
            }
            if (detail.data) {
              session = {
                id: sessionId,
                child_id: detail.data.child_id || '',
                instrument_type: detail.data.instrument_type || 'mchat_rf',
                status: detail.data.status || 'in_progress',
              };
              await storageService.setActiveSession(session);
            }
          } catch (e) {
            console.warn('Failed to fetch detail for quick answers:', e);
          }
        }

        if (isMounted && session) {
          setActiveSession(session);
        }
      } catch (err) {
        console.warn('QuickAnswers init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      Speech.stop();
    };
  }, [params.sessionId]);

  // Questions not yet answered in Denis interactive phase (items 6 to 20)
  const remainingQuestions = MCHAT_RF_QUESTIONS.filter(
    (q) => !answeredByDenis.includes(q.id)
  );

  const totalRemaining = remainingQuestions.length;
  const currentQuestion = remainingQuestions[currentIndex] || remainingQuestions[0];
  const currentAnswer = currentQuestion ? answers[String(currentQuestion.id)] : undefined;

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = totalRemaining > 0 && answeredCount >= totalRemaining;

  // Overall screening progress out of 20 total questions
  const totalScreeningQuestions = 20;
  const overallAnswered = answeredByDenis.length + answeredCount;
  const progressPercentage = Math.min(
    Math.round((overallAnswered / totalScreeningQuestions) * 100),
    100
  );

  // Toggle voice reading for current question
  const handleToggleVoice = useCallback(() => {
    if (!currentQuestion) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      Speech.stop();
      setIsSpeaking(true);
      const speechText = `${currentQuestion.text}. ${currentQuestion.example || ''}`;
      Speech.speak(speechText, {
        language: 'id-ID',
        rate: 0.95,
        pitch: 1.1,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }, [currentQuestion, isSpeaking]);

  // Handle select Ya (1) or Tidak (0)
  const handleSelectAnswer = (val: number) => {
    if (!currentQuestion) return;

    const qId = String(currentQuestion.id);
    setAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));

    // Auto advance to next question smoothly if not last
    if (currentIndex < totalRemaining - 1) {
      setTimeout(() => {
        Speech.stop();
        setIsSpeaking(false);
        setCurrentIndex((i) => Math.min(i + 1, totalRemaining - 1));
      }, 220);
    }
  };

  const handlePrev = () => {
    Speech.stop();
    setIsSpeaking(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    Speech.stop();
    setIsSpeaking(false);
    if (currentIndex < totalRemaining - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleSubmitAll = async () => {
    if (!activeSession?.id) {
      Alert.alert('Sesi Tidak Ditemukan', 'Kembali ke halaman utama.');
      router.replace('/(main)/homepage');
      return;
    }

    if (!isAllAnswered) {
      const unanswered = remainingQuestions.find((q) => answers[String(q.id)] === undefined);
      Alert.alert(
        'Kuesioner Belum Lengkap',
        `Masih ada ${totalRemaining - answeredCount} butir yang belum dijawab (misal: Pertanyaan #${unanswered?.id}). Mohon lengkapi seluruh pertanyaan ya Ayah/Bunda.`
      );
      return;
    }

    Speech.stop();
    setIsSubmitting(true);
    try {
      await apiService.submitQuickAnswers(activeSession.id, answers);

      router.replace({
        pathname: '/(main)/assessment-result',
        params: { sessionId: activeSession.id },
      });
    } catch (err: any) {
      Alert.alert('Gagal Mengirim Jawaban', err.message || 'Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#E2852E" />
        <Text style={styles.loadingText}>Menyiapkan kuesioner Denis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Sky Extension */}
      <View
        pointerEvents="none"
        style={[styles.skyExtension, { height: insets.top + 30 }]}
      />

      {/* Top Scenery Background */}
      <View pointerEvents="none" style={styles.bgTopContainer}>
        <BackgroundTopSvg width={bgTopWidth} height={bgTopHeight} />
      </View>

      {/* Top Navigation Bar with Back Button & Progress Bar */}
      <View style={[styles.topNavBar, { top: Math.max(insets.top + 6, 14) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Speech.stop();
            if (currentIndex > 0) {
              handlePrev();
            } else {
              router.back();
            }
          }}
          style={styles.backButton}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#E2852E"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Progress Tracker Pill - Visually Identical to MChat */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>
              {isAllAnswered
                ? 'Semua Terjawab'
                : `Pertanyaan ${currentQuestion.id} / ${totalScreeningQuestions}`}
            </Text>
            <Text style={styles.progressPercent}>{progressPercentage}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Main Content Layout - Scrollable to prevent overflow */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + Math.max((height - insets.top - insets.bottom - 520) * 0.16, 50),
            paddingBottom: Math.max(insets.bottom + 20, 30),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.topSpacer} />

        {/* Mascot Denis in Center Stage */}
        <View style={styles.mascotWrapper}>
          <AnimatedMascot
            width={mascotWidth}
            height={mascotHeight}
            isTalking={isSpeaking}
            autoCycle={true}
            cycleInterval={3000}
            enableTapToCycle={true}
            enableFloating={true}
            enableBlink={true}
            onPress={handleToggleVoice}
          />
        </View>

        {/* Voice Card / Speech Bubble - Pure choice card without mic or pause button */}
        <View style={styles.bottomSection}>
          <VoiceCard
            width={cardWidth}
            minHeight={cardMinHeight}
            cardColor="#E2852E"
            showMic={false}
          >
            {/* Header Badge */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>
                  Butir {currentIndex + 1} dari {totalRemaining}
                </Text>
              </View>
            </View>

            {/* Scrollable Question Text Container */}
            <ScrollView
              style={styles.cardTextScroll}
              contentContainerStyle={styles.cardTextScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <Text style={styles.cardQuestionTitle}>
                {currentQuestion.text}
              </Text>

              {Boolean(currentQuestion.example) && (
                <View style={styles.exampleBox}>
                  <View style={styles.exampleHeaderRow}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 18h6M10 22h4M12 2a7 7 0 00-7 7c0 2.6 1.4 4.8 3.5 6h7c2.1-1.2 3.5-3.4 3.5-6a7 7 0 00-7-7z"
                        stroke="#7B341E"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.examplePrefix}>Contoh:</Text>
                  </View>
                  <Text style={styles.exampleText}>
                    {currentQuestion.example}
                  </Text>
                </View>
              )}
            </ScrollView>
          </VoiceCard>

          {/* Large Tactile "Ya" and "Tidak" Buttons with SVG Icons */}
          <View style={styles.quickActionBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectAnswer(1)}
              style={[
                styles.quickBtn,
                styles.btnYes,
                currentAnswer === 1 && styles.btnYesSelected,
              ]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.quickBtnText}>
                {currentAnswer === 1 ? 'Terpilih: Ya' : 'Ya'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectAnswer(0)}
              style={[
                styles.quickBtn,
                styles.btnNo,
                currentAnswer === 0 && styles.btnNoSelected,
              ]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.quickBtnText}>
                {currentAnswer === 0 ? 'Terpilih: Tidak' : 'Tidak'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Navigation Row with SVG Icons */}
          <View style={styles.stepperNavRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePrev}
              disabled={currentIndex === 0}
              style={[
                styles.stepBtn,
                currentIndex === 0 && styles.stepBtnDisabled,
              ]}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18L9 12L15 6"
                  stroke={currentIndex === 0 ? '#A0A0A0' : '#4A5568'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                style={[
                  styles.stepBtnText,
                  currentIndex === 0 && styles.stepBtnTextDisabled,
                ]}
              >
                Sebelumnya
              </Text>
            </TouchableOpacity>

            <Text style={styles.stepperIndicator}>
              {answeredCount} / {totalRemaining} Terisi
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={currentIndex === totalRemaining - 1}
              style={[
                styles.stepBtn,
                currentIndex === totalRemaining - 1 && styles.stepBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.stepBtnText,
                  currentIndex === totalRemaining - 1 && styles.stepBtnTextDisabled,
                ]}
              >
                Selanjutnya
              </Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18L15 12L9 6"
                  stroke={currentIndex === totalRemaining - 1 ? '#A0A0A0' : '#4A5568'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Submit Batch Button when all remaining questions are answered */}
          {isAllAnswered && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmitAll}
              disabled={isSubmitting}
              style={styles.finalizeBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      stroke="#FFFFFF"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.finalizeBtnText}>
                    Kirim & Lihat Hasil Laporan
                  </Text>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="#FFFFFF"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE474',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFE474',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#333333',
    marginTop: 12,
  },
  skyExtension: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ABE0F0',
    zIndex: 0,
    elevation: 0,
  },
  bgTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    elevation: 0,
  },
  topNavBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
    elevation: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12,
    color: '#333333',
  },
  progressPercent: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12,
    color: '#E2852E',
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAEAEA',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#E2852E',
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSpacer: {
    flex: 0.04,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    zIndex: 25,
    elevation: 25,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  questionBadgeText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 11,
    color: '#FFFFFF',
  },
  cardTextScroll: {
    maxHeight: 145,
  },
  cardTextScrollContent: {
    flexGrow: 1,
    paddingBottom: 6,
  },
  cardQuestionTitle: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  exampleBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    padding: 8,
    borderRadius: 10,
  },
  exampleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  examplePrefix: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12,
    color: '#FFF8D6',
    fontWeight: 'bold',
  },
  exampleText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12.5,
    color: '#FFF8D6',
    lineHeight: 17,
  },
  quickActionBar: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
  },
  quickBtn: {
    flex: 1,
    maxWidth: 160,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  btnYes: {
    backgroundColor: '#48BB78',
  },
  btnYesSelected: {
    backgroundColor: '#276749',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  btnNo: {
    backgroundColor: '#F56565',
  },
  btnNoSelected: {
    backgroundColor: '#9B2C2C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  quickBtnText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#FFFFFF',
  },
  stepperNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 14,
  },
  stepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepBtnText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12,
    color: '#444444',
  },
  stepBtnTextDisabled: {
    color: '#999999',
  },
  stepperIndicator: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12,
    color: '#555555',
  },
  finalizeBtn: {
    marginTop: 16,
    backgroundColor: '#319795',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  finalizeBtnText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
