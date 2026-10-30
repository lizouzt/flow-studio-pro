import { Shot } from '@/types';

export interface SrtCue {
  id: number;
  start_sec: number;
  end_sec: number;
  text: string;
}

export const DYNAMIC_CAMERA_MOTIONS = [
  {
    type: "低角度疾速跟摇",
    camera_en: "Low-angle rapid tracking shot, dynamic pan left",
    action_en: "moving aggressively through atmospheric environment, clothes fluttering, intense gaze",
    camera_zh: "低角度疾速横向跟拍，镜头平滑左摇",
  },
  {
    type: "电影慢推凝视",
    camera_en: "Slow cinematic push in, dramatic focus on the subject eyes",
    action_en: "subtle facial expression change, breathing steadily in tense atmosphere, resolute determination",
    camera_zh: "慢速平滑推镜，戏剧性聚焦眼神特写",
  },
  {
    type: "大全景环摇俯瞰",
    camera_en: "Wide-angle slow orbital pan across the historic environment",
    action_en: "standing solemnly, banners waving in the distance, torches flickering",
    camera_zh: "广角环绕运镜，交代宏大环境氛围",
  },
  {
    type: "手持纪实微晃",
    camera_en: "Handheld camera motion, subtle organic camera shake, cinematic documentary style",
    action_en: "walking forward resolutely through the crowd, natural momentum",
    camera_zh: "手持胶片感微幅运镜，自然步态推进",
  },
  {
    type: "过肩视角延展",
    camera_en: "Over-the-shoulder shot, slowly panning right to reveal the vast landscape",
    action_en: "looking out into the stormy horizon, solemn and determined posture",
    camera_zh: "过肩缓推右摇，展现广阔地平线",
  }
];

export function parseSrt(srtContent: string): SrtCue[] {
  const cues: SrtCue[] = [];
  const regex = /(\d+)\r?\n(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\r?\n([\s\S]*?)(?=\r?\n\r?\n|\r?\n*$|$)/g;
  
  let match;
  while ((match = regex.exec(srtContent)) !== null) {
    const id = parseInt(match[1], 10);
    const startSec = timeToSec(match[2]);
    const endSec = timeToSec(match[3]);
    const text = match[4].replace(/\r?\n/g, ' ').trim();
    if (text) {
      cues.push({ id, start_sec: startSec, end_sec: endSec, text });
    }
  }
  return cues;
}

function timeToSec(timeStr: string): number {
  const [h, m, sWithMs] = timeStr.split(':');
  const [s, ms] = sWithMs.replace('.', ',').split(',');
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000.0;
}

export function aggregateCuesToShots(
  cues: SrtCue[], 
  targetDurationSec: number = 5.5,
  styleName: string = "Historical Comic"
): Shot[] {
  if (cues.length === 0) return [];

  const shots: Shot[] = [];
  let currentCues: SrtCue[] = [];
  let shotStart = 0;
  let shotIndex = 1;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (currentCues.length === 0) {
      shotStart = cue.start_sec;
    }
    currentCues.push(cue);

    const currentDuration = cue.end_sec - shotStart;
    const isLast = (i === cues.length - 1);

    // 达到目标镜头时长，或已到最后一句
    if (currentDuration >= targetDurationSec || isLast) {
      const motion = DYNAMIC_CAMERA_MOTIONS[(shotIndex - 1) % DYNAMIC_CAMERA_MOTIONS.length];
      const combinedVoiceover = currentCues.map(c => c.text).join(' ');
      const shotId = `shot_${String(shotIndex).padStart(2, '0')}`;
      
      const shot: Shot = {
        shot_id: shotId,
        target_start_sec: Number(shotStart.toFixed(2)),
        target_end_sec: Number(cue.end_sec.toFixed(2)),
        target_duration_sec: Number((cue.end_sec - shotStart).toFixed(2)),
        srt_cues: currentCues.map(c => c.id),
        voiceover: combinedVoiceover,
        keyframe_image: `/output/images/${shotId}.png`,
        camera_motion: `${motion.camera_zh} (${motion.type})`,
        subject_action: motion.action_en,
        i2v_prompt: `${motion.camera_en}. The subject in the reference image performs ${motion.action_en}, cinematic ${styleName}, photorealistic, dramatic lighting, 24fps, high quality`,
        rendered_video_path: `/output/videos/${shotId}.mp4`,
        status: 'pending'
      };

      shots.push(shot);
      shotIndex++;
      currentCues = [];
    }
  }

  return shots;
}
