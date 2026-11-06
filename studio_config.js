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
       * 推荐："cosyvoice-v1" (经典高表现力), "cosyvoice-latest" (最新特性)
       */
      model: "cosyvoice-v1",

      /**
       * 默认朗读主播音色 ID
       * 推荐选项：
       *  - "longxiaochun" : 龙小淳 (青年温和叙事，极适合纪录片、历史故事)
       *  - "longhua"      : 龙华 (沉稳浑厚史诗，适合严肃历史、战争风)
       *  - "longwan"      : 龙婉 (女性深情叙述)
       */
      voice: "longxiaochun",

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
  },

  // =========================================================================
  // 2. 语音识别与时间戳对齐端点 (ASR Alignment)
  //    采用 OpenAI 兼容协议标准，负责提取配音毫秒级字戳并驱动镜头切分
  // =========================================================================
  asr: {
    /**
     * 服务提供商标识
     * 可选："custom_whisper" (自建/云端标准端点), "openai", "dashscope_asr"
     */
    provider: "custom_whisper",

    /**
     * [重要] 兼容 OpenAI 格式的 Whisper HTTP 接收端点
     * 常见方案：
     *  - 本地/局域网部署：如 "http://127.0.0.1:8000/v1/audio/transcriptions"
     *  - 官方或三方中转：如 "https://api.openai.com/v1/audio/transcriptions"
     */
    endpoint_url: process.env.WHISPER_ENDPOINT_URL || "http://127.0.0.1:8000/v1/audio/transcriptions",

    /**
     * 端点访问授权 Token (若自建无鉴权服务可直接留空)
     */
    api_key: process.env.WHISPER_API_KEY || "",

    /**
     * 请求的模型名称
     * 默认："whisper-1"
     */
    model: "whisper-1",
  },

  // =========================================================================
  // 3. 视觉分镜与时长节奏编排 (Pacing & Storyboard)
  // =========================================================================
  pacing: {
    /**
     * 每个镜头聚合的目标基准时长 (单位：秒)
     * 算法将把短碎的字幕按语义合并至此区间，推荐值：4.5 ~ 7.0 秒 (最契合现代短视频完播率)
     */
    target_shot_duration_sec: 5.5,

    /**
     * 当某个镜头尚未生成视频时的兜底策略
     *  - "hybrid_image" : 动静混剪模式，自动由首帧图片添加慢推拉特效作为视频轨垫底 (推荐)
     *  - "error"        : 严格报错中断
     */
    fallback_mode: "hybrid_image",
  },

  // =========================================================================
  // 4. 扩展插件与本地环境 (Plugins & Post-Production)
  // =========================================================================
  plugins: {
    /**
     * 剪映专业版草稿自动装配插件配置
     */
    jianying_draft: {
      /**
       * 是否启用剪映草稿导出通道
       */
      enabled: true,

      /**
       * 本地 Python 解释器路径
       * 若已配置全局环境变量可直接填 "python"，亦可指定虚拟环境绝对路径
       * 示例："C:/Users/xxx/miniconda3/envs/flow/python.exe" 或 "python3"
       */
      python_path: "python",
    },
  },
};
