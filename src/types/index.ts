export interface CharacterBenchmark {
  character_name: string;        // 主角姓名或称谓（如“唐纳德·特朗普”、“辛弃疾”或自拟角色）
  description: string;           // 标志性面容轮廓、发型与体态特征
  attire: string;                // 标志性定妆服装与随身配饰
  portrait_image: string;        // 定妆肖像参考图 URL（如 /output/character/protagonist_benchmark.png）
  portrait_remote_url?: string;  // 远程备份 URL
  status: 'idle' | 'generating' | 'ready';
  confirmed: boolean;            // 用户是否已确认定妆
}

export interface VisualContextProfile {
  era_setting: string;           // 时代环境定位 (例如："中国南宋绍兴年间，古代战场与军营" 或 "1980年代美国加州，现代科技创业")
  character_anchor: string;      // 主角人设特征 (例如："22岁东亚英武青年将领，刚毅果敢面容" 或 "40岁现代精英，短发成熟神态")
  attire_props: string;          // 时代服饰与核心道具 (例如："宋代铁制山文铠甲、朱红战袍、中国汉剑、战马" 或 "复古西装、早期微机原型")
  art_style: string;             // 统一艺术风格 (例如："写实厚涂历史漫画风格，电影级高对比戏剧光影，9:16竖屏")
  positive_anchors: string[];    // 动态提取的正向文化与时代视觉关键词
  negative_guardrails: string[]; // 动态推导的反向排除词 (自动识别时代与文化冲突元素，如古代排斥中世纪/现代电器)
  character_benchmark?: CharacterBenchmark; // 主角定妆基准档案 (锁脸核心参考)
}

export interface Shot {
  shot_id: string;
  target_start_sec: number;
  target_end_sec: number;
  target_duration_sec: number;
  srt_cues: number[];
  voiceover: string;
  keyframe_image: string;
  remote_image_url?: string;    // 百炼公网/OSS 首帧图片链接 (专用于 I2V 图生视频直接提交)
  camera_motion: string;
  subject_action: string;
  t2i_prompt?: string;          // 专用于通义万相首帧文生图 (基于自适应视觉档案合成)
  i2v_prompt: string;           // 专用于通义万相视频动画 (镜头机位/人物动力学微动)
  shot_focus?: 'character' | 'environment' | 'prop' | 'pov_antagonist'; // 镜头焦点分类：主角动作 / 宏观环境空镜 / 器物微距 / 主观视点
  character_anchor?: string;    // 全局角色特征锚点 (确保多镜头人设一致性)
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
  visual_profile?: VisualContextProfile;
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
    video?: {
      model: string;
      resolution: string;
      prompt_extend: boolean;
    };
  };
  asr: {
    provider: 'dashscope_asr' | 'dashscope' | 'faster_whisper' | 'custom_whisper' | 'openai' | 'cloud_whisper' | 'custom_endpoint';
    endpoint_url?: string;
    api_key?: string;
    model?: string;
    dashscope_model?: string;
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
