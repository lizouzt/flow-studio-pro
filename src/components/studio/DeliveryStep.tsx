'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Folder,
  Activity,
  Zap,
  Download,
} from 'lucide-react';

interface DeliveryStepProps {
  isProcessing: boolean;
  draftResult: any;
  enableOpticalFlow: boolean;
  setEnableOpticalFlow: (val: boolean) => void;
  enableSpeedRamp: boolean;
  setEnableSpeedRamp: (val: boolean) => void;
  isRenderingMaster: boolean;
  masterResult: any;
  onExportJianying: () => void;
  onRenderMaster: () => void;
  onOpenInJianying: () => void;
  onLocateFolder: () => void;
}

export const DeliveryStep: React.FC<DeliveryStepProps> = ({
  isProcessing,
  draftResult,
  enableOpticalFlow,
  setEnableOpticalFlow,
  enableSpeedRamp,
  setEnableSpeedRamp,
  isRenderingMaster,
  masterResult,
  onExportJianying,
  onRenderMaster,
  onOpenInJianying,
  onLocateFolder,
}) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 轨道 1: 剪映专业版工程导出 */}
      <div className="col-span-12 lg:col-span-6 glass-panel rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-brand-border pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">轨道 1：剪映专业版草稿工程</h2>
            <p className="text-[11px] text-gray-400">导出二次微调工程，保留字幕、音轨与时间轴</p>
          </div>
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/[0.06] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">智能时长自适应 (Time Stretch / Trim)</div>
              <div className="text-[10px] text-gray-400">微短视频平滑慢放，超长原速截取</div>
            </div>
            <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4 cursor-pointer" />
          </div>
          <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">动静混剪容错 (Hybrid Fallback)</div>
              <div className="text-[10px] text-gray-400">未生成的镜头自动用首帧静态图推拉垫底</div>
            </div>
            <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4 cursor-pointer" />
          </div>
        </div>

        <button
          disabled={isProcessing}
          onClick={onExportJianying}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {isProcessing ? '正在装配草稿...' : '构建剪映草稿工程'}
        </button>

        {draftResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2.5 text-xs"
          >
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{draftResult.draftPath ? '草稿已成功写入本地剪映目录！' : '工程数据已打包保存！'}</span>
            </div>
            <div className="bg-black/50 p-2.5 rounded-lg font-mono text-[11px] text-gray-300 break-all select-all">
              {draftResult.draftPath || draftResult.projectJsonPath}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onOpenInJianying}
                className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> 在剪映中打开
              </button>
              <button
                onClick={onLocateFolder}
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs text-white transition flex items-center gap-1"
              >
                <Folder className="w-3.5 h-3.5" /> 定位目录
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 轨道 2: 纯代码光流卡点 1080p 母版直出 */}
      <div className="col-span-12 lg:col-span-6 glass-panel rounded-2xl p-6 flex flex-col gap-5 border border-amber-500/30">
        <div className="flex items-center gap-3 border-b border-brand-border pb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-black flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              轨道 2：动感母版直出 (Code-as-Post-Production)
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Pro 引擎
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">FFmpeg 双向光流插值 (MCI) + Lanczos 1080p 升频压制</p>
          </div>
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/[0.06] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">MCI 双向运动补偿光流对齐</div>
              <div className="text-[10px] text-gray-400">消除传统慢动作的果冻效应与快动作跳帧</div>
            </div>
            <input
              type="checkbox"
              checked={enableOpticalFlow}
              onChange={(e) => setEnableOpticalFlow(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">⚡ 非线性 Speed Ramping 动感曲线</div>
              <div className="text-[10px] text-gray-400">冲刺起势 ➔ 重音定格凝固 ➔ 回弹恢复</div>
            </div>
            <input
              type="checkbox"
              checked={enableSpeedRamp}
              onChange={(e) => setEnableSpeedRamp(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        <button
          disabled={isRenderingMaster}
          onClick={onRenderMaster}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${isRenderingMaster ? 'animate-spin' : ''}`} />
          {isRenderingMaster ? '正在执行光流插值与压制 (请稍候)...' : '🚀 本地直出 1080p 动感母版'}
        </button>

        {masterResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2.5 text-xs"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                母版渲染完成！({masterResult.clipCount} 镜头串联)
              </span>
              <span className="text-[10px] font-mono text-gray-400">{masterResult.spec}</span>
            </div>
            <div className="bg-black/50 p-2.5 rounded-lg font-mono text-[11px] text-gray-300 break-all select-all">
              {masterResult.masterPath}
            </div>
            <div className="flex gap-2">
              <a
                href={masterResult.masterVideoUrl}
                download
                className="flex-1 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> 下载 1080p 成片
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
