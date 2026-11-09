import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig } from '@/lib/config';
import { analyzeVisualContext, enrichShotsWithAdaptiveVisualDirector } from '@/lib/visualDirector';

export async function POST(req: NextRequest) {
  try {
    const { shots, topic = '', script = '', customProfile } = await req.json();
    if (!shots || !Array.isArray(shots)) {
      return NextResponse.json({ error: '分镜列表不能为空' }, { status: 400 });
    }

    const config = getStudioConfig();
    const apiKey = config.dashscope?.api_key || '';

    // 自适应提取视觉世界观设定档案
    const visualProfile = customProfile || (await analyzeVisualContext(script, topic, apiKey));

    // 基于提取的世界观档案为各镜头生成高精度首帧生图与运镜提示词
    const enrichedShots = await enrichShotsWithAdaptiveVisualDirector(
      shots,
      visualProfile,
      apiKey,
      script,
      topic
    );

    return NextResponse.json({
      success: true,
      visualProfile,
      shots: enrichedShots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '视觉导演自适应分析失败' }, { status: 500 });
  }
}
