import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig } from '@/lib/config';

const HOOK_SYSTEM_PROMPT = `你是一位深谙短视频高完播率算法的顶级历史与人物故事编剧，掌握短视频口播的 Writing-DNA。
你的任务是：针对用户输入的短视频文案，重点重塑并重写文案前 3~5 秒的“黄金开头钩子 (Hook)”，使观众在前几秒产生强烈的停留动机。

【短视频黄金开头 Writing-DNA 准则】：
1. 极端反差 / 数字连排：用具体事实而非空洞形容词，例如“50骑直插5万敌阵”、“以九品芝麻官连斩三位封疆大吏”。
2. 现场动作对白 / 命运反常：瞬间拉进极具戏剧张力的具体处境或历史异常点，打破常规认知。
3. 绝不讲废话和套话：严禁以“在我国历史上”、“今天我们来讲讲”等水词开头；第一句话必须以具体的行动、数字或悬念爆破切入。
4. 语言节奏：句子短促有力、口播感强，适合朗读。

【输出规范】：
请直接返回重写后的整篇文案正文（保持原稿后续故事情节不缺失，但重点将开头第一段升级为震撼人心的爆款黄金钩子）。不要输出任何额外的问候语或解释说明。`;

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();
    if (!script || script.trim() === '') {
      return NextResponse.json({ error: '口播文稿不能为空' }, { status: 400 });
    }

    const config = getStudioConfig();
    const apiKey = config.dashscope.api_key;

    if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
      return NextResponse.json(
        { error: '未检测到有效的阿里云百炼 API Key。请先在右上角设置中配置 DASHSCOPE_API_KEY。' },
        { status: 400 }
      );
    }

    // 调用阿里云百炼 DashScope 通义千问 Qwen 模型接口
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: HOOK_SYSTEM_PROMPT },
          { role: 'user', content: `请将下面这篇短视频口播文案的前 3 秒开头进行爆款黄金钩子重塑，保持后续剧情逻辑不变：\n\n${script}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `百炼通义千问请求失败 (HTTP ${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg += `: ${errJson.error?.message || errJson.message || errText}`;
      } catch {
        errMsg += `: ${errText}`;
      }
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    const rewrittenScript = data?.choices?.[0]?.message?.content?.trim();

    if (!rewrittenScript) {
      return NextResponse.json({ error: '通义千问未返回有效的改写内容' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rewrittenScript,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '重写黄金钩子失败' }, { status: 500 });
  }
}
