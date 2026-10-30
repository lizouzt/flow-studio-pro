import { SrtCue } from './pacing';

export interface ASROptions {
  endpointUrl: string;
  apiKey?: string;
  model?: string;
}

export async function alignAudioWithWhisper(
  audioFilePath: string,
  options: ASROptions
): Promise<{ srtContent: string; cues: SrtCue[] }> {
  if (!options.endpointUrl || options.endpointUrl.trim() === '') {
    throw new Error('未配置 ASR 语音识别端点 URL (endpoint_url)。请在设置中配置可访问的 Whisper 云端或私有化端点。');
  }

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

    res = await fetch(options.endpointUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`ASR 端点请求超时 (60s): ${options.endpointUrl}`);
    }
    throw new Error(
      `无法连接至 ASR 语音识别端点 [${options.endpointUrl}]：${err.message || '网络连接失败'}。` +
      `请检查端点 URL 是否正确、服务是否正常启动，或在右上角设置中更换可用的端点。`
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    let detail = errText;
    try {
      const errObj = JSON.parse(errText);
      detail = errObj.error?.message || errObj.message || errText;
    } catch {}
    throw new Error(`ASR 端点返回错误 (HTTP ${res.status}): ${detail}`);
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
