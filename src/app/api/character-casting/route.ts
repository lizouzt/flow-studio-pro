import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getStudioConfig } from '@/lib/config';
import { generateWanxImage } from '@/lib/dashscope';
import { VisualContextProfile } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'generate', visualProfile, customImageBase64 } = body;
    const config = getStudioConfig();
    const apiKey = config.dashscope.api_key;

    const charDir = path.resolve(process.cwd(), 'output', 'character');
    fs.mkdirSync(charDir, { recursive: true });
    const benchmarkPath = path.join(charDir, 'protagonist_benchmark.png');

    // 1. 上传自定义/真人照片作为定妆照
    if (action === 'upload') {
      if (!customImageBase64 || typeof customImageBase64 !== 'string') {
        return NextResponse.json({ error: '上传的图片数据不能为空' }, { status: 400 });
      }
      const base64Data = customImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(benchmarkPath, buffer);

      return NextResponse.json({
        success: true,
        action: 'upload',
        imageUrl: `/output/character/protagonist_benchmark.png?t=${Date.now()}`,
      });
    }

    // 2. AI 自动生成/重新抽卡主角标准定妆照
    if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx')) {
      return NextResponse.json({ error: '请先在右上角配置有效的 API 密钥' }, { status: 400 });
    }

    const profile: VisualContextProfile = visualProfile || {
      era_setting: '当代写实叙事',
      character_anchor: '故事核心主角，专注神态，标志性面容',
      attire_props: '经典得体服饰',
      art_style: '高品质人像摄影质感，电影级柔和光影，9:16竖屏构图',
      positive_anchors: ['清晰面部特征', '真实皮肤质感', '8k高清肖像'],
      negative_guardrails: ['模糊', '画风错乱', '动漫二次元变形', '遮挡面部'],
    };

    // 构造极度专注人像正面特征的标准定妆 Prompt (避免背景和极端动态干扰面部特征)
    const benchmarkPrompt = `【顶级影视角色标准定妆概念照】：主角人设核心特征：${profile.character_anchor}。身着经典代表服饰：${profile.attire_props}。时代环境氛围：${profile.era_setting}。构图与光影：正面偏半侧中近景半身像，极其均匀柔和的人物肖像摄影布光，毫无遮挡且极其清晰锐利的面部五官结构与标志性发型细节，自然真实通透的皮肤纹理与神态，干净典雅的中性景深背景，9:16竖屏短视频构图，电影级高清画报质感，${profile.positive_anchors.join(', ')}。(严禁面部扭曲变形、严禁遮挡五官、严禁低分辨率、严禁${profile.negative_guardrails.join('、严禁')})`;

    const imageModel = config.dashscope.image?.model || 'wanx2.1-t2i-turbo';
    const remoteUrl = await generateWanxImage(
      benchmarkPrompt,
      apiKey,
      imageModel,
      '720*1280'
    );

    // 将定妆照落盘到 output/character/protagonist_benchmark.png
    let displayUrl = `/output/character/protagonist_benchmark.png?t=${Date.now()}`;
    try {
      const res = await fetch(remoteUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        fs.writeFileSync(benchmarkPath, Buffer.from(arrayBuf));
      }
    } catch (saveErr) {
      console.warn('[CharacterCasting] 本地保存定妆照失败，使用远程链接:', saveErr);
      displayUrl = remoteUrl;
    }

    return NextResponse.json({
      success: true,
      action: 'generate',
      imageUrl: displayUrl,
      remoteUrl,
      benchmarkPrompt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '主角定妆生成失败' }, { status: 500 });
  }
}
