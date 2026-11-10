'use client';

import React, { useState } from 'react';
import {
  Inbox,
  Download,
  ShieldCheck,
  Zap,
  RefreshCw,
  Upload,
  Copy,
  Sparkles,
  Loader2,
  Palette,
  Wand2,
} from 'lucide-react';
import { Shot, VisualContextProfile } from '@/types';

interface StoryboardStepProps {
  shots: Shot[];
  visualProfile?: VisualContextProfile | null;
  animatingShotId: string | null;
  generatingImageShotId?: string | null;
  isBatchGeneratingImages?: boolean;
  batchProgress?: { current: number; total: number } | null;
  isPolishingPrompts?: boolean;
  criticReviewData: { [shotId: string]: any };
  onGoToScript: () => void;
  onCriticInspect: (shot: Shot) => void;
  onAnimateWanx: (shot: Shot) => void;
  onRegenerateWanx: (shotId: string, prompt: string, force?: boolean) => void;
  onBatchGenerateWanx?: () => void;
  onPolishVisualPrompts?: () => void;
  onReplaceLocalImage: () => void;
  onDownloadAllImages: () => void;
  onCopyPrompt: (prompt: string) => void;
}

export const StoryboardStep: React.FC<StoryboardStepProps> = ({
  shots,
  visualProfile,
  animatingShotId,
  generatingImageShotId,
  isBatchGeneratingImages = false,
  batchProgress,
  isPolishingPrompts = false,
  criticReviewData,
  onGoToScript,
  onCriticInspect,
  onAnimateWanx,
  onRegenerateWanx,
  onBatchGenerateWanx,
  onPolishVisualPrompts,
  onReplaceLocalImage,
  onDownloadAllImages,
  onCopyPrompt,
}) => {
  const [imageErrors, setImageErrors] = useState<{ [shotId: string]: boolean }>({});
  const [activePromptTabs, setActivePromptTabs] = useState<{ [shotId: string]: 't2i' | 'i2v' }>({});

  const triggerRegenerate = (shotId: string, prompt: string, force: boolean) => {
    setImageErrors((prev) => {
      const next = { ...prev };
      delete next[shotId];
      return next;
    });
    onRegenerateWanx(shotId, prompt, force);
  };

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
            请先在第一步中输入您的口播文稿，并点击“生成 AI 配音与时间戳”。
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
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">分镜总览</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
              共 {shots.length} 镜
            </span>
          </div>
          <span className="text-xs text-gray-400 truncate">
            自适应世界观：
            <b className="text-amber-300 font-normal">
              {visualProfile?.era_setting || '基于文本自适应提取中...'}
            </b>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onPolishVisualPrompts && (
            <button
              disabled={isPolishingPrompts}
              onClick={onPolishVisualPrompts}
              title="基于文稿背景深度提取时代与人设档案，自适应重塑各分镜生图提示词"
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isPolishingPrompts ? 'animate-spin' : ''}`} />
              <span>{isPolishingPrompts ? '世界观自适应分析中...' : '✨ AI 自适应重塑分镜'}</span>
            </button>
          )}

          {onBatchGenerateWanx && (
            <button
              disabled={isBatchGeneratingImages || isPolishingPrompts}
              onClick={onBatchGenerateWanx}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/10 transition disabled:opacity-50"
            >
              {isBatchGeneratingImages ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    正在绘制首帧 ({batchProgress?.current || 1}/{batchProgress?.total || shots.length})...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🎨 一键生成全部首帧 (AI 生图)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onDownloadAllImages}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-gray-200 border border-white/[0.08] flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" /> 打包下载首帧图 (ZIP)
          </button>
        </div>
      </div>

      {/* 9:16 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shots.map((shot) => {
          const isGeneratingImg = generatingImageShotId === shot.shot_id;
          const hasImage = Boolean(shot.keyframe_image) && !imageErrors[shot.shot_id];
          const activeTab = activePromptTabs[shot.shot_id] || 't2i';
          const displayedPrompt = activeTab === 't2i' ? (shot.t2i_prompt || shot.i2v_prompt) : shot.i2v_prompt;
          const currentT2i = shot.t2i_prompt || shot.i2v_prompt;

          return (
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

              {/* 9:16 媒体视口 */}
              <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black/60 border border-white/[0.08] group-hover:border-amber-500/40 transition">
                {isGeneratingImg ? (
                  /* 生成中 Loading 状态 */
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-black/80 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <span className="text-xs font-semibold text-amber-300">AI 正在绘制首帧...</span>
                    <span className="text-[10px] text-gray-400 mt-1 max-w-[160px] line-clamp-2">
                      正在生成 720x1280 电影级首帧画面
                    </span>
                  </div>
                ) : hasImage ? (
                  /* 已生成首帧图像 (带防强缓存 key 与时间戳) */
                  <>
                    <img
                      key={shot.keyframe_image}
                      src={shot.keyframe_image}
                      alt={shot.shot_id}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      onError={() => setImageErrors((prev) => ({ ...prev, [shot.shot_id]: true }))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                      <span className="text-[10px] text-amber-300 font-medium truncate">
                        🎥 {shot.camera_motion}
                      </span>
                    </div>
                  </>
                ) : (
                  /* 首帧待绘制优雅占位态 */
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-white/[0.03] to-black/70">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                      <Palette className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-200">首帧待绘制</span>
                    <span className="text-[10px] text-gray-400 mt-1 line-clamp-2 px-1">
                      {shot.voiceover}
                    </span>
                    <button
                      disabled={isBatchGeneratingImages || isGeneratingImg}
                      onClick={() => triggerRegenerate(shot.shot_id, currentT2i, false)}
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10 hover:scale-[1.02] transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      绘制首帧 (AI 生图)
                    </button>
                    <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                      <span className="text-[9px] text-gray-400/80 font-mono truncate">
                        {shot.camera_motion}
                      </span>
                    </div>
                  </div>
                )}

                {/* 悬停快捷控制栏 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10">
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
                    title="生成视频切片 (AI 动画驱动)"
                    className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-amber-500 hover:text-black text-amber-300 text-xs transition"
                  >
                    <Zap className={`w-3.5 h-3.5 ${animatingShotId === shot.shot_id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    disabled={isGeneratingImg}
                    onClick={() => triggerRegenerate(shot.shot_id, currentT2i, true)}
                    title="强制重新生成首帧 (绕过缓存，抽取全新画面)"
                    className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-blue-500 hover:text-black text-white text-xs transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingImg ? 'animate-spin' : ''}`} />
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

              {/* 智能提示词面板 (双标签切换：首帧美术描述 vs 运镜指令) */}
              <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.06] flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.05]">
                    <button
                      onClick={() => setActivePromptTabs((prev) => ({ ...prev, [shot.shot_id]: 't2i' }))}
                      className={`px-2 py-0.5 rounded font-medium transition ${
                        activeTab === 't2i'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      🎨 首帧画面 (T2I)
                    </button>
                    <button
                      onClick={() => setActivePromptTabs((prev) => ({ ...prev, [shot.shot_id]: 'i2v' }))}
                      className={`px-2 py-0.5 rounded font-medium transition ${
                        activeTab === 'i2v'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      🎥 运镜动势 (I2V)
                    </button>
                  </div>
                  <button
                    onClick={() => onCopyPrompt(displayedPrompt)}
                    className="hover:text-amber-400 text-gray-400 flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" /> 复制
                  </button>
                </div>
                <p className="text-[10px] text-gray-300/90 leading-relaxed font-sans line-clamp-3">
                  {displayedPrompt}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
