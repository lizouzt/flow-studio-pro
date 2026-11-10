import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';
import { uploadLocalFileToDashScopeOss } from '@/lib/dashscope';

/**
 * 稳健解析本地文件路径，兼容不同的工作目录层级
 */
function findLocalFile(fileRelativePath: string): string | null {
  const cleanPath = fileRelativePath.replace(/^\//, '').replace(/^output[\\/]/, '');
  const candidatePaths = [
    path.resolve(process.cwd(), fileRelativePath.replace(/^\//, '')),
    path.resolve(process.cwd(), 'output', cleanPath),
    path.resolve(process.cwd(), 'output', 'images', path.basename(fileRelativePath)),
    path.resolve(process.cwd(), 'story-studio-web', fileRelativePath.replace(/^\//, '')),
    path.resolve(process.cwd(), 'story-studio-web', 'output', 'images', path.basename(fileRelativePath)),
    path.resolve(process.cwd(), '..', fileRelativePath.replace(/^\//, '')),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { shotId, imageUrl, prompt, duration = 5 } = await req.json();
    const config = getStudioConfig();
    const apiKey = config.dashscope.api_key;

    if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
      return NextResponse.json(
        { error: '未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)。' },
        { status: 400 }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: '首帧图片 URL 不能为空' }, { status: 400 });
    }

    const videoModel = config.dashscope.video?.model || 'wanx2.1-i2v-plus';
    const rawResolution = config.dashscope.video?.resolution || '720p';
    const resolution = rawResolution.toLowerCase().includes('720') ? '720P' : rawResolution.toUpperCase();
    const promptExtend = config.dashscope.video?.prompt_extend ?? false;

    // 智能解析首帧图片地址：
    // 阿里云百炼 Wanx 图生视频 API 官方规范：
    // 1. 本地图片：直接转换为标准 Data URI (data:image/png;base64,{base64_data})，百炼官方原生支持，免去任何云端存储中转与防盗链风险！
    // 2. 远程公网图片：优先下载为 Buffer 转换为 Data URI 传入，若网络异常回退至原始公开 HTTP 链接；
    // 3. input 中严格只传官方声明参数 img_url，严禁传入任何多余键（如 image_url 会直接导致 Data Inspection 崩溃报 400）。
    let finalImageUrl = imageUrl.trim();
    const cleanUrlPath = finalImageUrl.split('?')[0];

    let localDiskFile: string | null = null;
    if (shotId) {
      localDiskFile = findLocalFile(`output/images/${shotId}.png`);
    }
    if (!localDiskFile) {
      localDiskFile = findLocalFile(cleanUrlPath);
    }

    if (localDiskFile) {
      console.log(`[AnimateWanx] 命中首帧本地文件 ${localDiskFile}，转换为官方标准 Base64 Data URI...`);
      const fileBuffer = fs.readFileSync(localDiskFile);
      const ext = path.extname(localDiskFile).toLowerCase();
      const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : (ext === '.webp' ? 'image/webp' : 'image/png');
      finalImageUrl = `data:${mime};base64,${fileBuffer.toString('base64')}`;
    } else if (finalImageUrl.startsWith('http://') || finalImageUrl.startsWith('https://')) {
      if (finalImageUrl.includes('localhost') || finalImageUrl.includes('127.0.0.1')) {
        try {
          const parsedUrl = new URL(finalImageUrl);
          const localFromUrl = findLocalFile(parsedUrl.pathname.split('?')[0]);
          if (localFromUrl) {
            const fileBuffer = fs.readFileSync(localFromUrl);
            const ext = path.extname(localFromUrl).toLowerCase();
            const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : (ext === '.webp' ? 'image/webp' : 'image/png');
            finalImageUrl = `data:${mime};base64,${fileBuffer.toString('base64')}`;
          } else {
            return NextResponse.json(
              { error: `本地开发服务器图片不存在，请先重新生成该分镜首帧图: ${finalImageUrl}` },
              { status: 400 }
            );
          }
        } catch {
          return NextResponse.json({ error: `无效的图片 URL: ${finalImageUrl}` }, { status: 400 });
        }
      } else {
        // 远程外部链接：以 GET 方式直接下载并转为 Data URI，确保百炼零跨域下载风险
        try {
          console.log(`[AnimateWanx] 尝试下载远程首帧图并转为 Data URI: ${finalImageUrl}`);
          const imgDownloadRes = await fetch(finalImageUrl);
          if (imgDownloadRes.ok) {
            const imgBuffer = Buffer.from(await imgDownloadRes.arrayBuffer());
            const targetSaveDir = path.resolve(process.cwd(), 'output', 'images');
            fs.mkdirSync(targetSaveDir, { recursive: true });
            const savedLocalPath = path.join(targetSaveDir, `${shotId || 'shot'}.png`);
            fs.writeFileSync(savedLocalPath, imgBuffer);
            finalImageUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;
          } else {
            console.warn(`[AnimateWanx] 远程下载返回 HTTP ${imgDownloadRes.status}，直接传递原始 URL`);
          }
        } catch (fetchErr: any) {
          console.warn('[AnimateWanx] 下载远程首帧图异常，回退传递原始 URL:', fetchErr?.message);
        }
      }
    } else if (!finalImageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: `找不到首帧图片对应的本地文件，请先点击分镜卡片生成首帧图: ${finalImageUrl}` },
        { status: 400 }
      );
    }

    // 1. 提交异步 I2V 图生视频任务至阿里云百炼 (官方标准端点为 video-synthesis)
    const submitPayload: Record<string, any> = {
      model: videoModel,
      input: {
        img_url: finalImageUrl,
        prompt: prompt || 'Cinematic lighting, high quality motion, photorealistic',
      },
      parameters: {
        resolution,
        prompt_extend: promptExtend,
      },
    };

    // wanx2.1-i2v-plus 固定 5 秒，不支持 duration 自定义参数；其他模型保留
    if (!videoModel.includes('wanx2.1-i2v-plus')) {
      submitPayload.parameters.duration = Math.max(3, Math.min(10, Math.round(duration)));
    }

    const submitRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitPayload),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      let errMsg = `百炼视频生成提交失败 (HTTP ${submitRes.status})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg += `: ${errJson.message || errJson.code || errText}`;
      } catch {
        errMsg += `: ${errText}`;
      }
      return NextResponse.json({ error: errMsg }, { status: submitRes.status });
    }

    const submitData = await submitRes.json();
    const taskId = submitData?.output?.task_id;
    if (!taskId) {
      return NextResponse.json({ error: '百炼未返回有效的 task_id' }, { status: 500 });
    }

    // 2. 轮询异步任务状态 (最高等待 240 秒，每 4 秒轮询一次)
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 4000));

      const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });

      if (pollRes.ok) {
        const pollData = await pollRes.json();
        const status = pollData?.output?.task_status;

        if (status === 'SUCCEEDED') {
          const videoUrl = pollData?.output?.video_url;
          if (videoUrl) {
            // 下载并将视频切片保存至 output/videos/
            const videoDir = path.resolve(process.cwd(), 'output', 'videos');
            fs.mkdirSync(videoDir, { recursive: true });

            const localFileName = `${shotId || 'shot'}.mp4`;
            const localFilePath = path.join(videoDir, localFileName);

            const vRes = await fetch(videoUrl);
            const buffer = await vRes.arrayBuffer();
            fs.writeFileSync(localFilePath, Buffer.from(buffer));

            return NextResponse.json({
              success: true,
              shotId,
              videoUrl: `/output/videos/${localFileName}`,
              remoteUrl: videoUrl,
            });
          }
        } else if (status === 'FAILED' || status === 'CANCELED') {
          return NextResponse.json(
            { error: `视频生成任务失败: ${pollData?.output?.message || '未知错误'}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: '视频生成任务排队超时，请稍后检查百炼控制台或重试。' },
      { status: 504 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Wanx I2V 动画调度异常' }, { status: 500 });
  }
}
