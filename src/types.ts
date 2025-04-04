export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
  track: number;
  language?: string;
}

export interface Track {
  id: number;
  name: string;
  language: string;
  captions: Caption[];
  visible: boolean;
  fontStyle?: {
    fontFamily: string;
    fontSize: number;
  };
}

export interface Settings {
  assemblyAiKey?: string;
  deeplKey?: string;
  deeplPlan?: 'pro' | 'free';
  showCaptionsInFullscreen?: boolean;
  autosaveInterval?: number;
}

export type ExportFormat = 'srt' | 'vtt' | 'csv' | 'txt';

export interface DeeplLanguage {
  language: string;
  name: string;
  supports_formality?: boolean;
}