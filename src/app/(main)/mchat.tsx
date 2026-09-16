import AnimatedMascot from '@/components/AnimatedMascot';
import BackgroundTopSvg from '@/components/BackgroundTopSvg';
import TypewriterText from '@/components/TypewriterText';
import VoiceCard from '@/components/VoiceCard';
import { apiService, ChatReplyData } from '@/services/api';
import { storageService, StoredSession } from '@/services/storage';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

export default function MChatScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    sessionId?: string;
    firstQuestion?: string;
    firstQuestionAudio?: string;
  }>();

  const [activeSession, setActiveSession] = useState<StoredSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>(
    params.firstQuestion ||
      'Halo, Aku Denis! Senang sekali bisa mendampingi skrining tumbuh kembang ananda tercinta. Siap ya Ayah/Bunda?'
  );
  const [lastAudioBase64, setLastAudioBase64] = useState<string | undefined>(
    params.firstQuestionAudio
  );
  const [replayKey, setReplayKey] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isTtsTalking, setIsTtsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Progress tracking (Interactive Denis phase has 5 questions)
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const recordingStartTimeRef = useRef<number>(0);

  // Text input modal for custom typing option
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  // Audio recording & playback setup
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer(null);
  const audioPlayerStatus = useAudioPlayerStatus(audioPlayer);

  // Derive talking state reactively without setState inside an effect
  const isTalking = Boolean(audioPlayerStatus.playing || isTtsTalking || isTyping);

  // Background Top dimensions
  const bgTopWidth = width;
  const bgTopHeight = bgTopWidth * (382 / 402);

  // Mascot dimensions
  const mascotWidth = Math.min(Math.max(width * 0.82, 280), 340);
  const mascotHeight = mascotWidth / (384 / 308);

  // Card dimensions
  const cardWidth = Math.min(Math.max(width - 44, 290), 356);
  const cardMinHeight = Math.min(Math.max(cardWidth * 0.48, 160), 180);

  // TTS fallback using Expo Speech in Indonesian
  const speakWithTts = useCallback((text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'id-ID',
        rate: 0.95,
        pitch: 1.05,
        onStart: () => setIsTtsTalking(true),
        onDone: () => setIsTtsTalking(false),
        onStopped: () => setIsTtsTalking(false),
        onError: () => setIsTtsTalking(false),
      });
    } catch (err) {
      console.warn('[Speech] TTS playback error:', err);
    }
  }, []);

  // Play audio base64 from backend (Edge TTS MP3) or fallback to Speech TTS
  const playAudioReply = useCallback(
    async (base64Audio?: string, textFallback?: string) => {
      if (base64Audio) {
        try {
          Speech.stop();
          setLastAudioBase64(base64Audio);
          const cleanBase64 = base64Audio.replace(/^data:[^;]+;base64,/, '');
          const isMp3 =
            base64Audio.includes('audio/mp3') ||
            base64Audio.includes('audio/mpeg') ||
            !base64Audio.includes('audio/wav');
          const ext = isMp3 ? 'mp3' : 'wav';
          const localAudioPath = `${FileSystem.cacheDirectory}denis_reply_${Date.now()}.${ext}`;

          await FileSystem.writeAsStringAsync(localAudioPath, cleanBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (audioPlayer) {
            audioPlayer.replace({ uri: localAudioPath });
            audioPlayer.play();
            return;
          }
        } catch (err) {
          console.warn('[Audio] Failed to play backend audio file:', err);
        }
      }

      // Fallback to offline/native TTS ONLY if base64 audio is not provided
      if (textFallback && !base64Audio) {
        speakWithTts(textFallback);
      }
    },
    [audioPlayer, speakWithTts]
  );

  // Initialize or recover active session on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // Configure audio mode for clear speaker playback and silent-mode override
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        }).catch((err) => console.warn('setAudioModeAsync error:', err));

        let session = await storageService.getActiveSession();

        // If no active session in storage, recover from backend
        if (!session) {
          const childrenRes = await apiService.getChildren();
          if (childrenRes.data && childrenRes.data.length > 0) {
            const child = childrenRes.data[0];
            await storageService.setActiveChild(child);

            const assessRes = await apiService.getAssessments();
            const inProgress = assessRes.data?.find((a: any) => a.status === 'in_progress');
            if (inProgress) {
              const detail = await apiService.getAssessmentDetail(inProgress.id);
              const msgs = detail.data?.messages || [];
              const lastAssistantMsg = [...msgs].reverse().find((m: any) => m.role === 'assistant');

              session = {
                id: inProgress.id,
                child_id: inProgress.child_id || child.id,
                instrument_type: inProgress.instrument_type || 'mchat_rf',
                status: inProgress.status,
                total_questions: inProgress.total_questions || 20,
                current_question_id: inProgress.current_question_id || 1,
                first_question: lastAssistantMsg?.content,
              };
              await storageService.setActiveSession(session);
            }
          }
        }

        if (!isMounted) return;

        if (session) {
          setActiveSession(session);
          if (session.total_questions) {
            setTotalQuestions(session.total_questions);
          }
          if (session.current_question_id) {
            setAnsweredCount(session.current_question_id - 1);
          }

          const initialMsg =
            params.firstQuestion ||
            session.first_question ||
            'Halo, Aku Denis! Mari kita mulai skrining tumbuh kembang ananda tercinta. Siap ya Ayah/Bunda?';

          setCurrentMessage(initialMsg);
          setReplayKey((k) => k + 1);

          const initialAudio = params.firstQuestionAudio || session.audio_base64;
          if (initialAudio) {
            setLastAudioBase64(initialAudio);
          }

          // Voice greeting out loud with authentic Denis voice!
          setTimeout(() => {
            if (isMounted) {
              playAudioReply(initialAudio, initialMsg);
            }
          }, 350);
        } else {
          // If still no session, play fallback
          setTimeout(() => {
            if (isMounted) {
              playAudioReply(
                params.firstQuestionAudio,
                params.firstQuestion ||
                  'Halo, Aku Denis! Senang sekali bisa mendampingi skrining tumbuh kembang ananda tercinta. Siap ya Ayah/Bunda?'
              );
            }
          }, 350);
        }
      } catch (err) {
        console.warn('Session init error:', err);
      }
    })();

    return () => {
      isMounted = false;
      Speech.stop();
    };
  }, [params.firstQuestion, params.firstQuestionAudio, playAudioReply]);

  const handleServerReply = useCallback(
    async (reply: ChatReplyData) => {
      if (!reply) return;

      if (reply.reply_text) {
        setCurrentMessage(reply.reply_text);
        setReplayKey((k) => k + 1);
      }

      // Play AI voice answer (backend MP3 or Speech TTS fallback)
      await playAudioReply(reply.audio_base64, reply.reply_text);

      if (typeof reply.answered_count === 'number') {
        setAnsweredCount(reply.answered_count);
      }
      if (typeof reply.total_questions === 'number') {
        setTotalQuestions(reply.total_questions);
      }

      const complete =
        Boolean(reply.is_complete) ||
        (typeof reply.answered_count === 'number' &&
          reply.answered_count >= (reply.total_questions || totalQuestions || 5));

      if (complete) {
        setIsComplete(true);
        const sid = activeSession?.id;
        if (sid) {
          setTimeout(() => {
            Speech.stop();
            audioPlayer.pause();
            router.replace({
              pathname: '/(main)/quick-answers',
              params: { sessionId: sid },
            });
          }, 800);
        }
      }
    },
    [playAudioReply, totalQuestions, activeSession, router, audioPlayer]
  );

  // Handle Voice / Mic Press
  const handleMicPress = useCallback(async () => {
    if (isSending) return;

    if (!activeSession?.id) {
      setTextInputVisible(true);
      return;
    }

    if (isListening) {
      // Stop recording and validate before sending audio
      try {
        setIsListening(false);
        const durationMs = Date.now() - recordingStartTimeRef.current;
        await audioRecorder.stop();
        const uri = audioRecorder.uri;

        // Validation 1: Prevent empty / too short recordings (< 1 second)
        if (durationMs < 1000) {
          Alert.alert(
            'Rekaman Terlalu Singkat',
            'Tahan tombol mikrofon dan bicara minimal 1 detik agar Denis dapat mendengar dengan jelas ya Ayah/Bunda.'
          );
          return;
        }

        if (uri) {
          // Validation 2: Prevent empty file (< 500 bytes)
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (
            fileInfo.exists &&
            typeof (fileInfo as any).size === 'number' &&
            (fileInfo as any).size < 500
          ) {
            Alert.alert(
              'Suara Tidak Terdeteksi',
              'Rekaman suara terlalu kecil atau kosong. Silakan coba bicara lebih dekat ke mikrofon ya Ayah/Bunda.'
            );
            return;
          }

          setIsSending(true);
          const res = await apiService.sendVoiceMessage(activeSession.id, {
            uri,
            name: 'voice_input.m4a',
            type: 'audio/m4a',
          });
          await handleServerReply(res.data);
        } else {
          Alert.alert('Info', 'Rekaman suara tidak terdeteksi. Silakan coba lagi atau gunakan tombol Ya / Tidak.');
        }
      } catch (err: any) {
        console.warn('Voice send failed:', err);
        Alert.alert('Gagal Mengirim Suara', err.message || 'Gagal mengirim audio. Beralih ke teks?');
        setTextInputVisible(true);
      } finally {
        setIsSending(false);
      }
    } else {
      // Check microphone permission before recording
      try {
        Speech.stop();
        let permission = await getRecordingPermissionsAsync();
        if (!permission.granted) {
          permission = await requestRecordingPermissionsAsync();
        }

        if (!permission.granted) {
          Alert.alert(
            'Izin Mikrofon Diperlukan',
            'Izinkan Denisa mengakses mikrofon di pengaturan perangkat agar dapat mendengarkan jawaban Anda, atau gunakan input teks.',
            [
              { text: 'Ketik Jawaban', onPress: () => setTextInputVisible(true) },
              { text: 'Tutup', style: 'cancel' },
            ]
          );
          return;
        }

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        recordingStartTimeRef.current = Date.now();
        setIsListening(true);
      } catch (err: any) {
        console.warn('Mic start failed:', err);
        setIsListening(false);
        Alert.alert(
          'Mikrofon Belum Siap',
          'Izin mikrofon belum aktif atau perangkat sedang sibuk. Silakan ketik jawaban Anda.',
          [
            { text: 'Ketik Jawaban', onPress: () => setTextInputVisible(true) },
            { text: 'Tutup', style: 'cancel' },
          ]
        );
      }
    }
  }, [
    isSending,
    activeSession,
    isListening,
    audioRecorder,
    handleServerReply,
  ]);

  // Send Text Message
  const handleSendTextMessage = useCallback(
    async (msgToSend?: string) => {
      const text = (msgToSend || typedMessage).trim();
      if (!text || isSending) return;

      if (!activeSession?.id) {
        Alert.alert('Sesi Belum Siap', 'Data anak belum lengkap. Lengkapi data anak terlebih dahulu.');
        router.replace('/auth/complete-registration');
        return;
      }

      Speech.stop();
      setIsSending(true);
      setTextInputVisible(false);
      setTypedMessage('');

      try {
        const res = await apiService.sendChatMessage(activeSession.id, text, true);
        await handleServerReply(res.data);
      } catch (err: any) {
        Alert.alert('Gagal Mengirim Jawaban', err.message || 'Periksa koneksi backend.');
      } finally {
        setIsSending(false);
      }
    },
    [typedMessage, isSending, activeSession, router, handleServerReply]
  );

  // Toggle audio playback or replay if stopped
  const handleToggleAudio = useCallback(() => {
    if (audioPlayerStatus.playing) {
      audioPlayer.pause();
      setIsTtsTalking(false);
      Speech.stop();
    } else {
      setReplayKey((k) => k + 1);
      if (lastAudioBase64) {
        playAudioReply(lastAudioBase64, currentMessage);
      } else {
        speakWithTts(currentMessage);
      }
    }
  }, [audioPlayerStatus.playing, audioPlayer, lastAudioBase64, currentMessage, playAudioReply, speakWithTts]);

  const progressPercentage = Math.min(
    Math.round((answeredCount / (totalQuestions || 5)) * 100),
    100
  );

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
            router.back();
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

        {/* Progress Tracker Pill */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>
              {isComplete ? 'Skrining Selesai' : `Pertanyaan ${answeredCount} / ${totalQuestions}`}
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

      {/* Main Content Layout - Scrollable to prevent overflow on all devices */}
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

        {/* Mascot Denis */}
        <View style={styles.mascotWrapper}>
          <AnimatedMascot
            width={mascotWidth}
            height={mascotHeight}
            isTalking={isTalking}
            autoCycle={true}
            cycleInterval={3000}
            enableTapToCycle={true}
            enableFloating={true}
            enableBlink={true}
            onPress={handleToggleAudio}
          />
        </View>

        {/* Voice Card / AI Response Section */}
        <View style={styles.bottomSection}>
          <VoiceCard
            width={cardWidth}
            minHeight={cardMinHeight}
            cardColor="#E2852E"
            isListening={isListening}
            onPressMic={handleMicPress}
          >
            {isSending ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.cardText, { marginTop: 8, fontSize: 14 }]}>
                  Denis sedang mendengarkan dan memproses...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.cardTextScroll}
                contentContainerStyle={styles.cardTextScrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <TypewriterText
                  key={replayKey}
                  text={currentMessage}
                  speed={28}
                  delay={80}
                  onTypingStateChange={(typing) => setIsTyping(typing)}
                  style={styles.cardText}
                />
              </ScrollView>
            )}
          </VoiceCard>

          {/* Quick Action Bar (Quick Answers & Text Input Button) */}
          {!isComplete ? (
            <View style={styles.quickActionBar}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSendTextMessage('Ya')}
                disabled={isSending}
                style={[styles.quickBtn, { backgroundColor: '#48BB78' }]}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17L4 12"
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.quickBtnText}>Ya</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSendTextMessage('Tidak')}
                disabled={isSending}
                style={[styles.quickBtn, { backgroundColor: '#F56565' }]}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.quickBtnText}>Tidak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setTextInputVisible(true)}
                disabled={isSending}
                style={[
                  styles.quickBtn,
                  { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2852E' },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#E2852E" strokeWidth={2} />
                  <Path
                    d="M6 9H6.01M10 9H10.01M14 9H14.01M18 9H18.01M6 13H6.01M18 13H18.01M9 15H15"
                    stroke="#E2852E"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                  />
                </Svg>
                <Text style={[styles.quickBtnText, { color: '#E2852E' }]}>Ketik</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Automatically forwarding state */
            <View style={styles.autoForwardCard}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.autoForwardText}>
                Melanjutkan ke kuesioner berikutnya...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for Typing Text Answer */}
      <Modal
        visible={textInputVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTextInputVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Jawab Pertanyaan Denis</Text>
            <Text style={styles.modalSubtitle}>
              Ceritakan perilaku si kecil terkait pertanyaan di atas:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Iya Bunda, si kecil langsung menoleh dan menatap saat dipanggil namanya..."
              placeholderTextColor="#888888"
              multiline
              autoFocus
              value={typedMessage}
              onChangeText={setTypedMessage}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTextInputVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  !typedMessage.trim() && { opacity: 0.5 },
                ]}
                disabled={!typedMessage.trim() || isSending}
                onPress={() => handleSendTextMessage()}
              >
                <Text style={styles.modalSubmitText}>Kirim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE474',
    overflow: 'hidden',
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
  cardTextScroll: {
    maxHeight: 145,
  },
  cardTextScrollContent: {
    flexGrow: 1,
    paddingBottom: 6,
  },
  cardText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  quickActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
  },
  quickBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickBtnText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  autoForwardCard: {
    marginTop: 18,
    backgroundColor: '#319795',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  autoForwardText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: 'ChelseaMarket',
    fontSize: 18,
    color: '#222222',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: 'ChelseaMarket',
    fontSize: 12.5,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#FDEAA1',
    borderRadius: 14,
    minHeight: 90,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#222222',
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
  },
  modalCancelText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#555555',
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#E2852E',
  },
  modalSubmitText: {
    fontFamily: 'ChelseaMarket',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
