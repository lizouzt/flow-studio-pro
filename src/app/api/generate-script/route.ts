import { NextRequest, NextResponse } from 'next/server';
import { getStudioConfig } from '@/lib/config';

// 历史叙事风 Writing-DNA 系统提示词 (基于原版 57 篇爆款语料拆解)
const HISTORICAL_NARRATIVE_PROMPT = `你是一位精通历史口播短视频的王牌编剧，严格遵循《历史口播 Writing-DNA》规范：
1. 【核心主线】：把历史中值得追问的一件事讲透。先让观众看见一个处境，再解释里面的难处与代价，拒绝流水线生平账本。
2. 【开头钩子 (前 3 秒)】：抛出具体历史反常、数字连排或命运反差，绝不使用“在我国历史上”、“今天讲讲”等废话。
3. 【推进节奏】：用谈话距离讲具体行动，多用短句，长短交替（单句平均 20~25 字）。把“权力转移”写成谁能调兵、任人；把“处境艰难”写成眼前可选的两条路及各自代价。
4. 【结尾落点】：严密兑现开头的悬念，拒绝空泛的感叹与口号式升华，用历史真实的余音震荡观众。`;

// 传奇人物故事风 Writing-DNA 系统提示词 (基于原版 300+ 篇玉玲女性/传奇语料拆解)
const CHARACTER_STORY_PROMPT = `你是一位专注于真实传奇人物故事的头部短视频创作者，严格遵循《玉玲人物传奇 Writing-DNA》规范：
1. 【情绪抛物线】：严格遵循「黄金钩子先行 → 巅峰数字展现 → 命运逆转 (可谁也没想到) → 磨难场景刻画 → 灵魂金句收尾」。
2. 【开头钩子】：数字密集轰炸或极端境遇反差（如“22岁、50人、生擒叛将”、“身家千万到沦落囚徒”）。
3. 【情感锚点】：富有感染力的谈话语气（“您说……这怎么会……”），精准的数字节点与时间刻度。
4. 【金句收尾】：结尾必须凝结一句震颤人心的点睛金句，让观众回味无穷、主动转发点赞。`;

export async function POST(req: NextRequest) {
  try {
    const { topic, style = 'historical-narrative', targetWordCount = 1000, action = 'generate' } = await req.json();

    const config = getStudioConfig();
    const apiKey = config.dashscope.api_key;

    if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
      return NextResponse.json(
        { error: '未检测到有效的阿里云百炼 API Key。请先在右上角设置中配置 DASHSCOPE_API_KEY。' },
        { status: 400 }
      );
    }

    let systemPrompt = style === 'yuling-characterstory' ? CHARACTER_STORY_PROMPT : HISTORICAL_NARRATIVE_PROMPT;
    let userPrompt = '';

    if (action === 'oral-polish') {
      // 口语化 / 去 AI 味
      systemPrompt = `你是一位顶级短视频配音导演，擅长将书面语改造为自然、透气、长短句结合的真人短视频口播文案。
改造要求：
1. 消除书面腔与陈旧翻译腔，把大词化为口头交流的大白话；
2. 增加短视频呼吸节奏感，多用短句，句尾带劲；
3. 保留全部史实与核心数字，字数与原稿相当；
4. 直接输出改写后的完整文案正文，不要输出任何多余废话。`;
      userPrompt = `请将以下文案进行深度口播化改写，彻底去除 AI 味与书面腔：\n\n${topic}`;
    } else {
      // 从 0 到 1 生成全文
      if (!topic || topic.trim() === '') {
        return NextResponse.json({ error: '请提供创作题材或人物主题' }, { status: 400 });
      }

      userPrompt = `【创作主题】：${topic}
【风格要求】：${style === 'yuling-characterstory' ? '玉玲人物传奇故事风 (情绪起伏、巅峰到磨难、金句收尾)' : '历史叙事风 (追问反常、具体行动、严密因果)'}
【字数目标】：严格控制在约 ${targetWordCount} 字 (正负 10% 范围内)
【格式要求】：直接输出适合朗读的短视频逐字稿正文，段落之间空一行，不要包含“标题：”、“解说：”等格式标签或任何前言后语。`;
    }

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.75,
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
    const generatedScript = data?.choices?.[0]?.message?.content?.trim();

    if (!generatedScript) {
      return NextResponse.json({ error: '通义千问未返回有效的文本生成内容' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      script: generatedScript,
      wordCount: generatedScript.replace(/\s+/g, '').length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '生成口播文稿失败' }, { status: 500 });
  }
}
