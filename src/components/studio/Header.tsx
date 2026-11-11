'use client';

import React from 'react';
import { Clapperboard, Settings, FolderClock } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  shotCount: number;
  isKeyConfigured: boolean;
  onOpenConfig: () => void;
  onOpenProjectHistory?: () => void;
}

const STEPS = [
  { step: 1, label: '撰稿与配音' },
  { step: 2, label: '分镜与首帧' },
  { step: 3, label: '外部回填 (可选)' },
  { step: 4, label: '成片交付' },
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  shotCount,
  isKeyConfigured,
  onOpenConfig,
  onOpenProjectHistory,
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-brand-border px-6 py-3 flex items-center justify-between">
      {/* 左侧品牌与副标题 */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-brand-black font-black">
          <Clapperboard className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            Flow Studio <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Pro</span>
          </h1>
          <p className="text-[11px] text-gray-400">
            {shotCount > 0 ? `已生成 ${shotCount} 个镜头` : '等待剧本与配音生成'}
          </p>
        </div>
      </div>

      {/* 4 步流转指示器 */}
      <nav className="flex items-center bg-black/40 p-1 rounded-full border border-brand-border shadow-inner">
        {STEPS.map(({ step, label }) => {
          const isActive = currentStep === step;
          return (
            <button
              key={step}
              onClick={() => onSelectStep(step)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isActive ? 'bg-black/20 font-bold' : 'bg-white/10'
                }`}
              >
                {step}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* 状态指示胶囊与设置按钮 */}
      <div className="flex items-center gap-3">
        {onOpenProjectHistory && (
          <button
            onClick={onOpenProjectHistory}
            title="恢复历史任务或工程"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition shadow-sm"
          >
            <FolderClock className="w-3.5 h-3.5" />
            <span>历史工程</span>
          </button>
        )}

        <div
          onClick={onOpenConfig}
          className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] text-gray-300 transition"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isKeyConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          ></span>
          <span>{isKeyConfigured ? 'AI 引擎就绪' : '未配置 API 密钥 (点击配置)'}</span>
        </div>
        <button
          onClick={onOpenConfig}
          aria-label="打开设置"
          className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition text-gray-300 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
