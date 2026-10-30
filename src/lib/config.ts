import fs from 'fs';
import path from 'path';
import { StudioConfig } from '@/types';

const CONFIG_PATH = path.resolve(process.cwd(), 'studio_config.json');
const TEMPLATE_PATH = path.resolve(process.cwd(), 'studio_config.template.json');

export function getStudioConfig(): StudioConfig {
  let raw = '';
  if (fs.existsSync(CONFIG_PATH)) {
    raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  } else if (fs.existsSync(TEMPLATE_PATH)) {
    raw = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  } else {
    throw new Error('Config file not found');
  }

  const config: StudioConfig = JSON.parse(raw);

  // 支持环境变量覆盖
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
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
