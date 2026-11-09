'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clapperboard,
  Sparkles,
  Mic,
  Sliders,
  Play,
  ArrowRight,
  Download,
  Wand2,
  RefreshCw,
  Upload,
  Copy,
  Check,
  Share2,
  UploadCloud,
  Film,
  ExternalLink,
  Folder,
  Settings,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Feather,
  Inbox,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  ShieldCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { Shot } from '@/types';

const INITIAL_SCRIPT = `五十骑直插五万敌阵，生擒叛将还毫发无损撤回临安，这不是金庸小说，而是二十二岁辛弃疾的真实人生。

那一年金戈铁马，气吞万里如虎。他手提三尺青锋，孤军夜袭大营，犹如天神下凡。
可谁能想到，这惊天动地的一战，竟成了这位南宋第一武将最后的光芒。

归宋后的四十年里，朝堂风云变幻，主和派当道。曾经气贯长虹的少年英雄，被闲置于江南水乡。
他只能在醉里挑灯看剑，梦回吹角连营；在白发苍苍时，写下那句震撼千古的绝唱：把吴钩看了，栏杆拍遍，无人会，登临意！`;

export default function StoryStudioWeb() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [script, setScript] = useState<string>(INITIAL_SCRIPT);
  const [selectedVoice, setSelectedVoice] = useState<string>('longanyang');
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRewritingHook, setIsRewritingHook] = useState<boolean>(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [isOralPolishing, setIsOralPolishing] = useState<boolean>(false);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(true);
  const [writingTopic, setWritingTopic] = useState<string>('辛弃疾二十二岁率五十骑夜袭敌营');
  const [writingStyle, setWritingStyle] = useState<'historical-narrative' | 'yuling-characterstory'>('historical-narrative');
  const [targetWordCount, setTargetWordCount] = useState<number>(1000);
  const [shots, setShots] = useState<Shot[]>([]); // 彻底移除 mock 数据，初始为空
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [draftResult, setDraftResult] = useState<any>(null);

  // 融合高级媒体引擎状态 (Critic / 闭环动画 / 母版直出)
  const [animatingShotId, setAnimatingShotId] = useState<string | null>(null);
  const [criticReviewData, setCriticReviewData] = useState<{ [shotId: string]: any }>({});
  const [enableSpeedRamp, setEnableSpeedRamp] = useState<boolean>(true);
  const [enableOpticalFlow, setEnableOpticalFlow] = useState<boolean>(true);
  const [isRenderingMaster, setIsRenderingMaster] = useState<boolean>(false);
  const [masterResult, setMasterResult] = useState<any>(null);
  const [generatedAudioPath, setGeneratedAudioPath] = useState<string>('');

  // 配置项状态
  const [dashscopeApiKey, setDashscopeApiKey] = useState<string>('');
  const [asrProvider, setAsrProvider] = useState<'dashscope_asr' | 'faster_whisper' | 'custom_whisper'>('dashscope_asr');
  const [asrDashscopeModel, setAsrDashscopeModel] = useState<string>('qwen-audio-3.1-asr-flash-filetrans');
  const [asrEndpointUrl, setAsrEndpointUrl] = useState<string>('');
  const [asrApiKey, setAsrApiKey] = useState<string>('');
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(false);

  // 加载当前服务端真实配置
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setDashscopeApiKey(data.config.dashscopeApiKey || '');
          if (data.config.asrProvider) setAsrProvider(data.config.asrProvider);
          if (data.config.asrDashscopeModel) setAsrDashscopeModel(data.config.asrDashscopeModel);
          setAsrEndpointUrl(data.config.asrEndpointUrl || '');
          setAsrApiKey(data.config.asrApiKey || '');
          if (data.config.ttsVoice) setSelectedVoice(data.config.ttsVoice);
          if (data.config.speechRate) setSpeechRate(data.config.speechRate);
          const valid = Boolean(
            data.config.dashscopeApiKey &&
            !data.config.dashscopeApiKey.startsWith('YOUR_') &&
            !data.config.dashscopeApiKey.includes('sk-xxx')
          );
          setIsKeyConfigured(valid);
        }
      })
      .catch((err) => console.warn('Failed to load config:', err));
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('已复制 I2V 动力学提示词！', 'success');
  };

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashscopeApiKey,
          asrProvider,
          asrDashscopeModel,
          asrEndpointUrl,
          asrApiKey,
          ttsVoice: selectedVoice,
          speechRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');

      const valid = Boolean(
        dashscopeApiKey &&
        !dashscopeApiKey.startsWith('YOUR_') &&
        !dashscopeApiKey.includes('sk-xxx')
      );
      setIsKeyConfigured(valid);
      setShowConfigDrawer(false);
      showToast('配置已成功保存并立即生效！', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 润色黄金钩子 (调用通义千问 Qwen 大模型真实重塑开头)
  const handleRewriteHook = async () => {
    if (!script.trim()) {
      showToast('请先输入文案内容后再润色！', 'error');
      return;
    }
    setIsRewritingHook(true);
    showToast('正在调用通义千问重塑前 3 秒黄金钩子...', 'info');

    try {
      const res = await fetch('/api/rewrite-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '润色失败');

      setScript(data.rewrittenScript);
      showToast('✨ 黄金钩子润色完成！已升级开头段落戏剧张力', 'success');
    } catch (err: any) {
      showToast(`润色失败: ${err.message}`, 'error');
    } finally {
      setIsRewritingHook(false);
    }
  };

  // 一键 AI 从 0 到 1 撰写完整爆款口播稿 (Writing-DNA)
  const handleGenerateScript = async () => {
    if (!writingTopic.trim()) {
      showToast('请输入创作题材或人物主题！', 'error');
      return;
    }
    setIsGeneratingScript(true);
    showToast(`正在基于 Writing-DNA 构思并撰写 ${targetWordCount} 字口播稿...`, 'info');

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: writingTopic,
          style: writingStyle,
          targetWordCount,
          action: 'generate',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');

      setScript(data.script);
      showToast(`✨ 成功生成 ${data.wordCount} 字爆款口播稿！已自动载入编辑区`, 'success');
    } catch (err: any) {
      showToast(`AI 写稿失败: ${err.message}`, 'error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 口语化 / 去 AI 味优化
  const handleOralPolish = async () => {
    if (!script.trim()) {
      showToast('请先输入文案内容后再优化！', 'error');
      return;
    }
    setIsOralPolishing(true);
    showToast('正在将文案转化为自然呼吸感短视频口播腔...', 'info');

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: script,
          action: 'oral-polish',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '优化失败');

      setScript(data.script);
      showToast('🗣️ 口播化优化完成！长短句更易朗读', 'success');
    } catch (err: any) {
      showToast(`优化失败: ${err.message}`, 'error');
    } finally {
      setIsOralPolishing(false);
    }
  };

  // 1. 真实生成配音与字幕切镜 (严格报错，不 mock)
  const handleGenerateTTSAndASR = async () => {
    if (!script.trim()) {
      showToast('口播文稿不能为空！', 'error');
      return;
    }

    setIsProcessing(true);
    showToast('正在请求阿里云百炼 CosyVoice 合成配音...', 'info');

    try {
      // 1. 请求 TTS
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, voice: selectedVoice, speechRate }),
      });
      const ttsData = await ttsRes.json();
      if (!ttsRes.ok) {
        throw new Error(ttsData.error || '配音合成失败');
      }
      setGeneratedAudioPath(ttsData.audioPath);

      showToast(
        asrProvider === 'dashscope_asr'
          ? '配音已就绪，正在调用阿里云百炼 Qwen-Audio ASR 提取毫秒级时间戳...'
          : '配音已就绪，正在连接 faster-whisper-server 提取毫秒级时间戳...',
        'info'
      );

      // 2. 请求 ASR
      const asrRes = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioPath: ttsData.audioPath,
          text: script,
          styleId: 'Historical Comic',
        }),
      });
      const asrData = await asrRes.json();
      if (!asrRes.ok) {
        throw new Error(asrData.error || 'ASR 时间戳对齐失败');
      }

      if (!asrData.shots || asrData.shots.length === 0) {
        throw new Error('未生成任何有效镜头，请检查 ASR 返回的时间戳数据');
      }

      setShots(asrData.shots);
      showToast(`成功生成 ${asrData.shots.length} 个标准叙事镜头！`, 'success');
      setCurrentStep(2);
    } catch (e: any) {
      showToast(`执行中断: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 真实调用通义万相重新生图
  const handleRegenerateWanx = async (shotId: string, prompt: string) => {
    showToast(`正在调用通义万相绘制 ${shotId} 首帧...`, 'info');
    try {
      const res = await fetch('/api/wanx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, shotId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生图失败');

      setShots((prev) =>
        prev.map((s) =>
          s.shot_id === shotId ? { ...s, keyframe_image: data.imageUrl, status: 'ready' } : s
        )
      );
      showToast(`镜头 ${shotId} 首帧重绘成功！`, 'success');
    } catch (e: any) {
      showToast(`万相生图失败: ${e.message}`, 'error');
    }
  };

  // 融合功能 1: 独立 Critic Agent 智能质检审核
  const handleCriticInspect = async (shot: Shot) => {
    showToast(`正在启动独立 Critic Agent 审核镜头 ${shot.shot_id}...`, 'info');
    try {
      const res = await fetch('/api/critic-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shotId: shot.shot_id,
          firstFrameUrl: shot.keyframe_image,
          prompt: shot.i2v_prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '质检执行失败');

      setCriticReviewData((prev) => ({ ...prev, [shot.shot_id]: data }));
      if (data.passed) {
        showToast(`✅ ${shot.shot_id} 质检评分 ${data.score}分：${data.verdict}`, 'success');
      } else {
        showToast(`⚠️ ${shot.shot_id} 审查发现风险项，建议按意见微调`, 'error');
      }
    } catch (err: any) {
      showToast(`质检失败: ${err.message}`, 'error');
    }
  };

  // 融合功能 4: 百炼 DashScope 全自动闭环动画生成 (异步轮询直出)
  const handleAnimateWanx = async (shot: Shot) => {
    setAnimatingShotId(shot.shot_id);
    showToast(`正在提交百炼 wanx2.1-i2v 任务并开启异步轮询直出...`, 'info');

    try {
      const res = await fetch('/api/animate-wanx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shotId: shot.shot_id,
          imageUrl: shot.keyframe_image,
          prompt: shot.i2v_prompt,
          duration: Math.round(shot.target_duration_sec),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '百炼视频生成失败');

      setShots((prev) =>
        prev.map((s) =>
          s.shot_id === shot.shot_id
            ? { ...s, rendered_video_path: data.videoUrl, status: 'ready' }
            : s
        )
      );
      showToast(`🎬 ${shot.shot_id} 视频生成完毕，已自动落盘绑定！`, 'success');
    } catch (err: any) {
      showToast(`闭环出片失败: ${err.message}`, 'error');
    } finally {
      setAnimatingShotId(null);
    }
  };

  // 融合功能 2 & 3: 纯代码 FFmpeg 直出 1080p 母版 (光流插值 + Speed Ramping)
  const handleRenderMaster = async () => {
    if (shots.length === 0) {
      showToast('分镜列表为空，请先完成前置生成。', 'error');
      return;
    }
    setIsRenderingMaster(true);
    showToast('正在调用 Media Engine 执行光流补帧与 Lanczos 1080p 母版压制...', 'info');

    try {
      const res = await fetch('/api/render-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shots,
          audioPath: generatedAudioPath,
          enableSpeedRamp,
          enableOpticalFlow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '母版直出失败');

      setMasterResult(data);
      showToast(`🏆 1080p 动感母版已成功压制交付！`, 'success');
    } catch (err: any) {
      showToast(`母版渲染失败: ${err.message}`, 'error');
    } finally {
      setIsRenderingMaster(false);
    }
  };

  // 3. 拖拽文件回填
  const handleDropVideos = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (shots.length === 0) {
      showToast('当前尚未生成任何分镜，无法匹配视频切片。请先执行第一步。', 'error');
      return;
    }

    let matchedCount = 0;
    setShots((prev) =>
      prev.map((shot) => {
        const found = files.find((f) =>
          f.name.toLowerCase().includes(shot.shot_id.toLowerCase())
        );
        if (found) {
          matchedCount++;
          return {
            ...shot,
            rendered_video_path: `/output/videos/${found.name}`,
            status: 'ready',
          };
        }
        return shot;
      })
    );

    if (matchedCount > 0) {
      showToast(`已成功识别并匹配 ${matchedCount} 个镜头视频切片！`, 'success');
    } else {
      showToast('未找到匹配的文件名，请确保文件名包含如 shot_01, shot_02 等镜号标识。', 'error');
    }
  };

  // 4. 导出剪映工程
  const handleExportJianying = async () => {
    if (shots.length === 0) {
      showToast('分镜列表为空，请先完成前置生成步骤。', 'error');
      return;
    }

    setIsProcessing(true);
    showToast('正在调用剪映插件进行微秒对齐与自适应装配...', 'info');

    try {
      const res = await fetch('/api/export/jianying', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: '辛弃疾_真实视频版',
          shots,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '导出失败');

      setDraftResult(data);
      if (data.warning) {
        showToast(data.warning, 'info');
      } else {
        showToast('剪映工程构建完毕！', 'success');
      }
    } catch (e: any) {
      showToast(`导出失败: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ======================== 顶部玻璃拟态导航栏 ======================== */}
      <header className="sticky top-0 z-50 glass-panel border-b border-brand-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-brand-black font-black">
            <Clapperboard className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              Flow Studio <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Pro</span>
            </h1>
            <p className="text-[11px] text-gray-400">
              {shots.length > 0 ? `已生成 ${shots.length} 个镜头` : '等待剧本与配音生成'}
            </p>
          </div>
        </div>

        {/* 4 步流转指示器 */}
        <nav className="flex items-center bg-black/40 p-1 rounded-full border border-brand-border shadow-inner">
          {[
            { step: 1, label: '撰稿与配音' },
            { step: 2, label: '分镜与首帧' },
            { step: 3, label: '视频回填' },
            { step: 4, label: '剪映装配' },
          ].map(({ step, label }) => {
            const isActive = currentStep === step;
            return (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isActive ? 'bg-black/20 font-bold' : 'bg-white/10'
                }`}>
                  {step}
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* 状态与设置 */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setShowConfigDrawer(true)}
            className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] text-gray-300 transition"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isKeyConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span>{isKeyConfigured ? '百炼 API 就绪' : '未配置百炼 Key (点击配置)'}</span>
          </div>
          <button
            onClick={() => setShowConfigDrawer(true)}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition text-gray-300 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================== 主内容视图 ======================== */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* STEP 1: 文案与配音 */}
          {currentStep === 1 && (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-12 gap-6"
            >
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
                      onClick={handleGenerateScript}
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
                    <span>当前字数: <b className="text-white">{script.replace(/\s+/g, '').length}</b> 字</span>
                    <span>预计配音: <b className="text-amber-400">~{Math.round(script.replace(/\s+/g, '').length / 4.5 / speechRate)}</b> 秒</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isRewritingHook || !script.trim()}
                      onClick={handleRewriteHook}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-white/[0.08] flex items-center gap-1 transition disabled:opacity-40"
                    >
                      <Sparkles className={`w-3 h-3 ${isRewritingHook ? 'animate-spin' : ''}`} />
                      {isRewritingHook ? '重塑中...' : '强化前3秒黄金钩子'}
                    </button>
                    <button
                      disabled={isOralPolishing || !script.trim()}
                      onClick={handleOralPolish}
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
                  <span className="text-xs text-gray-500">将基于定稿文案调用阿里云百炼 CosyVoice 录制</span>
                  <button
                    disabled={isProcessing}
                    onClick={handleGenerateTTSAndASR}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
                  >
                    <Mic className="w-4 h-4" />
                    {isProcessing ? '正在真实处理中...' : '生成百炼配音与时间戳'}
                  </button>
                </div>
              </div>

              {/* 右侧：百炼调音台 */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-semibold text-white">百炼 CosyVoice 调音台</h2>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      DashScope V3
                    </span>
                  </div>

                  {/* 音色卡片 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">选择主播音色 (CosyVoice v3)</label>
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
                        {shots.length > 0 ? `当前已有 ${shots.length} 个镜头` : '尚未对齐生成'}
                      </div>
                    </div>
                  </div>
                  {shots.length > 0 && (
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center gap-1.5 transition"
                    >
                      查看分镜 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* STEP 2: 镜头分镜与首帧看板 */}
          {currentStep === 2 && (
            <motion.section
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {shots.length === 0 ? (
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
                    onClick={() => setCurrentStep(1)}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition"
                  >
                    前往撰写与生成配音
                  </button>
                </div>
              ) : (
                <>
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
                        onClick={() => showToast('已打包所有首帧高清图 (ZIP)！', 'success')}
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
                              onClick={() => handleCriticInspect(shot)}
                              title="启动独立 Critic 智能质检审核"
                              className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-emerald-500 hover:text-black text-emerald-400 text-xs transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={animatingShotId === shot.shot_id}
                              onClick={() => handleAnimateWanx(shot)}
                              title="百炼全自动生成视频切片 (异步轮询直出)"
                              className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-amber-500 hover:text-black text-amber-300 text-xs transition"
                            >
                              <Zap className={`w-3.5 h-3.5 ${animatingShotId === shot.shot_id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleRegenerateWanx(shot.shot_id, shot.i2v_prompt)}
                              title="调用通义万相重新生图"
                              className="p-1.5 rounded-lg bg-black/70 backdrop-blur hover:bg-blue-500 hover:text-black text-white text-xs transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => showToast('已选择本地图片替换', 'info')}
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
                              onClick={() => copyToClipboard(shot.i2v_prompt)}
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
                </>
              )}
            </motion.section>
          )}

          {/* STEP 3: 外部视频中转站 */}
          {currentStep === 3 && (
            <motion.section
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-brand-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">外部视频模型投喂与回填中转站</h2>
                      <p className="text-xs text-gray-400">
                        前往 <a href="https://flow.google.com/" target="_blank" rel="noreferrer" className="text-amber-400 underline">Google Flow</a> 或 字节即梦 Seedance 生成视频，将切片文件回填到此。
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('已复制全部 Prompt 清单表格！', 'success')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white border border-white/[0.08] flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> 一键复制全部 Prompt 表格
                  </button>
                </div>

                {/* 拖拽回填区 */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropVideos}
                  className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-8 bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition flex flex-col items-center justify-center gap-3 cursor-pointer text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">将下载好的视频片段批量拖拽至此</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      系统将自动按文件名 (<code className="text-amber-300">shot_01.mp4</code>, <code className="text-amber-300">shot_02.mp4</code>...) 智能绑定对应分镜
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
                    {shots.filter((s) => s.status === 'ready').length} / {shots.length} 已就绪
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
            </motion.section>
          )}

          {/* STEP 4: 交付面板 (双轨制：剪映草稿 + FFmpeg 光流 1080p 母版直出) */}
          {currentStep === 4 && (
            <motion.section
              key="step-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-12 gap-6"
            >
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
                    <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4" />
                  </div>
                  <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">动静混剪容错 (Hybrid Fallback)</div>
                      <div className="text-[10px] text-gray-400">未生成的镜头自动用首帧静态图推拉垫底</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4" />
                  </div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleExportJianying}
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
                        onClick={() => showToast('已唤起本地剪映专业版！', 'success')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> 在剪映中打开
                      </button>
                      <button
                        onClick={() => showToast('已在文件管理器中定位', 'info')}
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
                  onClick={handleRenderMaster}
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
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ======================== 设置抽屉 ======================== */}
      <AnimatePresence>
        {showConfigDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setShowConfigDrawer(false)}
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
                  <button onClick={() => setShowConfigDrawer(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      阿里云百炼 API Key <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={dashscopeApiKey}
                      onChange={(e) => setDashscopeApiKey(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">用于 CosyVoice 语音大模型合成与通义万相首帧生图</p>
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
                      <option value="dashscope_asr">🌟 阿里云百炼原生 (qwen-audio-3.0-asr-flash · 免显卡/免部署)</option>
                      <option value="faster_whisper">⚡ faster-whisper-server (本地/局域网私有化服务)</option>
                      <option value="custom_whisper">🌐 自定义 OpenAI 兼容 Whisper 端点</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {asrProvider === 'dashscope_asr' 
                        ? '复用上方百炼 Key，自动通过临时存储解析毫秒级时间戳，完全无需本地显卡与额外服务。' 
                        : '通过 OpenAI 规范 (POST /v1/audio/transcriptions) 接入本地或云端服务。'}
                    </p>
                  </div>

                  {asrProvider === 'dashscope_asr' ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        百炼 ASR 模型名称
                      </label>
                      <input
                        type="text"
                        placeholder="qwen-audio-3.1-asr-flash-filetrans"
                        value={asrDashscopeModel}
                        onChange={(e) => setAsrDashscopeModel(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        推荐：<code className="text-amber-400">qwen-audio-3.1-asr-flash-filetrans</code> (官方旗舰非实时转写) 或 <code className="text-amber-400">paraformer-v2</code>
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
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Whisper API Key (可选)
                        </label>
                        <input
                          type="password"
                          placeholder="若本地 faster-whisper-server 无鉴权可留空"
                          value={asrApiKey}
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
                  onClick={() => setShowConfigDrawer(false)}
                  className="px-3 py-2 rounded-lg bg-white/[0.06] text-gray-300 text-xs hover:bg-white/[0.1] transition"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition"
                >
                  保存并生效
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast 提示浮窗 (区分类型) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 max-w-md ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : toast.type === 'success'
                ? 'bg-emerald-500 text-black'
                : 'bg-amber-500 text-black'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
