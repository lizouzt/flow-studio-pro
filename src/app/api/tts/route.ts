import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getStudioConfig } from '@/lib/config';
import { synthesizeSpeech } from '@/lib/dashscope';

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speechRate } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const config = getStudioConfig();
    const outputDir = path.resolve(process.cwd(), 'output', 'audio');

    const result = await synthesizeSpeech(
      text,
      {
        apiKey: config.dashscope.api_key,
        model: config.dashscope.tts.model,
        voice: voice || config.dashscope.tts.voice,
        speechRate: speechRate || config.dashscope.tts.speech_rate,
      },
      outputDir
    );

    return NextResponse.json({
      success: true,
      audioPath: result.audioPath,
      durationSec: result.durationSec,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 });
  }
}
