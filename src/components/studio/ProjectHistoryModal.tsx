'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderClock,
  X,
  RefreshCw,
  Film,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
} from 'lucide-react';

export interface ProjectSummary {
  fileName: string;
  projectName: string;
  shotCount: number;
  readyVideoCount: number;
  totalDurationSec: number;
  updatedAt: number;
  allVideosReady: boolean;
}

interface ProjectHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreProject: (projectData: any) => void;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  isOpen,
  onClose,
  onRestoreProject,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.warn('Failed to load project history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleSelectProject = async (fileName: string) => {
    setRestoringFile(fileName);
    try {
      const res = await fetch(`/api/projects?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (res.ok && data.project) {
        onRestoreProject(data.project);
        onClose();
      } else {
        alert(data.error || '恢复工程失败');
      }
    } catch (err: any) {
      alert(`恢复失败: ${err.message}`);
    } finally {
      setRestoringFile(null);
    }
  };

  const handleUploadLocalJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.shots && Array.isArray(parsed.shots)) {
          onRestoreProject(parsed);
          onClose();
        } else {
          alert('无效的工程文件格式：缺少 shots 分镜数组');
        }
      } catch (err: any) {
        alert(`解析 JSON 失败: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const formatTime = (ms: number) => {
    const date = new Date(ms);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh]"
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <FolderClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    历史项目工程与任务恢复
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    随时读取恢复此前已生成的分镜、视频切片与配音，无缝进入下一步
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={loading}
                  onClick={fetchProjects}
                  title="刷新列表"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 本地上传快速入口 */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>从本机直接载入工程描述 JSON：</span>
              </div>
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs text-white transition flex items-center gap-1.5 font-medium">
                <span>浏览本地文件</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleUploadLocalJson}
                />
              </label>
            </div>

            {/* 项目列表容器 */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px]">
              {loading && projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span className="text-xs">正在扫描已保存的项目工程...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                  <FolderClock className="w-8 h-8 opacity-40" />
                  <span className="text-xs">暂未发现已保存的项目工程文件</span>
                </div>
              ) : (
                projects.map((proj) => {
                  const isRestoring = restoringFile === proj.fileName;
                  return (
                    <div
                      key={proj.fileName}
                      className="p-4 rounded-xl bg-black/40 border border-white/[0.06] hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                            {proj.projectName}
                          </span>
                          {proj.allVideosReady ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 全部视频切片已就绪
                            </span>
                          ) : proj.readyVideoCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                              {proj.readyVideoCount}/{proj.shotCount} 视频就绪
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 text-[10px]">
                              仅分镜首帧
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                          <span className="flex items-center gap-1 text-gray-300">
                            <Film className="w-3 h-3 text-amber-400" /> {proj.shotCount} 镜头
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {proj.totalDurationSec}s
                          </span>
                          <span>{formatTime(proj.updatedAt)}</span>
                          <span className="text-gray-500 truncate max-w-[140px]" title={proj.fileName}>
                            {proj.fileName}
                          </span>
                        </div>
                      </div>

                      <button
                        disabled={isRestoring}
                        onClick={() => handleSelectProject(proj.fileName)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md sm:w-auto w-full ${
                          proj.allVideosReady
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-black shadow-emerald-500/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                        }`}
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>正在恢复...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>恢复并继续</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* 底部信息提示 */}
            <div className="text-[11px] text-gray-400 border-t border-brand-border pt-3 flex items-center justify-between">
              <span>恢复后将自动还原所有分镜、时间轴及本地切片，免去重复渲染等待。</span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
