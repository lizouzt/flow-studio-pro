/**
 * Flow Studio Pro - 全局核心配置文件 (studio_config.js)
 * 
 * 本文件支持直接使用 JavaScript 语法与丰富注释。
 * 优先级说明：系统环境变量 (如 process.env.DASHSCOPE_API_KEY) > 本文件配置。
 */

module.exports = {
  // =========================================================================
  // 1. 阿里云百炼 (DashScope) 统一生态服务配置
  //    用于：通义千问AI写稿、黄金钩子润色、CosyVoice配音合成、通义万相首帧生图及I2V闭环视频
  // =========================================================================
  dashscope: {
    /**
     * [必填] 阿里云百炼 API Key
     * 获取地址：https://bailian.console.aliyun.com/
     * 格式示例："sk-xxxxxxxxxxxxxxxxxxxxxxxx"
     * 也可以通过系统环境变量 DASHSCOPE_API_KEY 注入
     */
    api_key: process.env.DASHSCOPE_API_KEY || "",

    /**
     * 语音合成大模型 (TTS) 参数配置
     */
    tts: {
      /**
       * 使用的语音大模型版本
       * 推荐："cosyvoice-v3-flash" (官方推荐主力模型，极速流式高音质), "cosyvoice-v3-plus"
       */
      model: "cosyvoice-v3-flash",

      /**
       * 默认朗读主播音色 ID (CosyVoice v3 系列官方音色)
       * 推荐选项：
       *  - "longanyang"    : 龙安洋 (阳光青年男声，沉稳叙事，极适合纪录片、历史短剧)
       *  - "longanhuan"    : 龙安欢 (欢脱元气女声，感染力强，适合爆款口播)
       *  - "longanhuan_v3" : 龙安欢 V3 (支持多方言与情感控制)
       *  - "longhuhu_v3"   : 龙呼呼 (天真烂漫童声)
       */
      voice: "longanyang",

      /**
       * 语速调节倍率
       * 范围：0.5 ~ 2.0，推荐值：1.0 ~ 1.1 (短视频口播微加速更具吸引力)
       */
      speech_rate: 1.05,

      /**
       * 语调微调倍率
       * 范围：0.5 ~ 2.0，默认：1.0
       */
      pitch_rate: 1.0,

      /**
       * 音频输出编码格式
       * 可选："mp3", "wav", "pcm"
       */
      format: "mp3",
    },

    /**
     * 图像生成大模型 (通义万相 Text-to-Image) 参数配置
     * 用于生成每个镜头用于 I2V 的高清首帧关键图
     */
    image: {
      /**
       * 万相生图模型型号
       * 推荐："wanx-2.1-t2i-turbo" (极速高画质), "wanx-v1" (经典写实)
       */
      model: "wanx-2.1-t2i-turbo",

      /**
       * 画面生成分辨率与比例
       * 短视频竖屏强制推荐："720*1280" 或 "1080*1920" (9:16)
       */
      size: "720*1280",

      /**
       * 画面艺术风格基准
       * 默认 "<auto>" 自动根据 Writing-DNA 提示词匹配厚涂/黑白/写实
       */
      style: "<auto>",
    },

    /**
     * 视频生成大模型 (通义万相 Image-to-Video) 参数配置
     * 用于直接将首帧图 + 运镜提示词生成 3~10 秒动感视频切片
     */
    video: {
      /**
       * 万相视频生成模型型号
       * 推荐：
       *  - "wanx2.1-i2v-plus"  : 旗舰版，运镜稳定性与物理动力学表现最佳 (推荐)
       *  - "wanx2.1-i2v-turbo" : 极速版，生成更快、成本更低
       */
      model: "wanx2.1-i2v-plus",

      /**
       * 视频生成分辨率
       * 可选："720p" (默认兼顾生成速度与画质), "1080p"
       */
      resolution: "720p",

      /**
       * 是否开启百炼模型的提示词自动扩展联想
       * 建议设置为 false，确保严格遵照七段式运镜指令，避免模型幻觉
       */
      prompt_extend: false,
    },
  },

  // =========================================================================
  // 2. 语音识别与时间戳对齐驱动 (ASR Alignment Drivers)
  //    支持双驱动模式：
  //    1) dashscope_asr : [强烈推荐] 阿里云百炼原生 ASR (qwen-audio-3.0-asr-flash)
  //       - 零本地显卡门槛，免部署；
  //       - 自动通过百炼临时存储上传音频，异步识别返回毫秒级时间戳；
  //       - 直接复用上方 dashscope.api_key，统一结算。
  //    2) faster_whisper / custom_whisper : 本地或远程 OpenAI Whisper 兼容服务
  //       - 支持自建 faster-whisper-server (如 http://127.0.0.1:8000/v1/audio/transcriptions)；
  //       - 支持纯离线私有化部署。
  // =========================================================================
  asr: {
    /**
     * 服务提供商驱动模式
     * 可选：
     *  - "dashscope_asr"  : [推荐] 阿里云百炼原生云端 ASR (模型：qwen-audio-3.0-asr-flash / sensevoice-v1)
     *  - "faster_whisper" : 本地 faster-whisper-server (OpenAI 协议)
     *  - "custom_whisper" : 自定义/第三方兼容 OpenAI Whisper 端点
     */
    provider: process.env.ASR_PROVIDER || "dashscope_asr",

    /**
     * [模式 1：阿里云百炼 ASR 专有配置]
     * 官方推荐模型：
     *  - "qwen-audio-3.0-asr-flash" : 旗舰推荐，中文识别准确率极高，自带毫秒级时间戳
     *  - "qwen-audio-3.1-asr-flash-filetrans" : 录音文件转写增强版
     *  - "sensevoice-v1" : 极速短语音识别
     * 若未单独设置 api_key，将自动继承上方 dashscope.api_key
     */
    dashscope_model: process.env.DASHSCOPE_ASR_MODEL || "qwen-audio-3.0-asr-flash",

    /**
     * [模式 2：faster-whisper-server / OpenAI Whisper 兼容端点配置]
     * 常见方案：
     *  - 本地 faster-whisper-server : "http://127.0.0.1:8000/v1/audio/transcriptions"
     *  - OpenAI 官方端点 : "https://api.openai.com/v1/audio/transcriptions"
     */
    endpoint_url: process.env.WHISPER_ENDPOINT_URL || "http://127.0.0.1:8000/v1/audio/transcriptions",

    /**
     * faster-whisper / OpenAI 端点访问鉴权 Token (若本地自建服务无鉴权可留空)
     */
    api_key: process.env.WHISPER_API_KEY || "",

    /**
     * faster-whisper 模型名称，默认 "whisper-1"
     */
    model: "whisper-1",
  },

  // =========================================================================
  // 3. 视觉分镜与时长节奏编排配置 (Visual Pacing Engine)
  //    用于将 ASR 提取的连贯台词时间戳，按电影视听语言切分为 4~7 秒动感镜头
  // =========================================================================
  pacing: {
    /**
     * 单个镜头推荐的目标基准时长 (单位：秒)
     * 推荐值：4.5 ~ 6.0。通常 5.5 秒最符合现代短剧/短视频受众的心理注意周期
     */
    target_shot_duration_sec: 5.5,

    /**
     * 画面降级回退策略
     * 可选：
     *  - "hybrid_image" : [推荐] 当视频生成失败或显存不足时，自动采用首帧图片配合 2.5D 镜头推拉兜底
     *  - "error"        : 严格报错终止流程
     */
    fallback_mode: "hybrid_image",
  },

  // =========================================================================
  // 4. 扩展插件与剪映生态集成配置 (Ecosystem Plugins)
  // =========================================================================
  plugins: {
    /**
     * 剪映专业版草稿自动导出插件 (基于 pyJianYingDraft)
     * 开启后，点击导出可直接在剪映草稿目录生成包含多轨道、画中画、字幕与音效的完整草稿
     */
    jianying_draft: {
      /**
       * 是否启用剪映导出功能
       */
      enabled: true,

      /**
       * 本地 Python 可执行文件路径
       * 若系统 PATH 中已包含 python，默认填 "python" 即可；
       * 若使用特定虚拟环境，可指定绝对路径，如 "C:/Users/.../venv/Scripts/python.exe"
       */
      python_path: "python",
    },
  },
};
