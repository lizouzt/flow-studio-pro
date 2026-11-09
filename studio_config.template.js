/**
 * Flow Studio Pro - 全局核心配置文件模板 (studio_config.template.js)
 * 复制此文件为 studio_config.js 并填入你的实际 API 凭据即可开箱即用。
 */

module.exports = {
  dashscope: {
    // 阿里云百炼 API Key (https://bailian.console.aliyun.com/)
    api_key: process.env.DASHSCOPE_API_KEY || "",

    tts: {
      model: "cosyvoice-v3-flash",
      voice: "longanyang", // 龙安洋 (青年叙事) / 龙安欢 (元气女声)
      speech_rate: 1.05,
      pitch_rate: 1.0,
      format: "mp3",
    },

    image: {
      model: "wanx2.1-t2i-turbo",
      size: "720*1280", // 9:16 短视频竖屏画幅
      style: "<auto>",
    },

    video: {
      model: "wanx2.1-i2v-plus", // 旗舰版 "wanx2.1-i2v-plus" 或 极速版 "wanx2.1-i2v-turbo"
      resolution: "720p",        // "720p" 或 "1080p"
      prompt_extend: false,      // 关闭自动扩展，保证运镜精准
    },
  },

  asr: {
    // 语音识别驱动模式："dashscope_asr" (百炼原生免显卡) 或 "faster_whisper" (本地 faster-whisper-server)
    provider: process.env.ASR_PROVIDER || "dashscope_asr",

    // [模式 1] 阿里云百炼 ASR 模型，默认复用 dashscope.api_key
    dashscope_model: process.env.DASHSCOPE_ASR_MODEL || "qwen-audio-3.1-asr-flash-filetrans",

    // [模式 2] faster-whisper-server / OpenAI Whisper 兼容端点
    endpoint_url: process.env.WHISPER_ENDPOINT_URL || "http://127.0.0.1:8000/v1/audio/transcriptions",
    api_key: process.env.WHISPER_API_KEY || "",
    model: "whisper-1",
  },

  pacing: {
    target_shot_duration_sec: 5.5, // 单镜头基准时长 (秒)
    fallback_mode: "hybrid_image", // 缺视频时由首帧图片推拉垫底
  },

  plugins: {
    jianying_draft: {
      enabled: true,
      python_path: "python", // Python 执行路径
    },
  },
};
