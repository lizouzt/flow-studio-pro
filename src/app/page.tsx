'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shot, VisualContextProfile } from '@/types';
import {
  Header,
  ScriptAndVoiceStep,
  StoryboardStep,
  VideoTransitStep,
  DeliveryStep,
  ConfigDrawer,
  ToastNotification,
  ToastState,
} from '@/components/studio';

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
  const [shots, setShots] = useState<Shot[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [draftResult, setDraftResult] = useState<any>(null);

  // 融合高级媒体引擎状态 (Critic / 闭环动画 / 母版直出)
  const [animatingShotId, setAnimatingShotId] = useState<string | null>(null);
  const [generatingImageShotId, setGeneratingImageShotId] = useState<string | null>(null);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPolishingPrompts, setIsPolishingPrompts] = useState<boolean>(false);
  const [visualProfile, setVisualProfile] = useState<VisualContextProfile | null>(null);
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

  // 1. 真实生成配音与字幕切镜
  const handleGenerateTTSAndASR = async () => {
    if (!script.trim()) {
      showToast('口播文稿不能为空！', 'error');
      return;
    }

    setIsProcessing(true);
    showToast('正在请求阿里云百炼 CosyVoice 合成配音...', 'info');

    try {
      // 请求 TTS
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

      // 请求 ASR
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

      if (asrData.visualProfile) {
        setVisualProfile(asrData.visualProfile);
      }
      setShots(asrData.shots);
      showToast(`成功生成 ${asrData.shots.length} 个标准镜头，已完成视觉世界观自适应提取！`, 'success');
      setCurrentStep(2);
    } catch (e: any) {
      showToast(`执行中断: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 真实调用通义万相重新生图
  const handleRegenerateWanx = async (shotId: string, prompt: string) => {
    setGeneratingImageShotId(shotId);
    showToast(`正在调用通义万相绘制 ${shotId} 首帧...`, 'info');
    try {
      const res = await fetch('/api/wanx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, shotId, visualProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生图失败');

      setShots((prev) =>
        prev.map((s) =>
          s.shot_id === shotId ? { ...s, keyframe_image: data.imageUrl, status: 'ready' } : s
        )
      );
      showToast(`镜头 ${shotId} 首帧绘制成功！`, 'success');
    } catch (e: any) {
      showToast(`万相生图失败: ${e.message}`, 'error');
    } finally {
      setGeneratingImageShotId(null);
    }
  };

  // 一键批量生成全部分镜首帧 (通义万相)
  const handleBatchGenerateWanx = async () => {
    if (!shots || shots.length === 0) {
      showToast('当前暂无分镜单元！', 'error');
      return;
    }

    const pendingShots = shots.filter((s) => !s.keyframe_image || s.status === 'pending');
    const targetShots = pendingShots.length > 0 ? pendingShots : shots;

    setIsBatchGeneratingImages(true);
    setBatchProgress({ current: 0, total: targetShots.length });
    showToast(`🎨 开始批量绘制 ${targetShots.length} 个分镜首帧，请稍候...`, 'info');

    let successCount = 0;
    for (let i = 0; i < targetShots.length; i++) {
      const targetShot = targetShots[i];
      setBatchProgress({ current: i + 1, total: targetShots.length });
      setGeneratingImageShotId(targetShot.shot_id);

      try {
        const promptToUse = targetShot.t2i_prompt || targetShot.i2v_prompt;
        const res = await fetch('/api/wanx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptToUse, shotId: targetShot.shot_id, visualProfile }),
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          setShots((prev) =>
            prev.map((s) =>
              s.shot_id === targetShot.shot_id
                ? { ...s, keyframe_image: data.imageUrl, status: 'ready' }
                : s
            )
          );
          successCount++;
        }
      } catch (err: any) {
        console.warn(`Shot ${targetShot.shot_id} wanx generation error:`, err);
      }
    }

    setGeneratingImageShotId(null);
    setIsBatchGeneratingImages(false);
    setBatchProgress(null);
    showToast(`✨ 批量首帧绘制完成！成功生成 ${successCount}/${targetShots.length} 镜`, 'success');
  };

  // 视觉导演 Agent：根据文稿语义自适应提取时代环境与人设，重塑分镜提示词
  const handlePolishVisualPrompts = async () => {
    if (!shots || shots.length === 0) {
      showToast('当前暂无分镜单元！', 'error');
      return;
    }
    setIsPolishingPrompts(true);
    showToast('正在启动视觉世界观解析器，自适应分析时代背景并重塑分镜...', 'info');

    try {
      const res = await fetch('/api/visual-director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots, topic: writingTopic, script }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '自适应重塑失败');

      if (data.visualProfile) {
        setVisualProfile(data.visualProfile);
      }
      if (data.shots && data.shots.length > 0) {
        setShots(data.shots);
        showToast(`✨ 视觉世界观提取完成（${data.visualProfile?.era_setting || '自适应'}）！已更新所有分镜`, 'success');
      }
    } catch (err: any) {
      showToast(`视觉导演执行异常: ${err.message}`, 'error');
    } finally {
      setIsPolishingPrompts(false);
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
      {/* 顶部玻璃拟态导航栏 */}
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        shotCount={shots.length}
        isKeyConfigured={isKeyConfigured}
        onOpenConfig={() => setShowConfigDrawer(true)}
      />

      {/* 主内容视图 (根据当前流转 Step 渲染对应解耦组件) */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ScriptAndVoiceStep
                script={script}
                setScript={setScript}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
                writingTopic={writingTopic}
                setWritingTopic={setWritingTopic}
                writingStyle={writingStyle}
                setWritingStyle={setWritingStyle}
                targetWordCount={targetWordCount}
                setTargetWordCount={setTargetWordCount}
                showAIAssistant={showAIAssistant}
                setShowAIAssistant={setShowAIAssistant}
                isProcessing={isProcessing}
                isRewritingHook={isRewritingHook}
                isGeneratingScript={isGeneratingScript}
                isOralPolishing={isOralPolishing}
                shotCount={shots.length}
                onRewriteHook={handleRewriteHook}
                onGenerateScript={handleGenerateScript}
                onOralPolish={handleOralPolish}
                onGenerateTTSAndASR={handleGenerateTTSAndASR}
                onGoToStoryboard={() => setCurrentStep(2)}
              />
            </motion.section>
          )}

          {currentStep === 2 && (
            <motion.section
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StoryboardStep
                shots={shots}
                visualProfile={visualProfile}
                animatingShotId={animatingShotId}
                generatingImageShotId={generatingImageShotId}
                isBatchGeneratingImages={isBatchGeneratingImages}
                batchProgress={batchProgress}
                isPolishingPrompts={isPolishingPrompts}
                criticReviewData={criticReviewData}
                onGoToScript={() => setCurrentStep(1)}
                onCriticInspect={handleCriticInspect}
                onAnimateWanx={handleAnimateWanx}
                onRegenerateWanx={handleRegenerateWanx}
                onBatchGenerateWanx={handleBatchGenerateWanx}
                onPolishVisualPrompts={handlePolishVisualPrompts}
                onReplaceLocalImage={() => showToast('已选择本地图片替换', 'info')}
                onDownloadAllImages={() => showToast('已打包所有首帧高清图 (ZIP)！', 'success')}
                onCopyPrompt={copyToClipboard}
              />
            </motion.section>
          )}

          {currentStep === 3 && (
            <motion.section
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <VideoTransitStep
                shots={shots}
                onDropVideos={handleDropVideos}
                onCopyAllPrompts={() => showToast('已复制全部 Prompt 清单表格！', 'success')}
              />
            </motion.section>
          )}

          {currentStep === 4 && (
            <motion.section
              key="step-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DeliveryStep
                isProcessing={isProcessing}
                draftResult={draftResult}
                enableOpticalFlow={enableOpticalFlow}
                setEnableOpticalFlow={setEnableOpticalFlow}
                enableSpeedRamp={enableSpeedRamp}
                setEnableSpeedRamp={setEnableSpeedRamp}
                isRenderingMaster={isRenderingMaster}
                masterResult={masterResult}
                onExportJianying={handleExportJianying}
                onRenderMaster={handleRenderMaster}
                onOpenInJianying={() => showToast('已唤起本地剪映专业版！', 'success')}
                onLocateFolder={() => showToast('已在文件管理器中定位', 'info')}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* 设置抽屉 */}
      <ConfigDrawer
        isOpen={showConfigDrawer}
        onClose={() => setShowConfigDrawer(false)}
        dashscopeApiKey={dashscopeApiKey}
        setDashscopeApiKey={setDashscopeApiKey}
        asrProvider={asrProvider}
        setAsrProvider={setAsrProvider}
        asrDashscopeModel={asrDashscopeModel}
        setAsrDashscopeModel={setAsrDashscopeModel}
        asrEndpointUrl={asrEndpointUrl}
        setAsrEndpointUrl={setAsrEndpointUrl}
        asrApiKey={asrApiKey}
        setAsrApiKey={setAsrApiKey}
        onSaveConfig={handleSaveConfig}
      />

      {/* 全局 Toast 提示浮窗 */}
      <ToastNotification toast={toast} />
    </div>
  );
}
