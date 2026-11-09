'use client';

import React from 'react';
import {
  Share2,
  Copy,
  UploadCloud,
  Check,
} from 'lucide-react';
import { Shot } from '@/types';

interface VideoTransitStepProps {
  shots: Shot[];
  onDropVideos: (e: React.DragEvent) => void;
  onCopyAllPrompts: () => void;
}

export const VideoTransitStep: React.FC<VideoTransitStepProps> = ({
  shots,
  onDropVideos,
  onCopyAllPrompts,
}) => {
  const readyCount = shots.filter((s) => s.status === 'ready').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-brand-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">外部视频模型投喂与回填中转站</h2>
              <p className="text-xs text-gray-400">
                前往{' '}
                <a
                  href="https://flow.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 underline"
                >
                  Google Flow
                </a>{' '}
                或 字节即梦 Seedance 生成视频，将切片文件回填到此。
              </p>
            </div>
          </div>
          <button
            onClick={onCopyAllPrompts}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white border border-white/[0.08] flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> 一键复制全部 Prompt 表格
          </button>
        </div>

        {/* 拖拽回填区 */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropVideos}
          className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-8 bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition flex flex-col items-center justify-center gap-3 cursor-pointer text-center group"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">将下载好的视频片段批量拖拽至此</h3>
            <p className="text-xs text-gray-400 mt-1">
              系统将自动按文件名 (<code className="text-amber-300">shot_01.mp4</code>,{' '}
              <code className="text-amber-300">shot_02.mp4</code>...) 智能绑定对应分镜
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-white/[0.06] text-gray-300 border border-white/[0.08]">
            支持直接拖拽多文件
          </span>
        </div>
      </div>

      {/* 视频匹配列表 */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">镜头视频切片归位状态</span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {readyCount} / {shots.length} 已就绪
          </span>
        </div>

        {shots.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">暂无分镜数据，请先完成前置生成。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {shots.map((shot) => (
              <div
                key={shot.shot_id}
                className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center gap-3"
              >
                <div className="w-9 h-14 rounded-lg bg-gray-800 overflow-hidden relative">
                  {shot.keyframe_image && (
                    <img src={shot.keyframe_image} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1 uppercase">
                    {shot.shot_id} <span className="text-[10px] text-emerald-400">✅ {shot.target_duration_sec}s</span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {shot.rendered_video_path?.split('/').pop() || 'waiting...'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
