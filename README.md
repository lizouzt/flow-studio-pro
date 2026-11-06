<div align="center">

# 🎬 Flow Studio Pro

**电影工业级 AI 短视频与多模态视频流一站式工作台 (融合导演引擎版)**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](LICENSE)
[![Framework](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](#)

<p align="center">
  <b>融合「爆款故事写作 + 阿里百炼双向闭环 + 独立Critic智能质检 + 双向光流插值 + Speed Ramping动感曲线 + 剪映/1080p母版双轨交付」</b><br/>
  将极客级代码化后期（Code-as-Post-Production）与高直观度 WebUI 完美融合，赋能真正电影级生成式短视频创作。
</p>

</div>

---

## ✨ 核心融合矩阵

- 🧠 **双模爆款口播 Writing-DNA**：通义千问驱动的“历史叙事”与“传奇人物”双写作引擎，支持从 0 到 1 自动起草全文、强化前 3 秒黄金钩子与口语化去 AI 味。
- 🎙️ **阿里云百炼高表现力配音 (DashScope TTS)**：CosyVoice 深度融合，支持真实音色、语速调节与声波律动试听。
- ⏱️ **云端/私有化 Whisper 毫秒级对齐**：毫秒级提取字戳与断句，自动聚合成符合短视频叙事节奏的 4~7 秒标准分镜。
- 🛡️ **独立 Critic Agent 智能质检 (新融合)**：自动执行负向歧义词审查、首尾帧像素长宽比与透视检测，前置拦截模型乱画与穿帮风险。
- ⚡ **百炼 DashScope 全自动闭环出片 (新融合)**：一键直调 `wanx2.1-i2v-plus` 异步轮询任务，自动下载落盘绑定视频切片，告别手动跨网页倒腾素材。
- 🌊 **MCI 双向运动补偿光流对齐 (新融合)**：启用高级重叠块运动补偿（AOBMC），彻底消除变速拉伸时的果冻效应与快动作跳帧。
- 🚀 **非线性 Speed Ramping 动感曲线 (新融合)**：冲刺起势 ➔ 重音停顿凝固 ➔ 回弹释放，赋予短视频大片级视觉张力。
- 🎞️ **双轨制工程交付**：
  - **轨道 1**：剪映专业版本地草稿工程（保留字幕与时间轴，便于二次微调）；
  - **轨道 2**：纯代码 FFmpeg 直出 1080p Lanczos 升频动感母版（免剪映，本地一键下片）。

---

## 🛠️ 融合后系统架构

```
┌────────────────────────────────────────────────────────┐
│      Next.js 14 App Router 纯全栈单体工作台             │
│  (React 18 + TypeScript + TailwindCSS + Framer Motion) │
└───────────────────────────┬────────────────────────────┘
                            │
   ┌────────────────────────┼────────────────────────┐
   ▼                        ▼                        ▼
【百炼 DashScope 生态】  【云端 Whisper ASR】    【Media Engine 后期引擎】
 • Qwen-plus (写作)       • 毫秒级字戳对齐       • Critic 提示词与差分质检
 • CosyVoice (配音)       • 4~7s 镜头聚合        • 双向光流插值 (MCI/AOBMC)
 • Wanx-t2i (首帧)                               • 非线性 Speed Ramping
 • Wanx2.1-i2v (闭环动画)                        • 剪映草稿 / Lanczos 1080p母版
```

---

## 🚀 快速上手

### 1. 安装依赖
```bash
git clone <your-repo-url>
cd story-studio-web
npm install
```

### 2. 启动工作台
- **Windows 用户**：直接双击 `start.bat`
- **命令行用户**：
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始创作。

---

## 📄 开源许可证与商业授权

- **开源协议**：本项目开源版本采用 **[GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)** 协议。
- **商业授权 (Commercial License)**：如果您希望将本项目闭源商用、集成入企业私有商业产品或作为商业 SaaS 运营而无需开源您的专有业务代码，请联系获取专有的商业免开源许可授权。
