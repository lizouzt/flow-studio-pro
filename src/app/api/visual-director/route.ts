import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig } from '@/lib/config';
import { enrichShotsWithVisualDirector } from '@/lib/visualDirector';

export async function POST(req: NextRequest) {
  try {
    const { shots, topic } = await req.json();
    if (!shots || !Array.isArray(shots)) {
      return NextResponse.json({ error: '分镜列表不能为空' }, { status: 400 });
    }

    const config = getStudioConfig();
    const apiKey = config.dashscope?.api_key || '';

    const enrichedShots = await enrichShotsWithVisualDirector(shots, apiKey, topic);

    return NextResponse.json({
      success: true,
      shots: enrichedShots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '视觉导演重塑失败' }, { status: 500 });
  }
}
