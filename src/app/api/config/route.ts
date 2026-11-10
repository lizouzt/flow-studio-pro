import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig, saveStudioConfig } from '@/lib/config';

/**
 * 敏感 API 密钥安全掩码脱敏工具
 * 绝不在任何网络 GET 请求中明文暴露真实 API Key
 */
function maskApiKey(key?: string): string {
  if (!key || key.startsWith('YOUR_') || key.includes('sk-xxx') || key.trim() === '') {
    return '';
  }
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`;
}

export async function GET() {
  try {
    const config = getStudioConfig();

    const dashscopeRaw = config.dashscope.api_key || '';
    const hasDashscopeKey = Boolean(
      dashscopeRaw &&
      !dashscopeRaw.startsWith('YOUR_') &&
      !dashscopeRaw.includes('sk-xxx') &&
      dashscopeRaw.trim() !== ''
    );

    const asrRaw = config.asr.api_key || '';
    const hasAsrKey = Boolean(
      asrRaw &&
      !asrRaw.startsWith('YOUR_') &&
      asrRaw.trim() !== ''
    );

    return NextResponse.json({
      success: true,
      config: {
        dashscopeApiKey: maskApiKey(dashscopeRaw),
        hasDashscopeApiKey: hasDashscopeKey,
        ttsModel: config.dashscope.tts.model,
        ttsVoice: config.dashscope.tts.voice,
        speechRate: config.dashscope.tts.speech_rate,
        asrProvider: config.asr.provider || 'dashscope_asr',
        asrDashscopeModel: config.asr.dashscope_model || 'qwen-audio-3.1-asr-flash-filetrans',
        asrEndpointUrl: config.asr.endpoint_url || '',
        asrApiKey: maskApiKey(asrRaw),
        hasAsrApiKey: hasAsrKey,
        asrModel: config.asr.model || 'whisper-1',
        targetShotDuration: config.pacing.target_shot_duration_sec,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = getStudioConfig();

    // 只有当用户输入了全新的非脱敏密钥时才更新，防止掩码或者空值冲掉服务端的实际密钥
    if (body.dashscopeApiKey !== undefined) {
      const trimmed = body.dashscopeApiKey.trim();
      if (trimmed && !trimmed.includes('•') && !trimmed.includes('***')) {
        config.dashscope.api_key = trimmed;
      }
    }
    if (body.asrProvider !== undefined) {
      config.asr.provider = body.asrProvider;
    }
    if (body.asrDashscopeModel !== undefined) {
      config.asr.dashscope_model = body.asrDashscopeModel.trim();
    }
    if (body.asrEndpointUrl !== undefined) {
      config.asr.endpoint_url = body.asrEndpointUrl.trim();
    }
    if (body.asrApiKey !== undefined) {
      const trimmed = body.asrApiKey.trim();
      if (trimmed && !trimmed.includes('•') && !trimmed.includes('***')) {
        config.asr.api_key = trimmed;
      }
    }
    if (body.asrModel !== undefined) {
      config.asr.model = body.asrModel.trim();
    }
    if (body.ttsVoice !== undefined) {
      config.dashscope.tts.voice = body.ttsVoice;
    }
    if (body.speechRate !== undefined) {
      config.dashscope.tts.speech_rate = Number(body.speechRate);
    }

    saveStudioConfig(config);

    return NextResponse.json({
      success: true,
      message: '配置已成功保存并立即生效'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
