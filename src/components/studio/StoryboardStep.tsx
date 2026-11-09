'use client';

import React from 'react';
import {
  Inbox,
  Download,
  ShieldCheck,
  Zap,
  RefreshCw,
  Upload,
  Copy,
} from 'lucide-react';
import { Shot } from '@/types';

interface StoryboardStepProps {
  shots: Shot[];
  animatingShotId: string | null;
  criticReviewData: { [shotId: string]: any };
  onGoToScript: () => void;
  onCriticInspect: (shot: Shot) => void;
  onAnimateWanx: (shot: Shot) => void;
  onRegenerateWanx: (shotId: string, prompt: string) => void;
  onReplaceLocalImage: () => void;
  onDownloadAllImages: () => void;
  onCopyPrompt: (prompt: string) => void;
}

export const StoryboardStep: React.FC<StoryboardStepProps> = ({
  shots,
  animatingShotId,
  criticReviewData,
  onGoToScript,
  onCriticInspect,
  onAnimateWanx,
  onRegenerateWanx,
  onReplaceLocalImage,
  onDownloadAllImages,
  onCopyPrompt,
}) => {
  if (shots.length === 0) {
    return (
      /* 空状态引导 */
      <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-gray-400">
          <Inbox className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">暂无生成的分镜内容</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            系统已完全移除默认 Mock 模拟数据。请先在第一步中输入您的口播文稿，并点击“生成百炼配音与时间戳”。
          </p>
        </div>
        <button
          onClick={onGoToScript}
          className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition"
        >
          前往撰写与生成配音
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">分镜总览</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
              共 {shots.length} 镜
            </span>
          </div>
          <span className="text-xs text-gray-400">
            画风：<b className="text-gray-200">厚涂历史漫画风 (Historical Comic)</b>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadAllImages}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-gray-200 border border-white/[0.08] flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" /> 打包下载首帧图 (ZIP)
          </button>
        </div>
      </div>

      {/* 9:16 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shots.map((shot) => (
          <div
            key={shot.shot_id}
            className="glass-panel rounded-2xl p-4 flex flex-col gap-3 amber-glow group transition duration-300"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 font-mono uppercase">{shot.shot_id}</span>
              <span className="font-mono text-gray-400 text-[11px] bg-black/40 px-2 py-0.5 rounded">
                {shot.target_start_sec}s - {shot.target_end_sec}s
              </span>
            </div>

            <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] group-hover:border-amber-500/40 transition">
              {shot.keyframe_image && (
                <img
                  src={shot.keyframe_image}
                  alt={shot.shot_id}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                <span className="text-[10px] text-amber-300 font-medium truncate">
                  🎥 {shot.camera_motion}
                </span>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                <button
                  onClick={() => onCriticInspect(shot)}
                  title="启动独立 Critic 智能质检审核"
                  className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-emerald-500 hover:text-black text-emerald-400 text-xs transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={animatingShotId === shot.shot_id}
                  onClick={() => onAnimateWanx(shot)}
                  title="百炼全自动生成视频切片 (异步轮询直出)"
                  className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-amber-500 hover:text-black text-amber-300 text-xs transition"
                >
                  <Zap className={`w-3.5 h-3.5 ${animatingShotId === shot.shot_id ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => onRegenerateWanx(shot.shot_id, shot.i2v_prompt)}
                  title="调用通义万相重新生图"
                  className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-blue-500 hover:text-black text-white text-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onReplaceLocalImage}
                  title="替换本地图"
                  className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-white text-white hover:text-black text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Critic 质检结果微标签 */}
            {criticReviewData[shot.shot_id] && (
              <div className="p-2 rounded-lg bg-black/50 border border-white/[0.06] flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> 质检评分: {criticReviewData[shot.shot_id].score}分
                </span>
                <span className="text-gray-400 font-mono">
                  {criticReviewData[shot.shot_id].passed ? '通过' : '待优化'}
                </span>
              </div>
            )}

            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
              {shot.voiceover}
            </p>

            <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>I2V 动力学 Prompt</span>
                <button
                  onClick={() => onCopyPrompt(shot.i2v_prompt)}
                  className="hover:text-amber-400 flex items-center gap-1 transition"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-mono line-clamp-2">
                {shot.i2v_prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
