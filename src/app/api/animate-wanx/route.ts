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
    // 1. 如果本地存在该图片（或通过文件名在 output/images 找到），优先上传至百炼临时 OSS (oss://...)
    // 2. 如果是远程公网 URL，进行快速可用性探测；若已失效则提示重新抽卡
    let finalImageUrl = imageUrl.trim();

    // 尝试寻找本地文件备份
    const localDiskFile = findLocalFile(finalImageUrl);
    if (localDiskFile) {
      console.log(`[AnimateWanx] 找到首帧本地文件 ${localDiskFile}，上传至百炼临时存储...`);
      finalImageUrl = await uploadLocalFileToDashScopeOss(localDiskFile, apiKey, videoModel);
    } else if (finalImageUrl.startsWith('http://') || finalImageUrl.startsWith('https://')) {
      if (finalImageUrl.includes('localhost') || finalImageUrl.includes('127.0.0.1')) {
        try {
          const parsedUrl = new URL(finalImageUrl);
          const localFromUrl = findLocalFile(parsedUrl.pathname);
          if (localFromUrl) {
            finalImageUrl = await uploadLocalFileToDashScopeOss(localFromUrl, apiKey, videoModel);
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
        // 远程外部链接：探测是否有效
        try {
          const probeRes = await fetch(finalImageUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          if (!probeRes.ok && probeRes.status !== 405) {
            return NextResponse.json(
              { error: `首帧图网络链接已失效 (HTTP ${probeRes.status})，请在分镜卡片重新点击“生图”生成首帧图。` },
              { status: 400 }
            );
          }
        } catch (probeErr: any) {
          console.warn('[AnimateWanx] 远程首帧图预检探测异常:', probeErr?.message);
        }
      }
    } else if (!finalImageUrl.startsWith('oss://')) {
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
        image_url: finalImageUrl,
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
