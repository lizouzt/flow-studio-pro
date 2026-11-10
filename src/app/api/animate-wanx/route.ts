import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';

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

/**
 * 单次查询异步任务状态并在生成完成时自动下载视频切片至本地
 */
async function queryTaskStatus(taskId: string, shotId?: string, apiKey?: string) {
  if (!apiKey) {
    const config = getStudioConfig();
    apiKey = config.dashscope.api_key;
  }
  if (!apiKey) {
    return NextResponse.json({ error: '未配置 DashScope API Key' }, { status: 400 });
  }

  const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
  });

  if (!pollRes.ok) {
    const errText = await pollRes.text();
    return NextResponse.json(
      { error: `查询任务状态失败 (HTTP ${pollRes.status}): ${errText}` },
      { status: pollRes.status }
    );
  }

  const pollData = await pollRes.json();
  const status = pollData?.output?.task_status;

  if (status === 'SUCCEEDED') {
    const videoUrl = pollData?.output?.video_url;
    if (videoUrl) {
      const videoDir = path.resolve(process.cwd(), 'output', 'videos');
      fs.mkdirSync(videoDir, { recursive: true });

      const localFileName = `${shotId || 'shot'}.mp4`;
      const localFilePath = path.join(videoDir, localFileName);

      // 若本地已存在且完整，直接返回
      if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1024) {
        return NextResponse.json({
          success: true,
          status: 'SUCCEEDED',
          taskId,
          shotId,
          videoUrl: `/output/videos/${localFileName}`,
          remoteUrl: videoUrl,
        });
      }

      // 下载远程视频并保存到本地
      try {
        console.log(`[AnimateWanx] 任务 ${taskId} 渲染成功，正在下载切片到本地: ${localFilePath}`);
        const vRes = await fetch(videoUrl);
        if (vRes.ok) {
          const buffer = await vRes.arrayBuffer();
          fs.writeFileSync(localFilePath, Buffer.from(buffer));
        } else {
          console.warn(`[AnimateWanx] 视频下载返回 HTTP ${vRes.status}，仍返回远端链接备用`);
        }
      } catch (dlErr: any) {
        console.warn(`[AnimateWanx] 下载远程视频至本地异常:`, dlErr.message);
      }

      return NextResponse.json({
        success: true,
        status: 'SUCCEEDED',
        taskId,
        shotId,
        videoUrl: `/output/videos/${localFileName}`,
        remoteUrl: videoUrl,
      });
    }
  } else if (status === 'FAILED' || status === 'CANCELED') {
    return NextResponse.json(
      {
        success: false,
        status: status,
        taskId,
        shotId,
        error: pollData?.output?.message || pollData?.output?.code || '视频生成任务失败',
      },
      { status: 500 }
    );
  }

  // 任务仍处于排队或渲染状态 (PENDING 或 RUNNING)
  return NextResponse.json({
    success: true,
    status: status || 'RUNNING',
    taskId,
    shotId,
  });
}

/**
 * GET: 异步单次查询任务进度 (轻量耗时 < 200ms)
 */
export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('taskId');
    const shotId = req.nextUrl.searchParams.get('shotId') || undefined;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId 参数不能为空' }, { status: 400 });
    }

    const config = getStudioConfig();
    const apiKey = config.dashscope.api_key;
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 DashScope API Key' }, { status: 400 });
    }

    return await queryTaskStatus(taskId, shotId, apiKey);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '查询视频生成任务状态异常' }, { status: 500 });
  }
}

/**
 * POST: 提交视频生成任务或查询任务进度
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, taskId, shotId, imageUrl, prompt, duration = 5 } = body;
    const config = getStudioConfig();
    const apiKey = config.dashscope.api_key;

    if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
      return NextResponse.json(
        { error: '未配置有效的阿里云百炼 API Key (DASHSCOPE_API_KEY)。' },
        { status: 400 }
      );
    }

    // 1. 若为查询请求，直接单次查询
    if (action === 'query' || (taskId && !imageUrl)) {
      return await queryTaskStatus(taskId, shotId, apiKey);
    }

    // 2. 否则为创建/提交生成任务
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: '首帧图片 URL 不能为空' }, { status: 400 });
    }

    const videoModel = config.dashscope.video?.model || 'wanx2.1-i2v-plus';
    const rawResolution = config.dashscope.video?.resolution || '720p';
    const resolution = rawResolution.toLowerCase().includes('720') ? '720P' : rawResolution.toUpperCase();
    const promptExtend = config.dashscope.video?.prompt_extend ?? false;

    // 智能解析首帧图片地址为标准 Base64 Data URI
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

    // 提交异步 I2V 图生视频任务至阿里云百炼 (官方标准端点为 video-synthesis)
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

    console.log(`[AnimateWanx] 正在向百炼提交视频生成任务 (${videoModel})...`);
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
    const createdTaskId = submitData?.output?.task_id;
    if (!createdTaskId) {
      return NextResponse.json({ error: '百炼未返回有效的 task_id' }, { status: 500 });
    }

    console.log(`[AnimateWanx] 任务提交成功，TaskId: ${createdTaskId}，耗时约1秒，即刻响应客户端`);

    // 立即响应前端客户端，耗时 < 1.5 秒，彻底解决浏览器/Node 长连接 504 超时问题
    return NextResponse.json({
      success: true,
      status: 'PENDING',
      taskId: createdTaskId,
      shotId,
      message: '视频生成任务已成功提交至云端排队，请通过轮询接口获取结果',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Wanx I2V 动画调度异常' }, { status: 500 });
  }
}
