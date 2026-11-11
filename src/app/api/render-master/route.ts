import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const { shots, audioPath, enableSpeedRamp = false, enableOpticalFlow = true } = await req.json();

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: '分镜列表不能为空' }, { status: 400 });
    }

    const config = getStudioConfig();
    const pythonCmd = config.plugins.jianying_draft.python_path || 'python';
    const engineScript = path.resolve(process.cwd(), 'plugins', 'media-engine', 'engine.py');

    const outputDir = path.resolve(process.cwd(), 'output', 'master');
    const syncedDir = path.resolve(outputDir, 'synced_clips');
    fs.mkdirSync(syncedDir, { recursive: true });

    // 1. 逐镜头通过光流插值与动感曲线处理切片
    const processedClips: string[] = [];
    let totalTargetDuration = 0;

    for (const shot of shots) {
      const shotId = shot.shot_id;
      const targetDur = parseFloat(shot.target_duration_sec) || 5.0;
      totalTargetDuration += targetDur;

      // 确定输入源：优先使用真实渲染的视频，否则使用图片做降级
      let inputMedia = shot.rendered_video_path 
        ? path.resolve(process.cwd(), shot.rendered_video_path.replace(/^\//, ''))
        : '';
      
      const outClip = path.join(syncedDir, `${shotId}_synced.mp4`);

      // 若有视频源，执行光流对齐或 Speed Ramp
      if (inputMedia && fs.existsSync(inputMedia)) {
        if (enableSpeedRamp) {
          // 运行非线性曲线动感变速
          await runPythonAsync(pythonCmd, [
            engineScript, 'ramp',
            '--input', inputMedia,
            '--output', outClip,
            '--hit', '0.5'
          ]);
        } else if (enableOpticalFlow) {
          // 运行光流对齐
          await runPythonAsync(pythonCmd, [
            engineScript, 'align',
            '--input', inputMedia,
            '--output', outClip,
            '--dur', targetDur.toString()
          ]);
        } else {
          // 简单原样复制
          fs.copyFileSync(inputMedia, outClip);
        }
        processedClips.push(outClip);
      } else {
        // 若缺少视频，记录需要剪切排布
        console.warn(`Shot ${shotId} has no local video, skipping for master concat`);
      }
    }

    if (processedClips.length === 0) {
      return NextResponse.json(
        { error: '没有找到任何可用的本地视频切片进行母版压制，请先通过百炼一键动画或回填切片。' },
        { status: 400 }
      );
    }

    // 2. 生成 concat manifest 清单
    const manifestPath = path.join(outputDir, 'concat_list.txt');
    const manifestContent = processedClips.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(manifestPath, manifestContent, 'utf-8');

    // 3. 最终母版合成与 Lanczos 升频
    const realAudio = audioPath
      ? path.resolve(process.cwd(), audioPath.replace(/^\//, ''))
      : '';
    const masterMp4 = path.join(outputDir, `final_master_1080p_${Date.now()}.mp4`);

    await runPythonAsync(pythonCmd, [
      engineScript, 'master',
      '--manifest', manifestPath,
      '--audio', realAudio && fs.existsSync(realAudio) ? realAudio : processedClips[0],
      '--out', masterMp4,
      '--dur', totalTargetDuration.toString()
    ]);

    return NextResponse.json({
      success: true,
      masterVideoUrl: `/output/master/${path.basename(masterMp4)}`,
      masterPath: masterMp4,
      totalDurationSec: totalTargetDuration,
      clipCount: processedClips.length,
      spec: '1080x1920 (9:16) Lanczos 60fps · BT.709'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || '母版渲染执行异常' }, { status: 500 });
  }
}

function getEnhancedEnv(): NodeJS.ProcessEnv {
  const currentPath = process.env.PATH || '';
  const wingetFFmpegBin = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WinGet',
    'Packages',
    'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe',
    'ffmpeg-9.0.2-full_build',
    'bin'
  );

  if (fs.existsSync(path.join(wingetFFmpegBin, 'ffmpeg.exe')) && !currentPath.includes(wingetFFmpegBin)) {
    return {
      ...process.env,
      PATH: `${wingetFFmpegBin};${currentPath}`,
    };
  }
  return process.env;
}

function runPythonAsync(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { env: getEnhancedEnv() });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err || out || `Process exited with code ${code}`));
    });
    child.on('error', (e) => reject(e));
  });
}
