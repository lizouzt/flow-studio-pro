import { SrtCue } from './pacing';

export interface ASROptions {
  provider?: 'dashscope_asr' | 'faster_whisper' | 'custom_whisper' | 'openai' | 'cloud_whisper' | 'custom_endpoint' | string;
  endpointUrl?: string;
  apiKey?: string;
  dashscopeApiKey?: string;
  model?: string;
}

/**
 * 统一 ASR 语音对齐入口：自动根据 provider 路由到百炼 ASR 或 faster-whisper-server / OpenAI 兼容端点
 */
export async function alignAudio(
  audioFilePath: string,
  options: ASROptions
): Promise<{ srtContent: string; cues: SrtCue[] }> {
  const provider = (options.provider || '').toLowerCase();

  // 若明确指定 dashscope_asr，或未指定 provider 但仅配置了百炼 Key 且没有配置 whisper endpoint
  const isDashScope = provider === 'dashscope_asr' || provider === 'dashscope' || 
    (!provider && !options.endpointUrl && (options.dashscopeApiKey || options.apiKey));

  if (isDashScope) {
    const key = options.dashscopeApiKey || options.apiKey || '';
    const rawModel = options.model || 'qwen-audio-3.1-asr-flash-filetrans';
    // 智能映射非实时文件转写官方旗舰模型
    const model = (rawModel === 'qwen-audio-3.0-asr-flash' || rawModel === 'sensevoice-v1')
      ? 'qwen-audio-3.1-asr-flash-filetrans'
      : rawModel;
    return alignAudioWithDashScope(audioFilePath, { apiKey: key, model });
  }

  // 默认走 faster-whisper-server / OpenAI 兼容协议
  return alignAudioWithWhisper(audioFilePath, {
    endpointUrl: options.endpointUrl || 'http://127.0.0.1:8000/v1/audio/transcriptions',
    apiKey: options.apiKey,
    model: options.model || 'whisper-1',
  });
}

/**
 * 驱动器 A：阿里云百炼原生非实时语音识别 (支持 qwen-audio-3.0-asr-flash / sensevoice-v1 等)
 * 免本地部署、免显卡，自动将本地配音音频上传至百炼临时 OSS，异步执行高精度识别并返回毫秒级时间戳
 */
export async function alignAudioWithDashScope(
  audioFilePath: string,
  options: {
    apiKey: string;
    model?: string;
  }
): Promise<{ srtContent: string; cues: SrtCue[] }> {
  const apiKey = (options.apiKey || '').trim();
  if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx')) {
    throw new Error('未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)。请在设置中配置有效凭据。');
  }

  const fs = await import('fs');
  if (!audioFilePath.startsWith('http://') && !audioFilePath.startsWith('https://') && !audioFilePath.startsWith('oss://')) {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`找不到待对齐的音频文件: ${audioFilePath}，请先生成或提供有效配音音频。`);
    }
  }

  let model = options.model || 'qwen-audio-3.1-asr-flash-filetrans';
  if (model === 'qwen-audio-3.0-asr-flash' || model === 'sensevoice-v1') {
    model = 'qwen-audio-3.1-asr-flash-filetrans';
  }

  // 1. 如果是本地音频文件，先上传至百炼临时存储获取 oss:// 地址
  let fileUrl = audioFilePath;
  if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://') && !fileUrl.startsWith('oss://')) {
    fileUrl = await uploadLocalFileToDashScopeOss(audioFilePath, apiKey, model);
  }

  // 2. 提交百炼非实时语音识别异步任务
  const taskRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
      'X-DashScope-OssResourceResolve': 'enable',
    },
    body: JSON.stringify({
      model,
      input: {
        file_urls: [fileUrl],
      },
      parameters: {
        enable_timestamp_alignment: true,
      },
    }),
  });

  if (!taskRes.ok) {
    const errText = await taskRes.text();
    let detail = errText;
    try {
      const errObj = JSON.parse(errText);
      detail = errObj.message || errObj.code || errText;
    } catch {}
    throw new Error(`百炼 ASR 任务提交失败 (HTTP ${taskRes.status}): ${detail}`);
  }

  const taskData = await taskRes.json();
  const taskId = taskData?.output?.task_id;
  if (!taskId) {
    throw new Error(`百炼 ASR 未能返回有效的任务 ID: ${JSON.stringify(taskData)}`);
  }

  // 3. 异步轮询任务执行状态 (最多等待 60 秒)
  const maxAttempts = 30;
  let resultOutput: any = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const checkRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      const status = checkData?.output?.task_status;
      if (status === 'SUCCEEDED') {
        resultOutput = checkData?.output;
        break;
      } else if (status === 'FAILED') {
        throw new Error(`百炼 ASR 转写失败: ${checkData?.output?.message || '未知错误'}`);
      }
    }
  }

  if (!resultOutput) {
    throw new Error(`百炼 ASR 语音识别超时，未能在 60 秒内完成任务 (TaskId: ${taskId})`);
  }

  // 4. 解析识别文本与毫秒级时间戳 (begin_time / end_time)
  const sentences: Array<{ begin_time: number; end_time: number; text: string }> = [];
  const taskResults = resultOutput?.results || [];
  if (taskResults.length > 0) {
    const firstResult = taskResults[0];
    if (firstResult.transcription_url) {
      const transRes = await fetch(firstResult.transcription_url);
      if (transRes.ok) {
        const transData = await transRes.json();
        const transcripts = transData.transcripts || [];
        for (const tr of transcripts) {
          if (Array.isArray(tr.sentences)) {
            sentences.push(...tr.sentences);
          }
        }
      }
    } else if (Array.isArray(firstResult.sentences)) {
      sentences.push(...firstResult.sentences);
    }
  }

  if (sentences.length === 0) {
    throw new Error('百炼 ASR 转写成功，但未返回可用的句子时间戳，请检查音频是否存在清晰人声。');
  }

  const cues: SrtCue[] = [];
  let srtText = '';

  sentences.forEach((s, idx) => {
    const id = idx + 1;
    const start = Number((s.begin_time / 1000).toFixed(3));
    const end = Number((s.end_time / 1000).toFixed(3));
    const text = (s.text || '').trim();
    if (text) {
      cues.push({ id, start_sec: start, end_sec: end, text });
      srtText += `${id}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${text}\n\n`;
    }
  });

  return { srtContent: srtText, cues };
}

/**
 * 辅助函数：将本地音频文件通过百炼临时存储策略上传至临时 OSS，并返回以 oss:// 开头的临时资源定位符
 */
async function uploadLocalFileToDashScopeOss(
  filePath: string,
  apiKey: string,
  modelName: string = 'qwen-audio-3.1-asr-flash-filetrans'
): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');

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

  // 提取必须字段，注意百炼接口返回的是下划线 x_oss_forbid_overwrite
  const acl = data.x_oss_object_acl || 'private';
  const forbidOverwrite = data.x_oss_forbid_overwrite || data['x_oss_forbid-overwrite'] || 'true';

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
  formData.append('file', new Blob([fileBuffer], { type: 'audio/mpeg' }), fileName);

  const uploadRes = await fetch(data.upload_host, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`音频上传至百炼临时存储失败 (HTTP ${uploadRes.status}): ${errText}`);
  }

  return `oss://${objectKey}`;
}

/**
 * 驱动器 B：兼容 faster-whisper-server 与 OpenAI 原生 Whisper 规范服务
 * 通过 multipart/form-data 二进制表单直传音频文件，同步提取 segments
 */
export async function alignAudioWithWhisper(
  audioFilePath: string,
  options: {
    endpointUrl?: string;
    apiKey?: string;
    model?: string;
  }
): Promise<{ srtContent: string; cues: SrtCue[] }> {
  const endpoint = options.endpointUrl || 'http://127.0.0.1:8000/v1/audio/transcriptions';

  const fs = await import('fs');
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`找不到待对齐的音频文件: ${audioFilePath}，请先生成或提供有效配音音频。`);
  }

  const fileBuffer = fs.readFileSync(audioFilePath);
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: 'audio/mp3' });
  formData.append('file', blob, 'audio.mp3');
  formData.append('model', options.model || 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const headers: Record<string, string> = {};
  if (options.apiKey && options.apiKey.trim() !== '') {
    headers['Authorization'] = `Bearer ${options.apiKey.trim()}`;
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s 超时

    res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`ASR 端点请求超时 (60s): ${endpoint}`);
    }
    throw new Error(
      `无法连接至 faster-whisper-server / Whisper 服务端点 [${endpoint}]：${err.message || '网络连接失败'}。\n` +
      `若使用本地 faster-whisper-server，请确保服务已启动 (如: faster-whisper-server --port 8000)；` +
      `或在 studio_config.js 中将 provider 切换为 "dashscope_asr" 使用百炼云端 ASR。`
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    let detail = errText;
    try {
      const errObj = JSON.parse(errText);
      detail = errObj.error?.message || errObj.message || errText;
    } catch {}
    throw new Error(`Whisper 端点返回错误 (HTTP ${res.status}): ${detail}`);
  }

  const data = await res.json();
  const segments = data.segments || [];
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('ASR 端点未返回有效的时间戳分段 (segments 为空)，请检查音频内容或端点模型参数。');
  }

  const cues: SrtCue[] = [];
  let srtText = '';

  segments.forEach((seg: any, idx: number) => {
    const id = idx + 1;
    const start = Number(seg.start.toFixed(3));
    const end = Number(seg.end.toFixed(3));
    const text = (seg.text || '').trim();
    if (text) {
      cues.push({ id, start_sec: start, end_sec: end, text });
      srtText += `${id}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${text}\n\n`;
    }
  });

  return { srtContent: srtText, cues };
}

function formatSrtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
