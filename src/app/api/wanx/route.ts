import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';
import { generateWanxImage } from '@/lib/dashscope';

export async function POST(req: NextRequest) {
  try {
    const { prompt, shotId } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const config = getStudioConfig();
    const remoteImageUrl = await generateWanxImage(
      prompt,
      config.dashscope.api_key,
      config.dashscope.image.model,
      config.dashscope.image.size
    );

    // 本地持久化缓存首帧图至 output/images/
    const targetShotId = shotId || `shot_${Date.now()}`;
    const imgDir = path.resolve(process.cwd(), 'output', 'images');
    fs.mkdirSync(imgDir, { recursive: true });
    const localFileName = `${targetShotId}.png`;
    const localFilePath = path.join(imgDir, localFileName);

    let displayUrl = remoteImageUrl;
    try {
      const imgRes = await fetch(remoteImageUrl);
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        fs.writeFileSync(localFilePath, Buffer.from(arrayBuf));
        displayUrl = `/output/images/${localFileName}`;
      }
    } catch (saveErr) {
      console.warn('Failed to save wanx image locally, fallback to remote url:', saveErr);
    }

    return NextResponse.json({
      success: true,
      shotId: targetShotId,
      imageUrl: displayUrl,
      remoteUrl: remoteImageUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Wanx generation failed' }, { status: 500 });
  }
}
