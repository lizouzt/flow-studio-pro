import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const projectData = await req.json();
    const config = getStudioConfig();

    // 1. 将待导出的 project 写入临时 JSON
    const tempDir = path.resolve(process.cwd(), 'output', 'projects');
    fs.mkdirSync(tempDir, { recursive: true });
    const projectJsonPath = path.join(tempDir, `project_${Date.now()}.json`);
    fs.writeFileSync(projectJsonPath, JSON.stringify(projectData, null, 2), 'utf-8');

    // 2. 检查剪映插件是否启用
    if (!config.plugins.jianying_draft.enabled) {
      return NextResponse.json({
        success: true,
        mode: 'fallback_json_only',
        projectJsonPath,
        message: '剪映插件未开启，已保存工程描述 JSON。'
      });
    }

    const pluginScript = path.resolve(process.cwd(), 'plugins', 'jianying-draft', 'export.py');
    const pythonCmd = config.plugins.jianying_draft.python_path || 'python';

    // 3. 执行 Python 导出插件
    return new Promise<NextResponse>((resolve) => {
      const child = spawn(pythonCmd, [pluginScript, projectJsonPath]);

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (d) => { stdoutData += d.toString(); });
      child.stderr.on('data', (d) => { stderrData += d.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          const match = stdoutData.match(/DRAFT_SUCCESS:\s*(.+)/);
          const draftPath = match ? match[1].trim() : '';
          resolve(NextResponse.json({
            success: true,
            mode: 'jianying_draft',
            draftPath: draftPath || '已写入默认剪映草稿目录',
            stdout: stdoutData,
          }));
        } else {
          // 优雅降级：如果 Python 报错（如未装 pyJianYingDraft），返回工程 JSON，不阻碍流程
          console.warn('Jianying plugin execution failed, returning fallback:', stderrData);
          resolve(NextResponse.json({
            success: true,
            mode: 'fallback_project_saved',
            projectJsonPath,
            warning: '剪映插件未成功运行（可能是未安装 pyJianYingDraft），已为您保存完整工程数据。',
            stderr: stderrData
          }));
        }
      });

      child.on('error', (err) => {
        console.warn('Cannot spawn python:', err);
        resolve(NextResponse.json({
          success: true,
          mode: 'fallback_project_saved',
          projectJsonPath,
          warning: '系统中未检测到可用的 Python 环境，已为您导出完整工程数据包。'
        }));
      });
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
