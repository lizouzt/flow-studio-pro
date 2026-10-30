import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';
import { alignAudioWithWhisper } from '@/lib/asr';
import { aggregateCuesToShots } from '@/lib/pacing';

export async function POST(req: NextRequest) {
  try {
    const { audioPath, text, styleId } = await req.json();
    if (!text && !audioPath) {
      return NextResponse.json({ error: 'Audio or text is required' }, { status: 400 });
    }

    const config = getStudioConfig();
    const realAudioPath = audioPath 
      ? path.resolve(process.cwd(), audioPath.replace(/^\//, ''))
      : '';

    const { srtContent, cues } = await alignAudioWithWhisper(
      realAudioPath,
      {
        endpointUrl: config.asr.endpoint_url,
        apiKey: config.asr.api_key,
        model: config.asr.model,
      }
    );

    // 将真实生成的 SRT 保存到 output/subtitles/
    const srtDir = path.resolve(process.cwd(), 'output', 'subtitles');
    fs.mkdirSync(srtDir, { recursive: true });
    const srtFile = path.join(srtDir, `subtitles_${Date.now()}.srt`);
    fs.writeFileSync(srtFile, srtContent, 'utf-8');

    // 智能聚合成 4~7s 镜头单元
    const shots = aggregateCuesToShots(
      cues, 
      config.pacing.target_shot_duration_sec || 5.5,
      styleId || 'Historical Comic'
    );

    return NextResponse.json({
      success: true,
      srtPath: `/output/subtitles/${path.basename(srtFile)}`,
      shots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'ASR alignment failed' }, { status: 500 });
  }
}
