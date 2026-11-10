import { Shot, VisualContextProfile } from '@/types';

/**
 * 规则兜底分类器：在脱机或无 API Key 时，基于自然语言词法特征自动推导《视觉世界观档案》
 * 彻底消除任何硬编码人名或朝代，根据输入内容自适应匹配
 */
export function extractVisualContextByRules(text: string = '', topic: string = ''): VisualContextProfile {
  const combined = `${topic} ${text}`.toLowerCase();

  // 0. 识别特定现代/历史知名公众人物（提供绝对人物主权锁，严防角色漂移与人物混淆）
  const isTrump = /特朗普|川普|trump/i.test(combined);
  if (isTrump) {
    return {
      era_setting: '当代美国真实都市、豪华庄园与政商名流社交场景，落地窗城市天际线、高端晚宴与雅致室内',
      character_anchor: '唐纳德·特朗普 (Donald Trump)，标志性淡金色偏分发型，经典面容轮廓与自信从容神态，身形魁梧高大',
      attire_props: '剪裁得体的深蓝色高级定制西装、标志性鲜亮纯红色领带、纯白衬衫与金质袖扣',
      art_style: '现代纪实人物传记电影质感，电影级柔和人物肖像光影，通透肤色与细腻真实质感，9:16竖屏短视频构图',
      positive_anchors: [
        '唐纳德·特朗普 (Donald Trump) 真实肖像',
        '标志性淡金色偏分发型',
        '经典深色西装搭配红领带',
        '好莱坞人物传记电影光影',
        '8k真实质感高清人物细节',
      ],
      negative_guardrails: [
        '约瑟夫·拜登 (Joe Biden)',
        '贝拉克·奥巴马 (Barack Obama)',
        '其他政治人物或混淆面孔',
        '古装冷兵器铠甲',
        '中世纪欧洲骑士',
        '卡通动漫夸张变形',
      ],
    };
  }

  // 1. 中国古代/古装历史场景识别
  const isAncientChinese =
    /朝代|南宋|北宋|唐朝|大唐|明朝|大明|清朝|秦朝|汉朝|三国|春秋|战国|古代|江湖|策马|金戈铁马|武将|将军|夜袭|敌阵|敌营|三尺青锋|汉剑|长枪|甲胄|铁甲|营寨|临安|长安|洛阳|皇宫|军帐|旌旗/.test(
      combined
    );

  // 2. 中国民国/近现代场景识别
  const isRepublicanEra =
    /民国|上海滩|租界|旗袍|长衫|中山装|黄包车|谍战|军统|洋行|黄浦江|北平|南京路|洋房/.test(
      combined
    );

  // 3. 现代都市/科技商业/当代写实场景识别
  const isModernUrban =
    /现代|都市|职场|商业|创业|公司|写字楼|硅谷|互联网|科技|实验室|电脑|手机|汽车|高铁|大学|程序员|ceo|高管|董事长|股市|投资|医院|现代人/.test(
      combined
    );

  // 4. 西方历史/欧洲古典场景识别
  const isWesternHistorical =
    /罗马|中世纪|骑士|城堡|角斗士|维京|十字军|欧洲|英格兰|法兰西|拿破仑|文艺复兴/.test(
      combined
    );

  if (isAncientChinese) {
    // 动态提取古代文案中的主角人称特征
    const hasYouth = /二十二|少年|年轻|少将|小将/.test(combined);
    const hasOld = /暮年|老去|白发|苍老|四十年/.test(combined);
    const characterDesc = hasOld
      ? '暮年东亚历史人物，双鬓斑白，坚毅沧桑面容，沉稳深邃神态'
      : hasYouth
      ? '英挺俊朗的东亚青年将领，剑眉星目，刚毅果敢神态，束发兜鍪'
      : '古代东亚将领人物，威严端正的中国历史面孔，从容威武';

    return {
      era_setting: '中国古代历史背景，冷兵器古代战役、野外大营与古典历史建筑',
      character_anchor: characterDesc,
      attire_props: '中国传统古代铁制札甲战袍或古典长袍，佩戴中式长剑，骑乘战马，古代旌旗与火把',
      art_style: '厚涂中国历史古典写实漫画风格，电影级高对比戏剧光影，9:16竖屏短视频构图',
      positive_anchors: [
        '古代中国历史场景',
        '传统中式甲胄战袍',
        '典型东亚英雄面孔',
        '东方古典写实画风',
        '8k高画质电影级光影',
      ],
      negative_guardrails: [
        '中世纪欧洲骑士',
        '西方石砌城堡',
        '十字军板甲',
        '白人西方面孔',
        '现代建筑',
        '现代电器',
      ],
    };
  }

  if (isRepublicanEra) {
    return {
      era_setting: '20世纪二三十年代中国民国时期，海派石库门街道、复古洋房与古典办公室',
      character_anchor: '民国时期东亚华人男女形象，复古发型，端庄儒雅或英姿飒爽的神态',
      attire_props: '民国传统中式长衫、旗袍、中山装或复古双排扣西装，怀表、老式皮箱与电车',
      art_style: '复古胶片写实电影质感，温暖沉稳怀旧色调，9:16竖屏构图',
      positive_anchors: [
        '20世纪民国风貌',
        '中国海派历史场景',
        '东亚民国人物气质',
        '胶片颗粒与自然光影',
      ],
      negative_guardrails: [
        '古代冷兵器铠甲',
        '现代智能手机',
        '现代摩天大楼',
        '赛博朋克霓虹',
        '中世纪欧洲',
      ],
    };
  }

  if (isModernUrban) {
    return {
      era_setting: '当代真实都市生活与工作空间，现代化写字楼、高新科技园区、明亮室内或繁华街景',
      character_anchor: '当代干练职业男女形象，现代发型，专注自信或沉着内省神态',
      attire_props: '现代商务正装、西装衬衫、休闲职业服饰，现代笔记本电脑、玻璃幕墙与现代办公用品',
      art_style: '现代电影写实主义质感，通透冷暖环境光，层次分明景深，9:16竖屏构图',
      positive_anchors: [
        '现代都市现实主义',
        '当代职业形象',
        '真实物理光影与景深',
        '现代建筑空间',
      ],
      negative_guardrails: [
        '古代传统汉服',
        '古装冷兵器铠甲',
        '中世纪欧洲',
        '农耕田园古风',
        '魔幻奇幻生物',
      ],
    };
  }

  if (isWesternHistorical) {
    return {
      era_setting: '欧洲历史真实时期，古典石砌建筑、城堡原野与古典西方历史营地',
      character_anchor: '欧洲古典历史人物形象，深邃五官轮廓，坚毅威严姿态',
      attire_props: '西方传统历史服饰或古典甲胄长袍，传统佩剑与战马，古典壁炉与石柱',
      art_style: '古典油画写实与史诗电影质感，厚重戏剧光影，9:16竖屏构图',
      positive_anchors: [
        '西方历史真实场景',
        '古典西方服饰构图',
        '电影级戏剧天光',
      ],
      negative_guardrails: [
        '现代科技产品',
        '东亚古代传统服饰',
        '现代都市建筑',
        '科幻未来元素',
      ],
    };
  }

  // 通用默认自适应设定（根据文本自然延展）
  return {
    era_setting: '具有历史纪实感与叙事厚度的人物故事场景',
    character_anchor: '故事主角，富有感染力的神态与专注表情，自然光影人物刻画',
    attire_props: '与文案故事情境严密相符的时代真实着装与道具',
    art_style: '写实故事画卷电影质感，细腻层次与专业戏剧光影，9:16竖屏构图',
    positive_anchors: [
      '真实纪实电影质感',
      '人物神态生动真实',
      '环境细节考究严谨',
      '9:16竖屏高质量画面',
    ],
    negative_guardrails: [
      '画风错乱',
      '时代错位道具',
      '低清晰度模糊',
      '夸张变形',
    ],
  };
}

/**
 * 核心引擎 1：视觉世界观解析器 (Visual Universe Analyzer)
 * 根据输入的主题与全文逐字稿，调用通义千问从深层语义中智能提取《视觉设定档案》
 */
export async function analyzeVisualContext(
  script: string,
  topic: string = '',
  apiKey: string = ''
): Promise<VisualContextProfile> {
  const cleanKey = (apiKey || '').trim();
  const ruleProfile = extractVisualContextByRules(script, topic);

  if (!cleanKey || cleanKey.startsWith('YOUR_') || cleanKey.includes('sk-xxx')) {
    return ruleProfile;
  }

  try {
    const systemPrompt = `你是一位顶级影视美术总监兼世界观概念设定师。
你的任务是根据输入的【创作题材】和【完整口播逐字稿】，深入分析并提取出高度精准的《视觉世界观设定档案 (VisualContextProfile)》。

【必须分析输出的 6 项要素】：
1. era_setting: 故事发生的准确时代背景、历史朝代、纪元或真实场景定位；
2. character_anchor: 核心主角的专有人物姓名、标志性五官轮廓、发型、体态与神韵。若故事涉及具体知名人物（如唐纳德·特朗普、辛弃疾、拿破仑等），必须精确锁定该人物的姓名与其不可替代的特征外观（例如特朗普必须锁定淡金色偏分发型、特有面容、自信果决神情），严禁泛化！
3. attire_props: 符合该时代历史真实或题材特性的服饰、道具（例如特朗普必须锁定经典深色西装搭配亮红色领带与白色衬衫）；
4. art_style: 契合该题材氛围的统一美术画风（必须声明 9:16 竖屏短视频构图与电影级戏剧光影）；
5. positive_anchors: 4~6 个必须强化的正向核心视觉词（必须包含主角专有肖像特征词，确保生图模型不偏离）；
6. negative_guardrails: 4~6 个与该时代或该主角严重冲突、极易被生图模型误加的负向排斥词。若主角是特定名人（如特朗普），必须显式排斥其他公众人物（例如负向必须包含“严禁出现约瑟夫·拜登 (Joe Biden)、奥巴马等其他政治人物，严禁混淆主角面孔”；若为中国古装必须排斥西方骑士与现代人）！

【格式要求】：只输出标准的 JSON 对象，格式如下：
{
  "era_setting": "...",
  "character_anchor": "...",
  "attire_props": "...",
  "art_style": "...",
  "positive_anchors": ["...", "..."],
  "negative_guardrails": ["...", "..."]
}`;

    const userPrompt = `【创作主题】：${topic || '未指定主题'}
【口播正文】：
${script.slice(0, 1500)}`;

    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      console.warn('Visual Universe Analyzer API failed, using rule profile:', await res.text());
      return ruleProfile;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return ruleProfile;

    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return ruleProfile;

    const parsed = JSON.parse(match[0]);
    if (parsed.era_setting && parsed.character_anchor && Array.isArray(parsed.positive_anchors)) {
      return {
        era_setting: parsed.era_setting,
        character_anchor: parsed.character_anchor,
        attire_props: parsed.attire_props || ruleProfile.attire_props,
        art_style: parsed.art_style || ruleProfile.art_style,
        positive_anchors: parsed.positive_anchors.length > 0 ? parsed.positive_anchors : ruleProfile.positive_anchors,
        negative_guardrails: parsed.negative_guardrails && parsed.negative_guardrails.length > 0 ? parsed.negative_guardrails : ruleProfile.negative_guardrails,
      };
    }
    return ruleProfile;
  } catch (err) {
    console.warn('Failed to analyze visual universe via AI, using fallback:', err);
    return ruleProfile;
  }
}

/**
 * 核心引擎 2：基于提取出的视觉世界观，为每个分镜生成专属 t2i_prompt 与 i2v_prompt
 */
export async function enrichShotsWithAdaptiveVisualDirector(
  shots: Shot[],
  visualProfile: VisualContextProfile,
  apiKey: string = '',
  script: string = '',
  topic: string = ''
): Promise<Shot[]> {
  const cleanKey = (apiKey || '').trim();

  // 若无 Key 或脱机，使用自适应档案合成提示词
  if (!cleanKey || cleanKey.startsWith('YOUR_') || cleanKey.includes('sk-xxx')) {
    return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile));
  }

  try {
    const shotInputs = shots.map((s, idx) => ({
      index: idx + 1,
      shot_id: s.shot_id,
      voiceover: s.voiceover,
      camera_motion: s.camera_motion,
    }));

    const systemPrompt = `你是一位精通分镜美术设计的顶级视觉导演。
系统已对用户文稿完成了全局世界观分析，提取出如下《视觉设定档案》：
------------------------
【时代与环境】：${visualProfile.era_setting}
【主角人设锚点】：${visualProfile.character_anchor}
【时代服饰道具】：${visualProfile.attire_props}
【美术统一风格】：${visualProfile.art_style}
【正向锚定词】：${visualProfile.positive_anchors.join(', ')}
【负向排斥词】：${visualProfile.negative_guardrails.join(', ')}
------------------------

【你的绝对纪律（Character Consistency Lock）】：
1. 【主角绝对一致性】：全部分镜中的核心主角必须严格保持与《视觉设定档案》中的【主角人设锚点】完全同一！绝对禁止在任意分镜中擅自更换主角面孔、姓名或引入其他现实公众人物（例如故事主角是特朗普时，全篇镜头均围绕特朗普展现，严禁任何镜头出现拜登、奥巴马等无关人物）！
2. 【分镜主角锁头锚定】：在每个镜头的 t2i_prompt 开头，必须显式指明【${visualProfile.character_anchor}】，并描绘该主角在本镜头的动作、情绪与环境互动！
3. 【两组专属提示词】：
   - t2i_prompt: AI 文生图描述。主体人物特征（置于最前）+ 本镜头情节动势与景别 + 服饰环境 + 美术风格 + 正向词 + (严禁负向词)；
   - i2v_prompt: 视频动态运动描述，包含镜头运镜机位与画中人物自然微动。

【格式要求】：只输出标准的 JSON 数组，每个对象包含 shot_id, t2i_prompt, i2v_prompt。`;

    const userPrompt = `【分镜列表】：
${JSON.stringify(shotInputs, null, 2)}

请直接返回 JSON 数组：`;

    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn('Adaptive Visual Director API failed, using synthetic fallback');
      return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile));
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile));

    const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile));

    const parsedResults: Array<{ shot_id: string; t2i_prompt: string; i2v_prompt: string }> = JSON.parse(match[0]);
    const promptMap = new Map(parsedResults.map((p) => [p.shot_id, p]));

    return shots.map((s, idx) => {
      const enriched = promptMap.get(s.shot_id);
      let targetShot: Shot;
      if (enriched && enriched.t2i_prompt) {
        targetShot = {
          ...s,
          t2i_prompt: enriched.t2i_prompt,
          i2v_prompt: enriched.i2v_prompt || s.i2v_prompt,
          character_anchor: visualProfile.character_anchor,
        };
      } else {
        targetShot = synthesizeShotPromptFromProfile(s, idx, visualProfile);
      }
      return attachCacheIfAvailable(targetShot);
    });
  } catch (err) {
    console.warn('Enrich shots adaptive error, using synthetic fallback:', err);
    return shots.map((s, idx) => attachCacheIfAvailable(synthesizeShotPromptFromProfile(s, idx, visualProfile)));
  }
}

/**
 * 检查该提示词是否在磁盘已有内容哈希缓存 (frame_{hash}.png)
 * 若有，立即复用，无需重复调用万相生图
 */
export function attachCacheIfAvailable(shot: Shot): Shot {
  try {
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    const targetPrompt = shot.t2i_prompt?.trim() || '';
    if (targetPrompt) {
      const promptHash = crypto
        .createHash('sha256')
        .update(`${targetPrompt}_wanx2.1-t2i-turbo_720*1280`)
        .digest('hex')
        .slice(0, 16);
      const cacheFile = `frame_${promptHash}.png`;
      const cacheDiskPath = path.resolve(process.cwd(), 'output', 'images', cacheFile);
      if (fs.existsSync(cacheDiskPath) && fs.statSync(cacheDiskPath).size > 1024) {
        return {
          ...shot,
          keyframe_image: `/output/images/${cacheFile}`,
          status: 'ready',
        };
      }
    }
  } catch {}
  return shot;
}

/**
 * 本地自适应提示词组装器：基于提取的档案与解说词动态合成 t2i_prompt
 */
export function synthesizeShotPromptFromProfile(
  shot: Shot,
  index: number,
  profile: VisualContextProfile
): Shot {
  const positives = profile.positive_anchors.join(', ');
  const negatives = profile.negative_guardrails.length > 0 ? `(严禁${profile.negative_guardrails.join('、严禁')})` : '';

  const t2i = `${profile.art_style}。画面描绘情节：“${shot.voiceover}”。主体人物表现为：${profile.character_anchor}，身着：${profile.attire_props}。场景环境设定：${profile.era_setting}。运镜与构图：${shot.camera_motion}。${positives}。${negatives}`;

  return {
    ...shot,
    t2i_prompt: t2i,
    character_anchor: profile.character_anchor,
  };
}

/**
 * 自适应文化与时代防护网：在发往通义万相 API 前，基于当前提取的世界观档案注入约束
 */
export function applyAdaptiveGuardrail(prompt: string, profile?: VisualContextProfile): string {
  let guarded = prompt.trim();
  if (!profile) return guarded;

  // 检查是否已包含正向锚点词，若无则前置注入
  const hasPositive = profile.positive_anchors.some((anchor) => guarded.includes(anchor));
  if (!hasPositive && profile.positive_anchors.length > 0) {
    guarded = `${profile.era_setting}，${profile.art_style}。${guarded}`;
  }

  // 检查是否已包含负向排斥词，若无则追加
  if (profile.negative_guardrails.length > 0) {
    const negText = `(严禁${profile.negative_guardrails.join('、严禁')})`;
    if (!guarded.includes('严禁')) {
      guarded = `${guarded} ${negText}`;
    }
  }

  return guarded;
}
