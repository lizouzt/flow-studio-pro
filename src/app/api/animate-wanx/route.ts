import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig } from '@/lib/config';

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

    if (!imageUrl) {
      return NextResponse.json({ error: '首帧图片 URL 不能为空' }, { status: 400 });
    }

    // 1. 提交异步 I2V 图生视频任务至阿里云百炼
    const submitRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'wanx2.1-i2v-plus',
        input: {
          img_url: imageUrl,
        },
        parameters: {
          prompt: prompt || 'Cinematic lighting, high quality motion, photorealistic',
          duration: Math.max(3, Math.min(10, Math.round(duration))),
          resolution: '720p',
          prompt_extend: false,
        },
      }),
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

    // 2. 轮询异步任务状态 (最高等待 120 秒)
    const maxAttempts = 30;
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
            const fs = await import('fs');
            const path = await import('path');
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
