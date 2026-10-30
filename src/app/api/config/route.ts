import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig, saveStudioConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = getStudioConfig();
    return NextResponse.json({
      success: true,
      config: {
        dashscopeApiKey: config.dashscope.api_key || '',
        ttsModel: config.dashscope.tts.model,
        ttsVoice: config.dashscope.tts.voice,
        speechRate: config.dashscope.tts.speech_rate,
        asrEndpointUrl: config.asr.endpoint_url || '',
        asrApiKey: config.asr.api_key || '',
        asrModel: config.asr.model,
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

    if (body.dashscopeApiKey !== undefined) {
      config.dashscope.api_key = body.dashscopeApiKey.trim();
    }
    if (body.asrEndpointUrl !== undefined) {
      config.asr.endpoint_url = body.asrEndpointUrl.trim();
    }
    if (body.asrApiKey !== undefined) {
      config.asr.api_key = body.asrApiKey.trim();
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
