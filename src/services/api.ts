import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { storageService, StoredUser, StoredSession } from './storage';

export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://denisabackend.vercel.app',
};

export function setApiBaseUrl(url: string) {
  API_CONFIG.baseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return API_CONFIG.baseUrl;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface AuthResponseData {
  token: string;
  user: StoredUser;
}

export interface CompleteRegistrationPayload {
  child_name: string;
  date_of_birth: string; // ISO 8601
  gender: 'laki-laki' | 'perempuan' | 'male' | 'female';
  gestational_weeks?: number;
  notes?: string;
  instrument_type?: 'mchat_rf' | 'csbs_dp';
}

export interface CompleteRegistrationResponseData {
  child: {
    id: string;
    name: string;
    date_of_birth: string;
    gender: string;
  };
  session: StoredSession;
  first_question: string;
  audio_base64?: string;
}

export interface ChatReplyData {
  reply_text: string;
  audio_base64?: string;
  is_complete: boolean;
  progress_percent: number;
  answered_count: number;
  total_questions: number;
  extracted_answer?: {
    question_id: number;
    value: number;
    label: string;
    confidence: number;
    rationale: string;
  };
}

export interface FinalizeResultData {
  session_id: string;
  instrument_type: string;
  summary: string;
  mchat_result?: {
    total_score: number;
    risk_level: string;
    action_required: string;
    summary: string;
    recommendations: string[];
  };
  csbs_result?: {
    total_score: number;
    risk_level: string;
    action_required: string;
    summary: string;
    recommendations: string[];
  };
}

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isMultipart = false
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const token = await storageService.getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!isMultipart && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { message: text };
    }

    if (!response.ok) {
      const errorMsg = json.message || json.error || `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, json);
    }

    return json as ApiResponse<T>;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or offline error
    const friendlyMsg =
      error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')
        ? `Gagal terhubung ke backend (${API_CONFIG.baseUrl}). Pastikan server backend Denisa sedang berjalan.`
        : error.message || 'Terjadi kesalahan jaringan.';
    throw new ApiError(friendlyMsg, 0);
  }
}

export const apiService = {
  // Auth
  async register(email: string, password: string, displayName: string): Promise<ApiResponse<AuthResponseData>> {
    const res = await request<AuthResponseData>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        display_name: displayName,
      }),
    });

    if (res.data?.token) {
      await storageService.setToken(res.data.token);
      if (res.data.user) {
        await storageService.setUser(res.data.user);
      }
    }

    return res;
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthResponseData>> {
    const res = await request<AuthResponseData>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (res.data?.token) {
      await storageService.setToken(res.data.token);
      if (res.data.user) {
        await storageService.setUser(res.data.user);
      }
    }

    return res;
  },

  async getMe(): Promise<ApiResponse<StoredUser>> {
    const res = await request<any>('/api/v1/auth/me', {
      method: 'GET',
    });
    const user = res.data?.user || res.data;
    if (user) {
      await storageService.setUser(user);
    }
    return { ...res, data: user };
  },

  // Complete Registration
  async completeRegistration(
    payload: CompleteRegistrationPayload
  ): Promise<ApiResponse<CompleteRegistrationResponseData>> {
    const res = await request<CompleteRegistrationResponseData>('/api/v1/auth/complete-registration', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.session) {
      const sessionWithQuestion = {
        ...res.data.session,
        first_question: res.data.first_question || res.data.session.first_question,
      };
      await storageService.setActiveSession(sessionWithQuestion);
    }
    if (res.data?.child) {
      await storageService.setActiveChild(res.data.child);
    }
    // Update local user is_profile_completed status
    const currentUser = await storageService.getUser();
    if (currentUser) {
      currentUser.is_profile_completed = true;
      await storageService.setUser(currentUser);
    }

    return res;
  },

  // Assessments
  async sendChatMessage(
    sessionId: string,
    message: string,
    generateTts = true
  ): Promise<ApiResponse<ChatReplyData>> {
    return await request<ChatReplyData>(`/api/v1/assessments/${sessionId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        generate_tts: generateTts,
      }),
    });
  },

  async sendVoiceMessage(
    sessionId: string,
    audioFile: {
      uri: string;
      name?: string;
      type?: string;
    }
  ): Promise<ApiResponse<ChatReplyData>> {
    const filename = audioFile.name || 'voice_input.m4a';
    const mimeType = audioFile.type || 'audio/m4a';
    const token = await storageService.getToken();
    const url = `${API_CONFIG.baseUrl}/api/v1/assessments/${sessionId}/voice`;

    if (Platform.OS !== 'web') {
      try {
        const uploadRes = await FileSystem.uploadAsync(url, audioFile.uri, {
          fieldName: 'audio',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        let json: any = {};
        try {
          json = uploadRes.body ? JSON.parse(uploadRes.body) : {};
        } catch {
          json = { message: uploadRes.body };
        }

        if (uploadRes.status < 200 || uploadRes.status >= 300) {
          const errorMsg = json.message || json.error || `Voice upload failed with status ${uploadRes.status}`;
          throw new ApiError(errorMsg, uploadRes.status, json);
        }

        return json as ApiResponse<ChatReplyData>;
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(err.message || 'Gagal mengunggah file suara ke server.', 0);
      }
    } else {
      // Web fallback using Blob
      try {
        const blobRes = await fetch(audioFile.uri);
        const blob = await blobRes.blob();
        const file = new File([blob], filename, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', file);

        return await request<ChatReplyData>(
          `/api/v1/assessments/${sessionId}/voice`,
          {
            method: 'POST',
            body: formData,
          },
          true
        );
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(err.message || 'Gagal mengirim suara dari browser.', 0);
      }
    }
  },

  async submitQuickAnswers(
    sessionId: string,
    answers: Record<string, number>
  ): Promise<ApiResponse<FinalizeResultData>> {
    return await request<FinalizeResultData>(
      `/api/v1/assessments/${sessionId}/quick-answers`,
      {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }
    );
  },

  async finalizeAssessment(sessionId: string): Promise<ApiResponse<FinalizeResultData>> {
    return await request<FinalizeResultData>(`/api/v1/assessments/${sessionId}/finalize`, {
      method: 'POST',
    });
  },

  async getAssessments(): Promise<ApiResponse<any[]>> {
    return await request<any[]>('/api/v1/assessments', {
      method: 'GET',
    });
  },

  async getAssessmentDetail(sessionId: string): Promise<ApiResponse<any>> {
    return await request<any>(`/api/v1/assessments/${sessionId}`, {
      method: 'GET',
    });
  },

  // Children
  async getChildren(): Promise<ApiResponse<any[]>> {
    return await request<any[]>('/api/v1/children', {
      method: 'GET',
    });
  },

  async getChildDetail(childId: string): Promise<ApiResponse<any>> {
    return await request<any>(`/api/v1/children/${childId}`, {
      method: 'GET',
    });
  },

  // Instruments
  async getInstruments(): Promise<ApiResponse<any[]>> {
    return await request<any[]>('/api/v1/instruments', {
      method: 'GET',
    });
  },
};
