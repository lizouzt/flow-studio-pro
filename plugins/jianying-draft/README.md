# 剪映专业版草稿导出插件 (JianYing Draft Exporter Plugin)

这是 Flow Studio Pro 的**可选扩展插件**。

## 功能特性
- **微秒级帧对齐**：使用 `pyJianYingDraft` 写入本地剪映专业版工程草稿；
- **时长自适应对齐**：视频偏长截取（原速 Trim）、微短慢放（0.88x~1.0x）；
- **动静混剪降级（Hybrid Fallback）**：未生成的镜头自动以首帧图片占位垫底，保证草稿 100% 成功生成。

## 依赖与安装 (可选)
如果需要直接导出剪映草稿，需在本机安装：
```bash
pip install -r requirements.txt
```
*(注：若未安装 Python 环境，Story Studio Web 仍支持导出通用素材包 ZIP，不阻碍全流程使用。)*
