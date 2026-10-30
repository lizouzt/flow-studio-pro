import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface TTSOptions {
  apiKey: string;
  model: string;
  voice: string;
  speechRate?: number;
  pitchRate?: number;
  format?: string;
}

export async function synthesizeSpeech(
  text: string,
  options: TTSOptions,
  outputDir: string
): Promise<{ audioPath: string; durationSec: number }> {
  if (!options.apiKey || options.apiKey.startsWith('YOUR_') || options.apiKey.includes('sk-xxx') || options.apiKey.trim() === '') {
    throw new Error('未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)。请点击右上角设置图标填入有效的百炼 Key。');
  }

  const hash = crypto.createHash('sha256').update(`${text}_${options.model}_${options.voice}_${options.speechRate}`).digest('hex');
  const fileName = `voice_${hash.slice(0, 10)}.mp3`;
  const finalPath = path.join(outputDir, fileName);

  // 命中文本/音色哈希缓存则直接复用
  if (fs.existsSync(finalPath) && fs.statSync(finalPath).size > 1024) {
    const stats = fs.statSync(finalPath);
    return { 
      audioPath: `/output/audio/${fileName}`, 
      durationSec: estimateDurationFromSize(stats.size)
    };
  }

  fs.mkdirSync(outputDir, { recursive: true });

  // 真实 DashScope CosyVoice API 调用
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'cosyvoice-v1',
      input: { text },
      parameters: {
        voice: options.voice || 'longxiaochun',
        format: options.format || 'mp3',
        sample_rate: 22050,
        rate: options.speechRate || 1.0,
        pitch: options.pitchRate || 1.0
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `百炼语音合成失败 (HTTP ${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg += `: ${errJson.message || errJson.code || errText}`;
    } catch {
      errMsg += `: ${errText}`;
    }
    throw new Error(errMsg);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 512) {
    throw new Error('百炼语音合成返回音频数据异常，请检查配音参数。');
  }

  fs.writeFileSync(finalPath, Buffer.from(buffer));

  return {
    audioPath: `/output/audio/${fileName}`,
    durationSec: estimateDurationFromSize(buffer.byteLength)
  };
}

function estimateDurationFromSize(byteLength: number): number {
  // mp3 64kbps 粗略估算时长 (bytes * 8 / 64000)
  const sec = (byteLength * 8) / 64000;
  return Math.max(3.0, Number(sec.toFixed(1)));
}

export async function generateWanxImage(
  prompt: string,
  apiKey: string,
  model: string = 'wanx-2.1-t2i-turbo',
  size: string = '720*1280'
): Promise<string> {
  if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
    throw new Error('未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)，无法调用通义万相生成首帧。');
  }

  const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    },
    body: JSON.stringify({
      model,
      input: { prompt },
      parameters: { size, n: 1 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`通义万相请求失败 (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  const taskId = data?.output?.task_id;
  if (!taskId) {
    throw new Error(`通义万相未返回 task_id: ${JSON.stringify(data)}`);
  }

  // 轮询万相异步生成结果 (最多轮询 40 秒)
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 2000));
    const checkRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`
      }
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      const status = checkData?.output?.task_status;
      if (status === 'SUCCEEDED') {
        const imgUrl = checkData?.output?.results?.[0]?.url;
        if (imgUrl) return imgUrl;
      } else if (status === 'FAILED') {
        throw new Error(`通义万相生成失败: ${checkData?.output?.message || '未知错误'}`);
      }
    }
  }

  throw new Error('通义万相生图超时，请稍后重试。');
}
