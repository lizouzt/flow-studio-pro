import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getStudioConfig } from '@/lib/config';
import { generateWanxImage } from '@/lib/dashscope';
import { applyAdaptiveGuardrail } from '@/lib/visualDirector';

export async function POST(req: NextRequest) {
  try {
    const { prompt, shotId, visualProfile, force = false, referenceImage } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 检查是否存在已确认的主角概念定妆照 (Actor Casting Benchmark)
    const benchmarkDiskPath = path.resolve(process.cwd(), 'output', 'character', 'protagonist_benchmark.png');
    const hasBenchmark = fs.existsSync(benchmarkDiskPath) && fs.statSync(benchmarkDiskPath).size > 1024;

    // 自适应防偏网：根据当前提取出的视觉档案自适应注入正向特征与时代冲突负向排除
    let basePrompt = prompt;
    if (hasBenchmark) {
      // 强力注入主角锁脸锚定指令
      basePrompt = `【主角绝对一致性锁脸】：画面中主体人物的面部五官结构、发型与年龄感，必须绝对严格对照【主角定妆概念照】的同一个人，严禁改变长相！${basePrompt}`;
    }
    const guardedPrompt = applyAdaptiveGuardrail(basePrompt, visualProfile);

    const config = getStudioConfig();
    const imageModel = config.dashscope?.image?.model || 'wanx2.1-t2i-turbo';
    const imageSize = config.dashscope?.image?.size || '720*1280';

    // 1. 基于“提示词全文 + 模型 + 尺寸 + 是否锁脸”计算 SHA-256 精确内容指纹 (Content-Hash)
    const lockSalt = hasBenchmark ? '_locked' : '';
    const promptHash = crypto
      .createHash('sha256')
      .update(`${guardedPrompt.trim()}_${imageModel}_${imageSize}${lockSalt}`)
      .digest('hex')
      .slice(0, 16);

    const imgDir = path.resolve(process.cwd(), 'output', 'images');
    fs.mkdirSync(imgDir, { recursive: true });

    const hashFileName = `frame_${promptHash}.png`;
    const hashFilePath = path.join(imgDir, hashFileName);
    const targetShotId = shotId || `shot_${Date.now()}`;
    const shotFilePath = path.join(imgDir, `${targetShotId}.png`);

    // 2. 检查内容哈希缓存命中：若未强制重绘且本地已存在有效图像，直接 0 秒极速命中！
    if (!force && fs.existsSync(hashFilePath) && fs.statSync(hashFilePath).size > 1024) {
      try {
        fs.copyFileSync(hashFilePath, shotFilePath);
      } catch (copyErr) {
        console.warn('Failed to sync shot file copy:', copyErr);
      }

      return NextResponse.json({
        success: true,
        shotId: targetShotId,
        cached: true,
        imageUrl: `/output/images/${hashFileName}`,
        remoteUrl: '',
      });
    }

    // 3. 未命中缓存或用户主动要求强制重绘：真实调用百炼 Wanx 2.1 API
    const remoteImageUrl = await generateWanxImage(
      guardedPrompt,
      config.dashscope.api_key,
      imageModel,
      imageSize
    );

    // 4. 将生成的首帧图持久化写入哈希缓存与镜头编号文件
    let displayUrl = `/output/images/${hashFileName}`;
    try {
      const imgRes = await fetch(remoteImageUrl);
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        fs.writeFileSync(hashFilePath, buf);
        fs.writeFileSync(shotFilePath, buf);
      }
    } catch (saveErr) {
      console.warn('Failed to save wanx image locally, fallback to remote url:', saveErr);
      displayUrl = remoteImageUrl;
    }

    return NextResponse.json({
      success: true,
      shotId: targetShotId,
      cached: false,
      imageUrl: displayUrl,
      remoteUrl: remoteImageUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Wanx generation failed' }, { status: 500 });
  }
}
