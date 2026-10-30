import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig } from '@/lib/config';
import { generateWanxImage } from '@/lib/dashscope';

export async function POST(req: NextRequest) {
  try {
    const { prompt, shotId } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const config = getStudioConfig();
    const imageUrl = await generateWanxImage(
      prompt,
      config.dashscope.api_key,
      config.dashscope.image.model,
      config.dashscope.image.size
    );

    return NextResponse.json({
      success: true,
      shotId,
      imageUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Wanx generation failed' }, { status: 500 });
  }
}
