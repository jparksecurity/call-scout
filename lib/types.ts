// Shared types for CallScout application

export interface Insight {
  id: string;
  text: string;
  segmentId: string;
  createdAt: string;
}

export interface TranscriptWord {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  paragraphId: string;
  speakerId: string;
}

export interface TranscriptSegment {
  id: string;
  timestamp: string;
  words: TranscriptWord[];
  insight?: Insight; // Single insight per segment
}

export interface HlsErrorData {
  fatal?: boolean;
  type?: string;
}

// API Types
export interface InsightRequest {
  conversationHistory: string;
  currentSentence: string;
  timestamp: string;
  segmentId: string;
}

export interface APIResponse {
  success: boolean;
  insight?: Insight;
  meta: {
    processingTimeMs: number;
    timestamp: string;
  };
}

export interface OpenAIResponse {
  insight?: string;
  hasInsight: boolean;
} 