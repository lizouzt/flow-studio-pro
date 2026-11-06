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

## 🛠️ 本地工具与环境依赖说明

Flow Studio Pro 主体为 **Next.js 纯全栈单体架构**。我们对依赖实施了**“按需解耦”**设计：

| 依赖组件 | 必须程度 | 核心用途 | 安装方式 / 命令 |
| :--- | :---: | :--- | :--- |
| **Node.js 18+ 或 20+** | **必需** | 驱动整套 Next.js 生产工作台、页面渲染与 API 路由调度 | 官网下载安装：[nodejs.org](https://nodejs.org/) |
| **Python 3.10+** | **可选插件** | 驱动 `pyJianYingDraft` 剪映草稿装配，以及首尾帧差异图质检 | 安装 Python 并执行：`pip install -r requirements.txt` |
| **FFmpeg 5.0+** | **可选插件** | 驱动【轨道 2】的 MCI 双向光流插值、Speed Ramping 动感曲线与 1080p 母版直出 | Windows 执行：`winget install Gyan.FFmpeg`<br>macOS 执行：`brew install ffmpeg` |

> 💡 **提示**：即使你的机器没有安装 Python 和 FFmpeg，基础的核心流程（AI 写稿、百炼配音、Whisper 时间戳切镜、万相首帧生图、百炼闭环 I2V 视频生成）**依然 100% 能够正常运转**！

---

## 🚀 极速安装与启动

### 方式 1：一键全自动检测安装（推荐）
- **Windows 用户**：直接双击运行 **`setup.bat`**
- **macOS / Linux 用户**：终端进入项目目录运行：
  ```bash
  chmod +x setup.sh start.sh
  ./setup.sh
  ```
脚本会自动依次检测 Node.js、自动安装 npm 依赖、检测并安装 Python 插件依赖，并自动生成配置文件模板。

### 方式 2：命令行手动部署

#### 1. 安装前端 Web 依赖
```bash
npm install
```

#### 2. (可选) 安装 Python 插件依赖
如果你需要直接导出剪映草稿或使用光流直出母版：
```bash
pip install -r requirements.txt
```

#### 3. 配置服务密钥（二选一）
- **方式 A（推荐 .env 文件）**：复制 [.env.example](.env.example) 为 `.env`：
  ```bash
  cp .env.example .env
  ```
  在 `.env` 中填入你的 `DASHSCOPE_API_KEY` 与 `WHISPER_ENDPOINT_URL`。
- **方式 B（JS 配置文件）**：直接编辑 [studio_config.js](studio_config.js)，内含极为详细的参数取值注释。
- **方式 C（界面可视化配置）**：启动后直接在浏览器右上角点击 **设置图标 ⚙️** 进行可视化填写与保存。

#### 4. 启动工作台
- **双击脚本**：运行 `start.bat`
- **命令行启动**：
  ```bash
  npm run dev
  ```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始创作。

---

## 📁 项目目录结构

```text
├── docs/                             # 架构与开发规划文档
│   ├── ARCHITECTURE_AND_PLAN.md      # 系统全套架构设计契约
│   ├── DEVELOPMENT_PLAN.md           # 5 大开发阶段与里程碑计划
│   └── prototype/index.html          # 高保真独立设计原型
├── plugins/                          # 扩展插件
│   ├── jianying-draft/               # 剪映草稿导出插件 (export.py)
│   └── media-engine/                 # FFmpeg 光流变速与母版压制引擎 (engine.py)
├── src/                              # Next.js 全栈源码
│   ├── app/                          # App Router 路由与 API (tts, asr, wanx, script...)
│   ├── lib/                          # 核心算法 (pacing分镜聚合、dashscope引擎、asr)
│   ├── types/                        # TypeScript 强类型定义
│   └── styles/                       # 全局样式与电影质感定义
├── .env.example                      # 环境变量配置模板
├── studio_config.js                  # 带详细注释的 JS 核心配置文件
├── requirements.txt                  # Python 扩展依赖清单
├── setup.bat                         # 一键环境检测与依赖安装器
├── start.bat / start.ps1             # 一键启动脚本
└── package.json
```

---

## 📄 开源许可证与商业授权

- **开源协议**：本项目开源版本采用 **[GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)** 协议。
- **商业授权 (Commercial License)**：如果您希望将本项目闭源商用、集成入企业私有商业产品或作为商业 SaaS 运营而无需开源您的专有业务代码，请联系获取专有的商业免开源许可授权。
