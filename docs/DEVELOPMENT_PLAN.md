# Flow Studio Pro · 项目开发计划与里程碑
## Development Plan & Milestones

---

## 一、 开发阶段与里程碑总览

| 阶段 | 核心目标 | 交付物 | 状态 |
| :--- | :--- | :--- | :--- |
| **Phase 1: Next.js 全栈工程初始化** | 初始化 Next.js 14 App Router、Tailwind CSS、配置深色电影微质感主题 | • 全栈单体工程就绪<br>• 全局暗色调主题与微动效配置<br>• 全局配置加载模块 | ✅ 已完成 |
| **Phase 2: 服务端 API 路由与百炼/云端接入** | 实现通义千问 Writing-DNA 写稿、百炼 TTS、云端 Whisper ASR、万相首帧生图、镜头聚合器 | • `/api/generate-script`<br>• `/api/rewrite-hook`<br>• `/api/tts`<br>• `/api/asr`<br>• `/api/wanx` | ✅ 已完成 |
| **Phase 3: 可选剪映草稿插件开发** | 封装 `plugins/jianying-draft/` 为独立可选微插件，支持自适应对齐与动静混剪 | • 剪映插件脚本 `export.py`<br>• `/api/export/jianying` 插件路由<br>• 无依赖纯素材打包通道 | ✅ 已完成 |
| **Phase 4: 电影级前端工作台 UI 实现** | 构建 4 步流转看板、分镜卡片流、拖拽回填、波形图与一键导出 | • 电影暗色主题 UI 页面<br>• 百炼调音台<br>• 9:16 分镜卡片看板<br>• 全景视频拖拽 Dropzone | ✅ 已完成 |
| **Phase 5: 端到端闭环与极简部署交付** | 真实业务链路测试、开箱即用体验调优、一键启动脚本 | • 全流程测试验证<br>• `npm run dev` / `start.bat` 单命令一键运行 | ✅ 已完成 |
