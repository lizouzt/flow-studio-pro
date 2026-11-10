'use client';

import React from 'react';
import {
  Feather,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquareQuote,
  Mic,
  Sliders,
  Play,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ScriptAndVoiceStepProps {
  script: string;
  setScript: (val: string) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  writingTopic: string;
  setWritingTopic: (topic: string) => void;
  writingStyle: 'historical-narrative' | 'yuling-characterstory';
  setWritingStyle: (style: 'historical-narrative' | 'yuling-characterstory') => void;
  targetWordCount: number;
  setTargetWordCount: (count: number) => void;
  showAIAssistant: boolean;
  setShowAIAssistant: (show: boolean) => void;
  isProcessing: boolean;
  isRewritingHook: boolean;
  isGeneratingScript: boolean;
  isOralPolishing: boolean;
  shotCount: number;
  generatedAudioPath?: string;
  onRewriteHook: () => void;
  onGenerateScript: () => void;
  onOralPolish: () => void;
  onGenerateTTSAndASR: (force?: boolean) => void;
  onGoToStoryboard: () => void;
}

export const ScriptAndVoiceStep: React.FC<ScriptAndVoiceStepProps> = ({
  script,
  setScript,
  selectedVoice,
  setSelectedVoice,
  speechRate,
  setSpeechRate,
  writingTopic,
  setWritingTopic,
  writingStyle,
  setWritingStyle,
  targetWordCount,
  setTargetWordCount,
  showAIAssistant,
  setShowAIAssistant,
  isProcessing,
  isRewritingHook,
  isGeneratingScript,
  isOralPolishing,
  shotCount,
  generatedAudioPath,
  onRewriteHook,
  onGenerateScript,
  onOralPolish,
  onGenerateTTSAndASR,
  onGoToStoryboard,
}) => {
  const wordCount = script.replace(/\s+/g, '').length;
  const estimatedSeconds = Math.round(wordCount / 4.5 / speechRate);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 左侧：短视频口播创作编辑器 */}
      <div className="col-span-12 lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col gap-4">
        {/* 顶部标题与折叠开关 */}
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">短视频口播创作</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center gap-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showAIAssistant ? '收起 AI 写稿助手' : '展开 AI 写稿助手'}
              {showAIAssistant ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* AI 灵感写稿助手卡片 */}
        {showAIAssistant && (
          <div className="p-4 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> AI 从 0 到 1 灵感写稿 (Writing-DNA 引擎)
              </span>
              <span className="text-[10px] text-gray-400">通义千问驱动 · 自动搭建爆款结构</span>
            </div>

            {/* 题材输入 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={writingTopic}
                onChange={(e) => setWritingTopic(e.target.value)}
                placeholder="输入人物或历史故事 (如: 辛弃疾夜袭金营 / 传奇女性秦怡 / 孙传庭等)"
                className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-500 outline-none"
              />
            </div>

            {/* 风格与字数选择器 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">写作风格 (Writing-DNA)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWritingStyle('historical-narrative')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-left transition ${
                      writingStyle === 'historical-narrative'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-black/20 border-white/[0.06] text-gray-400 hover:text-white'
                    }`}
                  >
                    📜 历史叙事风
                    <div className="text-[9px] text-gray-500 font-normal">追问反常 · 严密因果</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWritingStyle('yuling-characterstory')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-left transition ${
                      writingStyle === 'yuling-characterstory'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-black/20 border-white/[0.06] text-gray-400 hover:text-white'
                    }`}
                  >
                    👩 传奇人物风
                    <div className="text-[9px] text-gray-500 font-normal">情绪起伏 · 金句收尾</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">目标篇幅 (包含开头钩子与金句)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { count: 600, label: '600 字', desc: '~1.5分钟' },
                    { count: 1000, label: '1000 字', desc: '~2.5分钟' },
                    { count: 1500, label: '1500 字', desc: '~3.5分钟' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setTargetWordCount(item.count)}
                      className={`p-1.5 rounded-lg text-xs font-medium border text-center transition ${
                        targetWordCount === item.count
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                          : 'bg-black/20 border-white/[0.06] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[9px] text-gray-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 一键撰写大按钮 */}
            <button
              type="button"
              disabled={isGeneratingScript}
              onClick={onGenerateScript}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-md shadow-amber-500/15 flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingScript ? 'animate-spin' : ''}`} />
              {isGeneratingScript ? '通义千问构思撰写中 (约 8-15 秒)...' : '🚀 一键 AI 撰写整篇爆款口播稿'}
            </button>
          </div>
        )}

        {/* 编辑区上方工具栏 */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <div className="flex items-center gap-3">
            <span>当前字数: <b className="text-white">{wordCount}</b> 字</span>
            <span>预计配音: <b className="text-amber-400">~{estimatedSeconds}</b> 秒</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isRewritingHook || !script.trim()}
              onClick={onRewriteHook}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-white/[0.08] flex items-center gap-1 transition disabled:opacity-40"
            >
              <Sparkles className={`w-3 h-3 ${isRewritingHook ? 'animate-spin' : ''}`} />
              {isRewritingHook ? '重塑中...' : '强化前3秒黄金钩子'}
            </button>
            <button
              disabled={isOralPolishing || !script.trim()}
              onClick={onOralPolish}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] flex items-center gap-1 transition disabled:opacity-40"
            >
              <MessageSquareQuote className={`w-3 h-3 ${isOralPolishing ? 'animate-spin' : ''}`} />
              {isOralPolishing ? '口播化中...' : '去 AI 味 / 口播化'}
            </button>
          </div>
        </div>

        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={13}
          placeholder="在此输入或通过上方 AI 自动生成短视频口播文案..."
          className="w-full bg-black/30 border border-white/[0.06] rounded-xl p-4 text-sm text-gray-200 leading-relaxed focus:outline-none focus:border-amber-500/50 resize-none font-mono"
        />

        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">基于定稿文案调用高品质语音引擎录制</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              ⚡内容指纹秒级缓存
            </span>
          </div>
          <div className="flex items-center gap-2">
            {generatedAudioPath && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onGenerateTTSAndASR(true)}
                title="强制穿透缓存，重新合成配音与对齐时间戳"
                className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                强制重配
              </button>
            )}
            <button
              disabled={isProcessing}
              onClick={() => onGenerateTTSAndASR(false)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              {isProcessing ? '正在真实处理中...' : '生成 AI 配音与时间戳'}
            </button>
          </div>
        </div>
      </div>

      {/* 右侧：AI 调音台 */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">AI 语音调音台</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AI Voice Ready
            </span>
          </div>

          {/* 音色卡片 */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">选择主播音色</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setSelectedVoice('longanyang')}
                className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition ${
                  selectedVoice === 'longanyang' || selectedVoice === 'longxiaochun'
                    ? 'border border-amber-500/50 bg-amber-500/10'
                    : 'border border-brand-border bg-white/[0.02] opacity-60'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">洋</div>
                <div>
                  <div className="text-xs font-semibold text-white">龙安洋 (推荐)</div>
                  <div className="text-[10px] text-gray-400">阳光青年 / 纪录片叙事解说</div>
                </div>
              </div>

              <div
                onClick={() => setSelectedVoice('longanhuan')}
                className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition ${
                  selectedVoice === 'longanhuan' || selectedVoice === 'longhua'
                    ? 'border border-amber-500/50 bg-amber-500/10'
                    : 'border border-brand-border bg-white/[0.02] opacity-60'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs">欢</div>
                <div>
                  <div className="text-xs font-semibold text-white">龙安欢 (元气)</div>
                  <div className="text-[10px] text-gray-400">欢脱女声 / 爆款情绪口播</div>
                </div>
              </div>
            </div>
          </div>

          {/* 语速滑块 */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>语速调节 (Speech Rate)</span>
              <span className="text-amber-400 font-mono">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-gray-700 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* 声波律动播放器 */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-black hover:bg-amber-400 transition">
              <Play className="w-4 h-4 fill-black" />
            </button>
            <div className="flex-1 flex items-end gap-1 h-6">
              {[0.1, 0.4, 0.2, 0.5, 0.3, 0.6, 0.2, 0.4, 0.1, 0.3].map((delay, idx) => (
                <span
                  key={idx}
                  className="wave-bar w-1 bg-amber-500 rounded-full"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-gray-400">音频就绪</span>
          </div>
        </div>

        {/* 时间戳状态面板 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">分镜镜头数量</div>
              <div className="text-[10px] text-gray-400">
                {shotCount > 0 ? `当前已有 ${shotCount} 个镜头` : '尚未对齐生成'}
              </div>
            </div>
          </div>
          {shotCount > 0 && (
            <button
              onClick={onGoToStoryboard}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center gap-1.5 transition"
            >
              查看分镜 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
