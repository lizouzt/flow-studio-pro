import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';
import { alignAudio } from '@/lib/asr';
import { aggregateCuesToShots } from '@/lib/pacing';
import { enrichShotsWithVisualDirector } from '@/lib/visualDirector';

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

    const provider = config.asr?.provider || 'dashscope_asr';
    const isDashScope = provider === 'dashscope_asr' || provider === 'dashscope';

    const { srtContent, cues } = await alignAudio(
      realAudioPath,
      {
        provider,
        endpointUrl: config.asr?.endpoint_url,
        apiKey: config.asr?.api_key,
        dashscopeApiKey: config.dashscope?.api_key,
        model: isDashScope 
          ? (config.asr?.dashscope_model || 'qwen-audio-3.0-asr-flash')
          : (config.asr?.model || 'whisper-1'),
      }
    );

    // 将真实生成的 SRT 保存到 output/subtitles/
    const srtDir = path.resolve(process.cwd(), 'output', 'subtitles');
    fs.mkdirSync(srtDir, { recursive: true });
    const srtFile = path.join(srtDir, `subtitles_${Date.now()}.srt`);
    fs.writeFileSync(srtFile, srtContent, 'utf-8');

    // 智能聚合成 4~7s 镜头单元
    const rawShots = aggregateCuesToShots(
      cues, 
      config.pacing.target_shot_duration_sec || 5.5,
      styleId || 'Historical Comic'
    );

    // 视觉导演 Agent：针对解说词语义深度注入南宋历史与中式人物美术提示词
    const apiKey = config.dashscope?.api_key || '';
    const shots = await enrichShotsWithVisualDirector(rawShots, apiKey, text);

    return NextResponse.json({
      success: true,
      srtPath: `/output/subtitles/${path.basename(srtFile)}`,
      shots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'ASR alignment failed' }, { status: 500 });
  }
}
