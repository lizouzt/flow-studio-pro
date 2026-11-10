'use client';

import React, { useRef, useState } from 'react';
import {
  UserCheck,
  Sparkles,
  Upload,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  Palette,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { VisualContextProfile, CharacterBenchmark } from '@/types';

interface ActorCastingCardProps {
  visualProfile: VisualContextProfile | null;
  benchmark: CharacterBenchmark | null;
  isCasting: boolean;
  onGenerateBenchmark: () => void;
  onUploadBenchmark: (base64: string) => void;
  onConfirmBenchmark: () => void;
}

export const ActorCastingCard: React.FC<ActorCastingCardProps> = ({
  visualProfile,
  benchmark,
  isCasting,
  onGenerateBenchmark,
  onUploadBenchmark,
  onConfirmBenchmark,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPortrait = Boolean(benchmark?.portrait_image);
  const isConfirmed = Boolean(benchmark?.confirmed);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadBenchmark(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.04] via-black/40 to-transparent flex flex-col gap-5 transition duration-300 shadow-xl shadow-amber-500/5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* 顶部标题与折叠开关 */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                AI 主角概念定妆枢纽 (Actor Casting)
              </h2>
              {isConfirmed ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> 已锁定定妆基准 · 连戏锁脸生效中
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold animate-pulse">
                  选角定妆待确认
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              电影工业级“绝对锁脸”基线：在此确定主角纯净正面肖像，全篇分镜将严格依此定妆照保持面容连戏。
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* 折叠内容体 */}
      {!isCollapsed && (
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* 左侧：主角定妆照大图视口 */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col items-center">
            <div className="relative w-44 aspect-[9/16] rounded-2xl overflow-hidden bg-black/80 border-2 border-amber-500/40 shadow-lg shadow-black/80 group">
              {isCasting ? (
                /* 定妆生成中 Loading */
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-black/90">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <span className="text-xs font-semibold text-amber-300">正在生成定妆照...</span>
                  <span className="text-[10px] text-gray-500 mt-1">
                    绘制高精度纯净人物肖像
                  </span>
                </div>
              ) : hasPortrait ? (
                /* 已生成定妆照大图 */
                <>
                  <img
                    key={benchmark?.portrait_image}
                    src={benchmark?.portrait_image}
                    alt="主角定妆照"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2.5 pointer-events-none">
                    <span className="text-[10px] text-amber-300 font-semibold truncate flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-400" /> 主角基准面容已固化
                    </span>
                  </div>
                </>
              ) : (
                /* 待生成定妆照优雅占位 */
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-white/[0.02]">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-300">尚未生成定妆照</span>
                  <span className="text-[10px] text-gray-500 mt-1">
                    点击右侧按钮一键抽卡或上传
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：主角特征描述与定妆操控台 */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> 主角人设外貌与气质锚点
                </span>
                <p className="text-xs text-gray-200 leading-relaxed font-sans">
                  {visualProfile?.character_anchor || '正在自适应提取文稿主角特征...'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-gray-400 text-[10px] block mb-1">经典定妆服饰与道具</span>
                  <span className="text-gray-200 font-medium line-clamp-2">
                    {visualProfile?.attire_props || '根据题材自适应匹配'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-gray-400 text-[10px] block mb-1">时代环境与美术风格</span>
                  <span className="text-gray-200 font-medium line-clamp-2">
                    {visualProfile?.era_setting || '统一电影级写实画报质感'}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作控制按钮组 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isCasting}
                  onClick={onGenerateBenchmark}
                  title="调用生图引擎重新抽取一张纯净正面定妆照"
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs text-gray-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCasting ? 'animate-spin' : ''}`} />
                  {hasPortrait ? '🎲 重新抽卡换角' : '✨ 一键生成主角定妆照'}
                </button>

                <button
                  type="button"
                  disabled={isCasting}
                  onClick={() => fileInputRef.current?.click()}
                  title="上传一张指定的真人或自定义正面照作为锁脸底图"
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs text-gray-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  上传真人/参考图
                </button>
              </div>

              <button
                type="button"
                disabled={!hasPortrait || isCasting}
                onClick={onConfirmBenchmark}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-40 ${
                  isConfirmed
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isConfirmed ? '已锁定定妆 · 进入分镜生图' : '✅ 确认此主角定妆并进入分镜'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
