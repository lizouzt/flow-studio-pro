import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { StudioConfig } from '@/types';

const JS_CONFIG_PATH = path.resolve(process.cwd(), 'studio_config.js');
const JS_TEMPLATE_PATH = path.resolve(process.cwd(), 'studio_config.template.js');
const JSON_CONFIG_PATH = path.resolve(process.cwd(), 'studio_config.json');

function loadJsModule(filePath: string): any {
  const code = fs.readFileSync(filePath, 'utf-8');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    process: { env: process.env },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.module.exports;
}

export function getStudioConfig(): StudioConfig {
  let config: StudioConfig | null = null;

  // 1. 优先安全执行 studio_config.js
  if (fs.existsSync(JS_CONFIG_PATH)) {
    try {
      config = loadJsModule(JS_CONFIG_PATH);
    } catch (e) {
      console.warn('Failed to load studio_config.js, falling back:', e);
    }
  }

  // 2. 兼容旧版 JSON
  if (!config && fs.existsSync(JSON_CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_CONFIG_PATH, 'utf-8');
      config = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read studio_config.json:', e);
    }
  }

  // 3. 模板兜底
  if (!config && fs.existsSync(JS_TEMPLATE_PATH)) {
    try {
      config = loadJsModule(JS_TEMPLATE_PATH);
    } catch (e) {
      console.warn('Failed to load template:', e);
    }
  }

  if (!config) {
    throw new Error('No valid config file (studio_config.js or studio_config.json) found.');
  }

  // 4. 环境变量覆盖
  if (process.env.DASHSCOPE_API_KEY) {
    config.dashscope.api_key = process.env.DASHSCOPE_API_KEY;
  }
  if (process.env.WHISPER_ENDPOINT_URL) {
    config.asr.endpoint_url = process.env.WHISPER_ENDPOINT_URL;
  }
  if (process.env.WHISPER_API_KEY) {
    config.asr.api_key = process.env.WHISPER_API_KEY;
  }

  return config;
}

export function saveStudioConfig(config: StudioConfig): void {
  const content = `/**
 * Flow Studio Pro - 全局核心配置文件 (studio_config.js)
 * 由系统设置自动同步生成，亦可手动编辑。
 */

module.exports = {
  // 1. 阿里云百炼 (DashScope) 统一生态服务配置
  dashscope: {
    // 阿里云百炼 API Key (https://bailian.console.aliyun.com/)
    api_key: process.env.DASHSCOPE_API_KEY || ${JSON.stringify(config.dashscope?.api_key || "")},

    // 语音大模型 (CosyVoice)
    tts: {
      model: ${JSON.stringify(config.dashscope?.tts?.model || "cosyvoice-v1")},
      voice: ${JSON.stringify(config.dashscope?.tts?.voice || "longxiaochun")},
      speech_rate: ${config.dashscope?.tts?.speech_rate || 1.05},
      pitch_rate: ${config.dashscope?.tts?.pitch_rate || 1.0},
      format: ${JSON.stringify(config.dashscope?.tts?.format || "mp3")},
    },

    // 首帧生图大模型 (通义万相)
    image: {
      model: ${JSON.stringify(config.dashscope?.image?.model || "wanx-2.1-t2i-turbo")},
      size: ${JSON.stringify(config.dashscope?.image?.size || "720*1280")},
      style: ${JSON.stringify(config.dashscope?.image?.style || "<auto>")},
    },

    // 闭环视频生成大模型 (通义万相 I2V)
    video: {
      model: ${JSON.stringify(config.dashscope?.video?.model || "wanx2.1-i2v-plus")},
      resolution: ${JSON.stringify(config.dashscope?.video?.resolution || "720p")},
      prompt_extend: ${Boolean(config.dashscope?.video?.prompt_extend ?? false)},
    },
  },

  // 2. 语音识别与时间戳对齐端点 (标准 OpenAI Whisper 协议)
  asr: {
    provider: ${JSON.stringify(config.asr?.provider || "custom_whisper")},
    endpoint_url: process.env.WHISPER_ENDPOINT_URL || ${JSON.stringify(config.asr?.endpoint_url || "http://127.0.0.1:8000/v1/audio/transcriptions")},
    api_key: process.env.WHISPER_API_KEY || ${JSON.stringify(config.asr?.api_key || "")},
    model: ${JSON.stringify(config.asr?.model || "whisper-1")},
  },

  // 3. 视觉分镜与时长节奏编排
  pacing: {
    target_shot_duration_sec: ${config.pacing?.target_shot_duration_sec || 5.5},
    fallback_mode: ${JSON.stringify(config.pacing?.fallback_mode || "hybrid_image")},
  },

  // 4. 扩展插件与环境配置
  plugins: {
    jianying_draft: {
      enabled: ${Boolean(config.plugins?.jianying_draft?.enabled ?? true)},
      python_path: ${JSON.stringify(config.plugins?.jianying_draft?.python_path || "python")},
    },
  },
};
`;

  fs.writeFileSync(JS_CONFIG_PATH, content, 'utf-8');
  fs.writeFileSync(JSON_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
