import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedFile = searchParams.get('file');
    const projectsDir = path.resolve(process.cwd(), 'output', 'projects');

    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    // 1. 若指定文件名，读取详情
    if (requestedFile) {
      const safeName = path.basename(requestedFile);
      const filePath = path.join(projectsDir, safeName);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: '工程文件不存在' }, { status: 404 });
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const projectData = JSON.parse(content);

      // 尝试自动寻找关联的最佳音频
      let matchedAudio = projectData.audioPath || '';
      if (!matchedAudio) {
        // 从 output/audio 寻找时长最接近的音频
        try {
          const audioDir = path.resolve(process.cwd(), 'output', 'audio');
          if (fs.existsSync(audioDir)) {
            const lastShot = projectData.shots?.[projectData.shots.length - 1];
            const targetDuration = lastShot?.target_end_sec || 0;

            const files = fs.readdirSync(audioDir);
            for (const f of files) {
              if (f.endsWith('.meta.json')) {
                const meta = JSON.parse(fs.readFileSync(path.join(audioDir, f), 'utf-8'));
                if (Math.abs((meta.durationSec || 0) - targetDuration) < 0.5) {
                  matchedAudio = `/output/audio/${meta.fileName}`;
                  break;
                }
              }
            }
          }
        } catch {}
      }

      return NextResponse.json({
        success: true,
        project: {
          ...projectData,
          matchedAudioPath: matchedAudio,
        },
      });
    }

    // 2. 否则列出所有已保存的项目
    const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.json'));
    const list = files.map((fileName) => {
      const filePath = path.join(projectsDir, fileName);
      const stat = fs.statSync(filePath);
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const shots = raw.shots || [];
        const readyVideos = shots.filter((s: any) => {
          if (!s.rendered_video_path) return false;
          const localVid = path.resolve(process.cwd(), s.rendered_video_path.replace(/^\//, ''));
          return fs.existsSync(localVid);
        }).length;

        const totalDuration = shots.reduce((acc: number, s: any) => acc + (parseFloat(s.target_duration_sec) || 0), 0);

        return {
          fileName,
          projectName: raw.project_name || fileName.replace('.json', ''),
          shotCount: shots.length,
          readyVideoCount: readyVideos,
          totalDurationSec: Math.round(totalDuration * 10) / 10,
          updatedAt: stat.mtimeMs,
          allVideosReady: shots.length > 0 && readyVideos === shots.length,
        };
      } catch {
        return {
          fileName,
          projectName: fileName,
          shotCount: 0,
          readyVideoCount: 0,
          totalDurationSec: 0,
          updatedAt: stat.mtimeMs,
          allVideosReady: false,
        };
      }
    });

    list.sort((a, b) => b.updatedAt - a.updatedAt);
    return NextResponse.json({ success: true, projects: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '获取项目失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, shots, script, audioPath, visualProfile, characterBenchmark } = body;

    if (!shots || !Array.isArray(shots)) {
      return NextResponse.json({ error: '无效的分镜数据' }, { status: 400 });
    }

    const projectsDir = path.resolve(process.cwd(), 'output', 'projects');
    fs.mkdirSync(projectsDir, { recursive: true });

    const safeName = (projectName || 'project').replace(/[^\w\u4e00-\u9fa5_-]/g, '_');
    const fileName = `project_${Date.now()}.json`;
    const filePath = path.join(projectsDir, fileName);

    const projectPayload = {
      project_name: safeName,
      created_at: new Date().toISOString(),
      script,
      audioPath,
      visualProfile,
      characterBenchmark,
      shots,
    };

    fs.writeFileSync(filePath, JSON.stringify(projectPayload, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      fileName,
      filePath,
      message: '项目存档已成功保存',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '保存项目失败' }, { status: 500 });
  }
}
