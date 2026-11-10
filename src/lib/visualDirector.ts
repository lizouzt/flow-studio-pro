import { Shot, VisualContextProfile } from '@/types';

/**
 * 规则兜底分类器：在脱机或无 API Key 时，基于自然语言词法特征自动推导《视觉世界观档案》
 * 严格保持中立与通用，绝不硬编码任何具体人物姓名或特定实体
 */
export function extractVisualContextByRules(text: string = '', topic: string = ''): VisualContextProfile {
  const combined = `${topic} ${text}`.toLowerCase();

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
    /罗马|中世纪|骑士|城堡|角斗士|维京|十字军|欧洲古典|英格兰|法兰西|古典西方|文艺复兴/.test(
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

【必须分析输出的 6 项要素（完全根据输入内容自适应分析，严禁泛化，严禁偏离文稿真实实体）】：
1. era_setting: 故事发生的准确时代背景、历史朝代、纪元或真实地理/环境定位；
2. character_anchor: 核心主角的专有人物姓名/身份、标志性面部特征、标志性发型、体态与神韵。
   - 若故事围绕真实历史人物或现代著名人物，必须精确提取该特定人物的姓名与公认代表性外貌特征；
   - 若故事为虚构或泛指角色，必须给出具体生动的人格化面貌描写，确保全剧画风统一；
3. attire_props: 符合该时代历史真实或该主角标志性身份的经典服饰、随身道具；
4. art_style: 契合该题材氛围的统一美术画风（声明 9:16 竖屏短视频构图与电影级戏剧光影）；
5. positive_anchors: 4~6 个必须强化的正向核心视觉词（必须包含主角专有肖像特征词，确保生图模型不偏离）；
6. negative_guardrails: 4~6 个与该时代或该主角严重冲突、极易被生图模型误加的负向排斥词：
   - 时代冲突排斥（如中国古代排斥中世纪欧洲骑士与现代电器；现代题材排斥古代铠甲）；
   - 主角混淆排斥（若主角为特定著名人物，自动推导并显式排斥同领域、同时代极易被模型混淆的关联/对立人物，以及“混淆主角面容”）。

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
 * 镜头焦点与蒙太奇意图分类器：避免全片每一镜都硬塞主角人脸
 */
export function detectShotFocusFromText(
  voiceover: string = '',
  index: number = 0,
  totalShots: number = 4
): 'character' | 'environment' | 'prop' | 'pov_antagonist' {
  const text = voiceover.toLowerCase();

  // 1. 器物与微距道具判定
  if (/剑刃|刀光|吴钩|手稿|文书|檄文|虎符|案头|油灯|烛光|栏杆|美芹十论|卷轴|书信|马蹄|酒杯|佩玉|腰牌/.test(text)) {
    return 'prop';
  }

  // 2. 宏观环境建立/大阵仗空镜判定 (首镜或战局宏观描述)
  if (/大营|营帐|连绵|十里|烽燧|鹿角|山川|丘陵|暮色|苍茫|寒夜|风雪|烟雨|江南|西湖|城郭|铁幕|黑云|千军|万军/.test(text)) {
    if (index === 0 || index === 2 || !/他|她|将领|冲锋|破阵|斩|双眼|瞳孔/.test(text)) {
      return 'environment';
    }
  }

  // 3. 主观视点与动态反打判定
  if (/撞碎|辕门|破阵|掠过|呼啸|迎面|飞沙|惊骇|仓皇|溃散/.test(text) && index !== 0) {
    return 'pov_antagonist';
  }

  // 4. 默认：主角叙事与核心动作神态
  return 'character';
}

/**
 * 核心引擎 2：基于提取出的视觉世界观，为每个分镜生成专属 t2i_prompt 与 i2v_prompt (融入电影级蒙太奇镜头节奏)
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
    return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile, shots.length));
  }

  try {
    const shotInputs = shots.map((s, idx) => ({
      index: idx + 1,
      shot_id: s.shot_id,
      voiceover: s.voiceover,
      camera_motion: s.camera_motion,
    }));

    const systemPrompt = `你是一位精通分镜美术设计与电影蒙太奇节奏的顶级视觉导演。
系统已对用户文稿完成了全局世界观分析，提取出如下《视觉设定档案》：
------------------------
【时代与环境】：${visualProfile.era_setting}
【主角人设锚点】：${visualProfile.character_anchor}
【时代服饰道具】：${visualProfile.attire_props}
【美术统一风格】：${visualProfile.art_style}
【正向锚定词】：${visualProfile.positive_anchors.join(', ')}
【负向排斥词】：${visualProfile.negative_guardrails.join(', ')}
------------------------

【电影级镜头编排黄金法则（严禁把每一个镜头都做成主角写真集！）】：
一部优秀的影视短片绝不会在每个镜头都硬塞主角！必须有大有小、有人有物、虚实相生：
1. 【四类分镜焦点 (shot_focus)】：
   - "character"（主角叙事镜）：主角的核心动作、情绪交锋、中景或特写。仅此类镜头开头必须显式注入【${visualProfile.character_anchor}】并保持绝对锁脸连戏；
   - "environment"（环境建立镜/宏观空镜）：展现时代氛围、战场景观、千军万马的大阵仗或地理地貌。严禁插入具体人脸，专注宏大景深与时代光影；
   - "prop"（器物微距与隐喻镜）：聚焦兵刃武器、书卷手稿、令牌虎符、马蹄踏泥等物理细节。严禁人脸大头贴，专注微距浅景深与材质质感；
   - "pov_antagonist"（主观视点/敌军反打镜）：急速飞驰的第一人称掠影视角，或敌军兵将仓皇惊骇的动态。严禁混入主角面孔。

2. 【镜头节奏分配】：主角镜头建议占 50%~60%，其余 40%~50% 错落分配为环境建立镜与器物特写，形成呼吸起伏的院线电影质感！

【输出格式要求】：只输出标准的 JSON 数组，每个对象必须包含：
{
  "shot_id": string,
  "shot_focus": "character" | "environment" | "prop" | "pov_antagonist",
  "t2i_prompt": string,
  "i2v_prompt": string
}`;

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
      return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile, shots.length));
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile, shots.length));

    const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) return shots.map((s, idx) => synthesizeShotPromptFromProfile(s, idx, visualProfile, shots.length));

    const parsedResults: Array<{
      shot_id: string;
      shot_focus?: 'character' | 'environment' | 'prop' | 'pov_antagonist';
      t2i_prompt: string;
      i2v_prompt: string;
    }> = JSON.parse(match[0]);
    const promptMap = new Map(parsedResults.map((p) => [p.shot_id, p]));

    return shots.map((s, idx) => {
      const enriched = promptMap.get(s.shot_id);
      let targetShot: Shot;
      if (enriched && enriched.t2i_prompt) {
        targetShot = {
          ...s,
          shot_focus: enriched.shot_focus || detectShotFocusFromText(s.voiceover, idx, shots.length),
          t2i_prompt: enriched.t2i_prompt,
          i2v_prompt: enriched.i2v_prompt || s.i2v_prompt,
          character_anchor: visualProfile.character_anchor,
        };
      } else {
        targetShot = synthesizeShotPromptFromProfile(s, idx, visualProfile, shots.length);
      }
      return attachCacheIfAvailable(targetShot);
    });
  } catch (err) {
    console.warn('Enrich shots adaptive error, using synthetic fallback:', err);
    return shots.map((s, idx) => attachCacheIfAvailable(synthesizeShotPromptFromProfile(s, idx, visualProfile, shots.length)));
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
 * 本地自适应提示词组装器：基于镜头焦点 (主角/环境/器物/视点) 智能合成 t2i_prompt
 */
export function synthesizeShotPromptFromProfile(
  shot: Shot,
  index: number,
  profile: VisualContextProfile,
  totalShots: number = 4
): Shot {
  const positives = profile.positive_anchors.join(', ');
  const negatives = profile.negative_guardrails.length > 0 ? `(严禁${profile.negative_guardrails.join('、严禁')})` : '';
  const focus = shot.shot_focus || detectShotFocusFromText(shot.voiceover, index, totalShots);

  let t2i = '';
  if (focus === 'environment') {
    // 宏观建立镜头：严禁堆叠人物面部描述，专注宏伟空间与时代沧桑氛围
    t2i = `${profile.art_style}。电影级宏观环境建立镜头：表现情节“${shot.voiceover}”。构图与运镜：${shot.camera_motion}。时代与地理宏观空间：${profile.era_setting}。${positives}。(宏观空间地貌与时代氛围渲染，无人物特写，严禁人脸大头贴、严禁现代元素)`;
  } else if (focus === 'prop') {
    // 器物与隐喻微距特写：专注材质光影，严禁硬插人脸
    t2i = `${profile.art_style}。电影级微距器物特写：表现情节“${shot.voiceover}”。核心器物质感细节：${profile.attire_props}。运镜与景深：${shot.camera_motion}，浅景深虚化背景。${positives}。(微距静物特写，无人物特写，严禁人脸大头贴)`;
  } else if (focus === 'pov_antagonist') {
    // 主观视点或反打动势
    t2i = `${profile.art_style}。第一人称动态视点镜头：表现情节动势“${shot.voiceover}”。镜头机位与动势：${shot.camera_motion}。场景空间：${profile.era_setting}。${positives}。(高速动势与战场对决氛围，严禁混入主角面容)`;
  } else {
    // 核心主角叙事镜头 (真锁脸)
    t2i = `${profile.art_style}。核心主角画面：表现情节“${shot.voiceover}”。主体人物表现为：【${profile.character_anchor}】，身着：${profile.attire_props}。场景空间设定：${profile.era_setting}。运镜与构图：${shot.camera_motion}。${positives}。${negatives}`;
  }

  return {
    ...shot,
    shot_focus: focus,
    t2i_prompt: t2i,
    character_anchor: focus === 'character' ? profile.character_anchor : undefined,
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
