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
  forceRegenerate?: boolean;
}

export async function synthesizeSpeech(
  text: string,
  options: TTSOptions,
  outputDir: string
): Promise<{ audioPath: string; durationSec: number; fromCache?: boolean; audioHash: string }> {
  if (!options.apiKey || options.apiKey.startsWith('YOUR_') || options.apiKey.includes('sk-xxx') || options.apiKey.trim() === '') {
    throw new Error('未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)。请点击右上角设置图标填入有效的百炼 Key。');
  }

  // 智能平滑映射旧版已下线模型与音色，确保零报错
  let targetModel = options.model || 'cosyvoice-v3-flash';
  if (targetModel === 'cosyvoice-v1' || targetModel === 'cosyvoice-latest') {
    targetModel = 'cosyvoice-v3-flash';
  }

  let targetVoice = options.voice || 'longanyang';
  if (targetVoice === 'longxiaochun' || targetVoice === 'longhua') {
    targetVoice = 'longanyang'; // 平滑映射至 v3-flash 官方推荐叙事标杆音色
  } else if (targetVoice === 'longwan') {
    targetVoice = 'longanhuan';
  }

  const hash = crypto.createHash('sha256').update(`${text.trim()}_${targetModel}_${targetVoice}_${options.speechRate || 1.0}`).digest('hex').slice(0, 12);
  const fileName = `voice_${hash}.mp3`;
  const metaFileName = `voice_${hash}.meta.json`;
  const finalPath = path.join(outputDir, fileName);
  const finalMetaPath = path.join(outputDir, metaFileName);

  // 命中文本/音色哈希缓存则直接复用 (未开启强制重新生成时)
  if (!options.forceRegenerate && fs.existsSync(finalPath) && fs.statSync(finalPath).size > 1024) {
    let exactDuration: number | null = null;
    if (fs.existsSync(finalMetaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(finalMetaPath, 'utf-8'));
        if (typeof meta.durationSec === 'number' && meta.durationSec > 0) {
          exactDuration = meta.durationSec;
        }
      } catch {}
    }
    const stats = fs.statSync(finalPath);
    return { 
      audioPath: `/output/audio/${fileName}`, 
      durationSec: exactDuration ?? estimateDurationFromSize(stats.size),
      fromCache: true,
      audioHash: hash,
    };
  }

  fs.mkdirSync(outputDir, { recursive: true });

  // 阿里云百炼官方 SpeechSynthesizer 标准接口调用
  const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: targetModel,
      input: {
        text,
        voice: targetVoice,
      },
      parameters: {
        format: options.format || 'mp3',
        sample_rate: 22050,
        rate: options.speechRate || 1.0,
        pitch: options.pitchRate || 1.0,
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

  // 百炼 SpeechSynthesizer 返回 JSON 格式结果，包含音频下载 URL
  const resText = await response.text();
  let audioBuffer: Buffer;

  try {
    const resJson = JSON.parse(resText);
    const downloadUrl = resJson?.output?.audio?.url;
    if (downloadUrl) {
      // 从返回的 oss 下载链接获取实际音频数据
      const audioRes = await fetch(downloadUrl);
      if (!audioRes.ok) {
        throw new Error(`下载百炼生成的音频失败 (HTTP ${audioRes.status})`);
      }
      const arrayBuf = await audioRes.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
    } else if (resJson?.output?.audio?.data) {
      // 兼容 Base64 音频返回
      audioBuffer = Buffer.from(resJson.output.audio.data, 'base64');
    } else {
      throw new Error(`百炼未返回有效的音频地址或数据: ${resText.slice(0, 300)}`);
    }
  } catch (parseErr: any) {
    // 兼容可能直接返回二进制流的情况
    audioBuffer = Buffer.from(resText);
  }

  if (audioBuffer.byteLength < 512) {
    throw new Error('百炼语音合成返回音频数据异常，请检查配音参数。');
  }

  fs.writeFileSync(finalPath, audioBuffer);

  const estimatedDuration = estimateDurationFromSize(audioBuffer.byteLength);
  // 保存初始元数据缓存
  try {
    fs.writeFileSync(finalMetaPath, JSON.stringify({
      audioHash: hash,
      fileName,
      durationSec: estimatedDuration,
      model: targetModel,
      voice: targetVoice,
      speechRate: options.speechRate || 1.0,
      createdAt: new Date().toISOString(),
    }, null, 2), 'utf-8');
  } catch {}

  return {
    audioPath: `/output/audio/${fileName}`,
    durationSec: estimatedDuration,
    fromCache: false,
    audioHash: hash,
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
  model: string = 'wanx2.1-t2i-turbo',
  size: string = '720*1280'
): Promise<string> {
  if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
    throw new Error('未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)，无法调用通义万相生成首帧。');
  }

  // 智能纠错与映射：百炼官方万相 2.1 文生图模型标识符为 wanx2.1-t2i-turbo / wanx2.1-t2i-plus (wanx 与 2.1 之间无连字符)
  let targetModel = model || 'wanx2.1-t2i-turbo';
  if (targetModel === 'wanx-2.1-t2i-turbo' || targetModel === 'wanx-2.1') {
    targetModel = 'wanx2.1-t2i-turbo';
  } else if (targetModel === 'wanx-2.1-t2i-plus') {
    targetModel = 'wanx2.1-t2i-plus';
  }

  const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    },
    body: JSON.stringify({
      model: targetModel,
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

/**
 * 将本地媒体文件（音频/图片/视频）上传至百炼临时 OSS 存储，换取 oss:// 协议链接
 * 适用于 Wanx 图生视频、Qwen-Audio ASR 等需要公网/OSS 路径的百炼模型
 */
export async function uploadLocalFileToDashScopeOss(
  filePath: string,
  apiKey: string,
  modelName: string = 'wanx2.1-i2v-plus'
): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(filePath)) {
    throw new Error(`待上传至百炼临时存储的文件不存在: ${filePath}`);
  }

  // 1. 获取百炼临时上传凭证
  const policyRes = await fetch(
    `https://dashscope.aliyuncs.com/api/v1/uploads?action=getPolicy&model=${encodeURIComponent(modelName)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!policyRes.ok) {
    const errText = await policyRes.text();
    throw new Error(`获取百炼临时上传策略凭据失败 (HTTP ${policyRes.status}): ${errText}`);
  }

  const policyJson = await policyRes.json();
  const data = policyJson?.data;
  if (!data || !data.upload_host || !data.upload_dir) {
    throw new Error(`百炼临时上传凭据返回不完整: ${JSON.stringify(policyJson)}`);
  }

  const fileName = path.basename(filePath);
  const objectKey = `${data.upload_dir}/${fileName}`;
  const fileBuffer = fs.readFileSync(filePath);

  const acl = data.x_oss_object_acl || 'private';
  const forbidOverwrite = data.x_oss_forbid_overwrite || data['x_oss_forbid-overwrite'] || 'true';

  // 根据文件后缀获取正确的 MIME 类型
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'application/octet-stream';
  if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.webp') mimeType = 'image/webp';
  else if (ext === '.mp3') mimeType = 'audio/mpeg';
  else if (ext === '.mp4') mimeType = 'video/mp4';

  // 2. 构造表单数据并 POST 到临时 OSS
  // 严格遵守阿里云 OSS PostObject 表单规则：key 首位，字段在先，file 必须在最后
  const formData = new FormData();
  formData.append('key', objectKey);
  formData.append('OSSAccessKeyId', data.oss_access_key_id);
  formData.append('policy', data.policy);
  formData.append('Signature', data.signature);
  formData.append('x-oss-object-acl', acl);
  formData.append('x-oss-forbid-overwrite', forbidOverwrite);
  formData.append('success_action_status', '200');
  formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  const uploadRes = await fetch(data.upload_host, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`文件上传至百炼临时存储失败 (HTTP ${uploadRes.status}): ${errText}`);
  }

  return `oss://${objectKey}`;
}
