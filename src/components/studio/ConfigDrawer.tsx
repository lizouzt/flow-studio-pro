'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X } from 'lucide-react';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dashscopeApiKey: string;
  setDashscopeApiKey: (val: string) => void;
  asrProvider: 'dashscope_asr' | 'faster_whisper' | 'custom_whisper';
  setAsrProvider: (provider: 'dashscope_asr' | 'faster_whisper' | 'custom_whisper') => void;
  asrDashscopeModel: string;
  setAsrDashscopeModel: (val: string) => void;
  asrEndpointUrl: string;
  setAsrEndpointUrl: (val: string) => void;
  asrApiKey: string;
  setAsrApiKey: (val: string) => void;
  onSaveConfig: () => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  dashscopeApiKey,
  setDashscopeApiKey,
  asrProvider,
  setAsrProvider,
  asrDashscopeModel,
  setAsrDashscopeModel,
  asrEndpointUrl,
  setAsrEndpointUrl,
  asrApiKey,
  setAsrApiKey,
  onSaveConfig,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-88 max-w-full h-full glass-panel border-l border-brand-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" /> 服务与 API 配置
                </h3>
                <button onClick={onClose} aria-label="关闭设置" className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-300">
                      AI 引擎服务密钥 (API Key) <span className="text-amber-400">*</span>
                    </label>
                    {dashscopeApiKey && dashscopeApiKey.includes('•') && (
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        已安全配置 (已脱敏)
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={dashscopeApiKey}
                    onFocus={() => {
                      if (dashscopeApiKey.includes('•')) {
                        setDashscopeApiKey('');
                      }
                    }}
                    onChange={(e) => setDashscopeApiKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">支持接入百炼 DashScope、Deepdance、Gemini、Stable Diffusion 等标准化三方多模态驱动（密钥已安全脱敏）</p>
                </div>

                {/* ASR 语音识别引擎驱动切换 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    语音识别对齐引擎 (ASR Provider)
                  </label>
                  <select
                    value={asrProvider}
                    onChange={(e) => setAsrProvider(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="dashscope_asr">🌟 云端托管高精识别 (qwen-audio-3.1-asr · 免本地显卡/免部署)</option>
                    <option value="faster_whisper">⚡ faster-whisper-server (本地/局域网私有化服务)</option>
                    <option value="custom_whisper">🌐 自定义 OpenAI 兼容 Whisper 端点</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {asrProvider === 'dashscope_asr'
                      ? '复用上方云端 Key，自动通过临时存储解析毫秒级时间戳，完全无需本地显卡与额外服务。'
                      : '通过标准 OpenAI 规范 (POST /v1/audio/transcriptions) 接入本地或云端服务。'}
                  </p>
                </div>

                {asrProvider === 'dashscope_asr' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      ASR 语音转写模型标识
                    </label>
                    <input
                      type="text"
                      placeholder="qwen-audio-3.1-asr-flash-filetrans"
                      value={asrDashscopeModel}
                      onChange={(e) => setAsrDashscopeModel(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      推荐：<code className="text-amber-400">qwen-audio-3.1-asr-flash-filetrans</code> (旗舰非实时转写) 或 <code className="text-amber-400">paraformer-v2</code>
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Whisper ASR 端点 URL <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="http://127.0.0.1:8000/v1/audio/transcriptions"
                        value={asrEndpointUrl}
                        onChange={(e) => setAsrEndpointUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        本地 faster-whisper-server 默认端点通常为：http://127.0.0.1:8000/v1/audio/transcriptions
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-300">
                          Whisper API Key (可选)
                        </label>
                        {asrApiKey && asrApiKey.includes('•') && (
                          <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            已安全配置 (已脱敏)
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        placeholder="若本地 faster-whisper-server 无鉴权可留空"
                        value={asrApiKey}
                        onFocus={() => {
                          if (asrApiKey.includes('•')) {
                            setAsrApiKey('');
                          }
                        }}
                        onChange={(e) => setAsrApiKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">剪映草稿导出模式</label>
                  <select className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none">
                    <option>本地 Python 插件 (pyJianYingDraft)</option>
                    <option>仅导出工程数据包 (JSON/ZIP)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg bg-white/[0.06] text-gray-300 text-xs hover:bg-white/[0.1] transition"
              >
                取消
              </button>
              <button
                onClick={onSaveConfig}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition"
              >
                保存并生效
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
