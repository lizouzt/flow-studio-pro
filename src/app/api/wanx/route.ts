import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getStudioConfig } from '@/lib/config';
import { generateWanxImage } from '@/lib/dashscope';
import { applyAdaptiveGuardrail } from '@/lib/visualDirector';

export async function POST(req: NextRequest) {
  try {
    const { prompt, shotId, visualProfile, force = false, referenceImage, characterBenchmark } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const config = getStudioConfig();
    const imageModel = config.dashscope?.image?.model || 'wan2.7-image';
    const imageSize = config.dashscope?.image?.size || '720*1280';

    // 智能定位并读取主角定妆基准图 (Actor Casting Benchmark)
    const benchmarkDiskPath = path.resolve(process.cwd(), 'output', 'character', 'protagonist_benchmark.png');
    let benchmarkDataUri: string | null = null;
    let hasBenchmark = false;

    // 1. 优先从传入的 referenceImage / characterBenchmark 读取
    if (referenceImage && typeof referenceImage === 'string' && referenceImage.length > 30) {
      benchmarkDataUri = referenceImage;
      hasBenchmark = true;
    } else if (characterBenchmark?.portrait_image && typeof characterBenchmark.portrait_image === 'string') {
      const cleanPath = characterBenchmark.portrait_image.split('?')[0];
      const candidatePaths = [
        path.resolve(process.cwd(), cleanPath.replace(/^\//, '')),
        path.resolve(process.cwd(), 'output', cleanPath.replace(/^\/?output[\\/]/, '')),
        benchmarkDiskPath,
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p) && fs.statSync(p).size > 1024) {
          const buffer = fs.readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : (ext === '.webp' ? 'image/webp' : 'image/png');
          benchmarkDataUri = `data:${mime};base64,${buffer.toString('base64')}`;
          hasBenchmark = true;
          break;
        }
      }
      if (!benchmarkDataUri && characterBenchmark.portrait_remote_url) {
        benchmarkDataUri = characterBenchmark.portrait_remote_url;
        hasBenchmark = true;
      }
    }

    // 2. 检查本地磁盘定妆照文件 output/character/protagonist_benchmark.png
    if (!benchmarkDataUri && fs.existsSync(benchmarkDiskPath) && fs.statSync(benchmarkDiskPath).size > 1024) {
      const buffer = fs.readFileSync(benchmarkDiskPath);
      benchmarkDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
      hasBenchmark = true;
    }

    // 自适应防偏网：根据当前提取出的视觉档案自适应注入正向特征与时代冲突负向排除
    let basePrompt = prompt;
    if (hasBenchmark) {
      // 强力注入主角锁脸锚定指令
      basePrompt = `【主角绝对一致性锁脸】：画面中主体人物的面部五官结构、发型与年龄感，必须绝对严格对照参考图中的同一个人，严禁改变长相！${basePrompt}`;
    }
    const guardedPrompt = applyAdaptiveGuardrail(basePrompt, visualProfile);

    // 3. 基于“提示词全文 + 模型 + 尺寸 + 定妆图哈希”计算精准内容指纹 (Content-Hash)
    let benchmarkHash = '';
    if (hasBenchmark && benchmarkDataUri) {
      // 对定妆图前 10KB 计算指纹，当定妆换角时自动失效旧分镜缓存
      benchmarkHash = crypto.createHash('md5').update(benchmarkDataUri.slice(0, 10240)).digest('hex').slice(0, 8);
    }

    const promptHash = crypto
      .createHash('sha256')
      .update(`${guardedPrompt.trim()}_${imageModel}_${imageSize}_ref:${benchmarkHash}`)
      .digest('hex')
      .slice(0, 16);

    const imgDir = path.resolve(process.cwd(), 'output', 'images');
    fs.mkdirSync(imgDir, { recursive: true });

    const hashFileName = `frame_${promptHash}.png`;
    const hashFilePath = path.join(imgDir, hashFileName);
    const targetShotId = shotId || `shot_${Date.now()}`;
    const shotFilePath = path.join(imgDir, `${targetShotId}.png`);

    // 4. 检查内容哈希缓存命中：若未强制重绘且本地已存在有效图像，直接 0 秒极速命中！
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

    // 5. 未命中缓存或强制重绘：真实调用百炼 Wan 2.7 多模态生成接口（真实吃入定妆参考图）
    console.log(`[Wanx Image] 正在调用 ${imageModel} 生图，定妆参考图已激活: ${hasBenchmark}`);
    const remoteImageUrl = await generateWanxImage(
      guardedPrompt,
      config.dashscope.api_key,
      imageModel,
      imageSize,
      benchmarkDataUri
    );

    // 6. 将生成的首帧图持久化写入哈希缓存与镜头编号文件
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
