export type SourceType = 'creator_reference' | 'keyword_search' | 'user_audio';
export type ContentStatus = 'idea' | 'drafted' | 'approved' | 'posted';
export type ClientPersona = 'psychologist' | 'financial_advisor';

export interface ViralMetrics {
  likes: number;
  comments: number;
  shares?: number;
}

export interface ViralityAnalysis {
  viralityReason: string; // Por qué podría volverse viral
  bottleneck: string; // El cuello de botella del post - qué lo limita
  engagement_trigger: string; // Qué genera engagement
  audience_relevance: string; // Relevancia para la audiencia
}

export interface GeneratedDraft {
  hook: string;
  body: string;
  cta: string;
  researchNotes: string[];
  viralityAnalysis?: ViralityAnalysis; // Nuevo: análisis profesional de viralidad
}

export interface ContentPiece {
  id: string;
  sourceType: SourceType;
  originalUrl?: string;
  originalText?: string; // The "Source Material"
  originalAuthor?: string;
  viralMetrics?: ViralMetrics;
  
  generatedDraft: GeneratedDraft;
  
  status: ContentStatus;
  targetDate?: string; // ISO string
  tags: string[]; // e.g., "Viral Reference", "News Based"
}

export interface ClientProfile {
  id: ClientPersona;
  name: string;
  role: string;
  avatar: string;
  tone: string; // e.g., "Empathetic", "Authoritative"
  nicheKeywords: string[];
  targetCreators: string[];
  customInstructions: string;
}

export interface Stats {
  impressions: number;
  postsReady: number;
  ideasGenerated: number;
  engagementRate: number;
}