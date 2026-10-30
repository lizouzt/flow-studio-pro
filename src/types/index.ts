export interface Shot {
  shot_id: string;
  target_start_sec: number;
  target_end_sec: number;
  target_duration_sec: number;
  srt_cues: number[];
  voiceover: string;
  keyframe_image: string;
  camera_motion: string;
  subject_action: string;
  i2v_prompt: string;
  rendered_video_path?: string;
  status: 'pending' | 'generating' | 'ready' | 'fallback_image';
}

export interface StoryboardProject {
  project_id: string;
  project_name: string;
  script: string;
  audio_path?: string;
  srt_path?: string;
  audio_duration_sec?: number;
  style_id: string;
  shots: Shot[];
  created_at: string;
  updated_at: string;
}

export interface StudioConfig {
  dashscope: {
    api_key: string;
    tts: {
      model: string;
      voice: string;
      speech_rate: number;
      pitch_rate: number;
      format: string;
    };
    image: {
      model: string;
      size: string;
      style?: string;
    };
  };
  asr: {
    provider: 'cloud_whisper' | 'dashscope_asr' | 'custom_endpoint';
    endpoint_url: string;
    api_key: string;
    model: string;
  };
  pacing: {
    target_shot_duration_sec: number;
    fallback_mode: 'hybrid_image' | 'error';
  };
  plugins: {
    jianying_draft: {
      enabled: boolean;
      python_path: string;
    };
  };
}
