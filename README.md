<div align="center">

# 🎬 Flow Studio Pro

**电影工业级 AI 短视频与多模态视频流一站式工作台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Framework](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](#)

<p align="center">
  <b>从「AI灵感写稿 → 阿里云百炼配音 → 云端Whisper对齐 → 通义万相首帧生图 → Google Flow / Seedance 动力学运镜 → 剪映专业版草稿」全链路闭环</b><br/>
  打破传统 AI 短视频“静态图片慢推拉”的死板质感，以标准 I2V（图生视频）工业流水线驱动真实生成式视频创作。
</p>

</div>

---

## ✨ 核心特性

- 🧠 **双风格爆款口播 Writing-DNA**：内置历史叙事（追问反常、具体行动与代价）与传奇人物（情绪起伏、巅峰到磨难、金句收尾）双写作引擎，支持一键从 0 到 1 构思全文，并提供“强化前3秒黄金钩子”与“去AI味口播化”精修工具。
- 🎙️ **阿里云百炼语音合成 (DashScope TTS)**：深度整合 CosyVoice 与 Sambert 高表现力语音大模型，支持音色、语速、语调自由调节与声波律动播放。
- ⏱️ **高精度 Whisper 时间戳对齐**：支持云端/私有化 Whisper ASR 端点服务，毫秒级提取字戳与断句，自动聚合成符合短视频节奏的 4~7 秒标准分镜单元。
- 🎨 **通义万相 9:16 考据首帧生图**：调用通义万相大模型绘制 9:16 竖屏高水准首帧，锁定人物面孔、服饰形制与光影质感，彻底解决跨镜头画风与角色漂移。
- 🎥 **电影动力学提示词生成 (Motion Prompts)**：针对 Google Flow (Veo)、字节即梦 Seedance、可灵等主流 I2V 模型，自动生成专业的摄影机运镜与主体动作提示词（中英双语）。
- 🎞️ **剪映专业版草稿自适应插件**：基于微秒级工程装配协议，支持视频偏长智能裁切、微短无感慢放、动静混剪容错（未渲染视频镜头自动由首帧静态图推拉垫底），一键生成可二次编辑的本地草稿。

---

## 🛠️ 技术架构

```
┌────────────────────────────────────────────────────────┐
│      Next.js 14 App Router 纯全栈单体工作台             │
│  (React 18 + TypeScript + TailwindCSS + Framer Motion) │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 阿里云百炼    │   │ 云端 Whisper  │   │ 剪映草稿插件  │
│ (Qwen/Cosy/   │   │ (毫秒级 ASR   │   │ (时长自适应 / │
│  Wanx API)    │   │  时间戳对齐)  │   │  动静混剪装配)│
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 🚀 快速上手

### 1. 环境准备
- Node.js 18.17+ 或 20+
- (可选) Python 3.10+（若需直接导出本地剪映草稿工程，需安装 `plugins/jianying-draft/requirements.txt`）

### 2. 安装依赖
```bash
git clone <your-repo-url>
cd story-studio-web
npm install
```

### 3. 配置服务密钥
复制配置模板：
```bash
cp studio_config.template.json studio_config.json
```
在 `studio_config.json` 中配置你的阿里云百炼 API Key 及 Whisper 端点（亦可在启动后点击界面右上角 **设置图标 ⚙️** 进行可视化填写与保存）。

### 4. 启动工作台
- **Windows 用户**：直接双击 `start.bat`
- **命令行用户**：
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始创作。

---

## 📂 项目结构

```text
├── docs/                             # 架构与开发规划文档
│   ├── ARCHITECTURE_AND_PLAN.md      # 系统全套架构设计契约
│   ├── DEVELOPMENT_PLAN.md           # 5 大开发阶段与里程碑计划
│   └── prototype/index.html          # 高保真独立设计原型
├── plugins/                          # 插件目录
│   └── jianying-draft/               # 剪映草稿导出插件 (export.py)
├── src/                              # Next.js 全栈源码
│   ├── app/                          # App Router 路由与 API (tts, asr, wanx, script...)
│   ├── lib/                          # 核心算法 (pacing分镜聚合、dashscope引擎、asr)
│   ├── types/                        # TypeScript 强类型定义
│   └── styles/                       # 全局样式与电影质感定义
├── studio_config.template.json       # 统一配置模板
├── start.bat / start.ps1             # 一键启动脚本
└── package.json
```

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 开源协议。
