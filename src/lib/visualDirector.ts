import { Shot } from '@/types';

/**
 * 规则兜底：生成确定性的中国历史/人物首帧画面描述 (T2I Prompt)
 * 确保在脱机或大模型未响应时，100% 呈现南宋/中国古典风貌，彻底杜绝西方骑士与中世纪城堡
 */
export function generateDefaultChineseHistoricalPrompt(voiceover: string, shotIndex: number, cameraMotionZh: string): string {
  // 根据解说词关键词进行时代与场景智能感知
  const isNightRaid = voiceover.includes('夜袭') || voiceover.includes('敌阵') || voiceover.includes('五十骑') || voiceover.includes('大营');
  const isOldAge = voiceover.includes('白发') || voiceover.includes('四十年') || voiceover.includes('江南') || voiceover.includes('醉里') || voiceover.includes('栏杆');
  const isBattle = voiceover.includes('金戈铁马') || voiceover.includes('三尺青锋') || voiceover.includes('武将') || voiceover.includes('气吞万里');

  let sceneDesc = '';
  if (isNightRaid) {
    sceneDesc = '暴风雨深夜的大型敌营营寨前，篝火与火把连绵摇曳，泥泞飞溅，狂风吹卷军旗，南宋精锐骑兵部队策马疾驰突袭';
  } else if (isOldAge) {
    sceneDesc = '南宋江南水乡木质阁楼窗前，孤灯残烛，窗外微雨蒙蒙，墙上挂着宝剑，案几摆放宋代瓷器与书卷，英雄暮年沧桑凝望';
  } else if (isBattle) {
    sceneDesc = '宋代壮阔古代战场，两军对垒，漫天尘沙与猎猎宋军旌旗，战马长嘶，战况激烈，刀光剑影映照苍穹';
  } else {
    sceneDesc = '中国南宋历史画卷，古典中式宫阙与军帐营地，历史厚重氛围，史诗感构图';
  }

  let characterDesc = '';
  if (isOldAge) {
    characterDesc = '双鬓斑白的南宋暮年名将辛弃疾，东亚苍老而坚毅的面孔，眼神藏着未酬壮志的悲愤，身穿宋代墨青色宽袖布袍，手扶雕花木栏杆';
  } else {
    characterDesc = '二十二岁英武非凡的南宋青年将领辛弃疾，典型的俊朗刚毅东亚面孔，剑眉星目，头戴南宋凤翅铁盔，身披宋代传统精铁鱼鳞扎甲与朱红内衬战袍，手提寒光闪烁的中国汉剑，骑乘黑色骠悍战马';
  }

  return `厚涂中国历史古典写实漫画风格。${characterDesc}。场景设定为：${sceneDesc}。${cameraMotionZh}，电影级高对比戏剧光影，浓郁历史厚重感，写实笔触与国风水墨质感相融，8k超清细节，9:16短视频竖屏构图。中国古代历史场景，南宋朝代，传统中式铠甲战袍，典型东亚人物特征。`;
}

/**
 * 文化防护网：在发往通义万相 API 前强制注入正向文化特征，并追加负向防偏约束
 */
export function applyCulturalGuardrail(prompt: string): string {
  let guarded = prompt.trim();

  // 若提示词中未显式包含中式文化标识，强制置顶注入
  const chineseAnchors = ['中国', '南宋', '宋代', '东亚', 'Ancient China', 'Chinese'];
  const hasChineseAnchor = chineseAnchors.some((anchor) => guarded.includes(anchor));

  if (!hasChineseAnchor) {
    guarded = `厚涂中国历史古典写实漫画风格，古代中国南宋历史场景，典型东亚面孔与传统中式铠甲战袍。${guarded}`;
  }

  // 严正附带负向排除提示词，彻底拦截基座模型对中世纪欧洲骑士的联想
  const negativeExclusions = `(严禁任何中世纪欧洲骑士、严禁西方石砌城堡、严禁十字军板甲、严禁白人西方面孔、严禁哥特风格。no medieval Europe, no western knight, no gothic castle, no caucasian, no western fantasy armor)`;
  
  if (!guarded.includes('严禁任何中世纪欧洲骑士')) {
    guarded = `${guarded} ${negativeExclusions}`;
  }

  return guarded;
}

/**
 * 视觉导演 Agent：调用通义千问 Qwen，为整组分镜注入深度的中国古代历史首帧美术提示词
 */
export async function enrichShotsWithVisualDirector(
  shots: Shot[],
  apiKey: string,
  topic: string = ''
): Promise<Shot[]> {
  if (!apiKey || apiKey.startsWith('YOUR_') || apiKey.includes('sk-xxx') || apiKey.trim() === '') {
    // 无 Key 时直接走本地高质量中式古典规则引擎
    return fallbackEnrich(shots);
  }

  try {
    const shotInputs = shots.map((s, idx) => ({
      index: idx + 1,
      shot_id: s.shot_id,
      voiceover: s.voiceover,
      camera_motion: s.camera_motion,
    }));

    const systemPrompt = `你是一位精通中国历史题材影视剧与爆款短视频的金牌分镜美术导演。
你的核心任务是：根据输入的题材背景和每句解说词，为【通义万相 Wanx 2.1 文生图模型】编写极其地道、时代考究、视觉张力拉满的【中式首帧生图提示词 (t2i_prompt)】。

【严格执行准则】：
1. 【时代与服饰绝对准确】：文稿涉及中国古代历史（如南宋辛弃疾），必须精准描写宋代服饰与甲胄（如宋代铁制山文甲/鱼鳞扎甲、朱红战袍、凤翅兜鍪、中国汉剑/直刀、宋军旌旗）。
2. 【绝对杜绝西方元素】：严禁出现任何中世纪欧洲骑士、板甲、西方城堡、十字军、白人西方面孔！主角必须是英挺刚毅的东亚东方面孔！
3. 【画面构图与光影】：必须包含镜头景别、主体姿态动势、环境细节（如雨夜火把、军帐连绵、战马嘶鸣、窗前残烛）、电影级戏剧光影。
4. 【统一风格】：全部统一为“厚涂中国历史写实漫画风格，电影级质感，9:16竖屏”。
5. 【输出格式】：必须返回纯 JSON 数组，每个对象包含 shot_id, t2i_prompt, i2v_prompt 三个字段。`;

    const userPrompt = `【创作主题】：${topic || '中国古代历史人物故事'}
【分镜清单】：
${JSON.stringify(shotInputs, null, 2)}

请为每个镜头生成专业的 t2i_prompt（首帧文生图详细描述）与 i2v_prompt（图生视频动力学动作提示词），直接输出 JSON 数组：`;

    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn('Visual Director Qwen API returned error, falling back to rule engine');
      return fallbackEnrich(shots);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return fallbackEnrich(shots);

    // 解析返回的 JSON
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) return fallbackEnrich(shots);

    const parsedResults: Array<{ shot_id: string; t2i_prompt: string; i2v_prompt: string }> = JSON.parse(jsonMatch[0]);
    const promptMap = new Map(parsedResults.map((p) => [p.shot_id, p]));

    return shots.map((s, idx) => {
      const enriched = promptMap.get(s.shot_id);
      if (enriched && enriched.t2i_prompt) {
        return {
          ...s,
          t2i_prompt: enriched.t2i_prompt,
          i2v_prompt: enriched.i2v_prompt || s.i2v_prompt,
          character_anchor: '南宋青年将领辛弃疾，东亚面孔，身披宋代传统铠甲战袍',
        };
      }
      return fallbackSingleShot(s, idx);
    });
  } catch (err) {
    console.warn('Failed to call Visual Director, falling back to local rule engine:', err);
    return fallbackEnrich(shots);
  }
}

function fallbackEnrich(shots: Shot[]): Shot[] {
  return shots.map((s, idx) => fallbackSingleShot(s, idx));
}

function fallbackSingleShot(shot: Shot, index: number): Shot {
  const t2i = generateDefaultChineseHistoricalPrompt(shot.voiceover, index + 1, shot.camera_motion);
  return {
    ...shot,
    t2i_prompt: t2i,
    character_anchor: '南宋青年将领辛弃疾，东亚面孔，身披宋代传统铠甲战袍',
  };
}
