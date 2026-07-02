# 2026 世界杯预测网站

Astro 静态站。移动端优先，首页展示赛程、预测卡片、实际比分、让球盘和数据浏览指标；底部栏目包含首页、预测、推演、价值、玄学、专题。

## 内容来源

本地开发默认读取共享盘：

```text
D:\我的坚果云\fwc2026
```

可以用环境变量覆盖根目录。该根目录必须同时包含 `data/` 和 `content/`：

```text
FWC_SHARED_ROOT=D:\我的坚果云\fwc2026
FWC_DATA_ROOT=D:\我的坚果云\fwc2026
```

Publisher / CI 使用站点内镜像时，应指向 `src`：

```text
FWC_DATA_ROOT=<repo>/worldcup-prediction-site/src
```

## 当前已实现

- 首页读取 `data/matches/matches.seed.json`。
- 读取 reviewed 预测、推演、玄学、专题、赛果 JSON。
- 支持 `data/results/reviewed/*.json` 的 90 分钟比分、让球盘、加时和点球字段。
- 首页比赛卡显示预测比分、备选比分、置信度、推演比分、大球概率、让球盘；只有已有 90 分钟比分时才显示实际比分。
- 命中率从 `2026-06-24` 开始，只统计已有 90 分钟比分的比赛。
- 三天日期选择器；首页入口按北京时间 13:00 在浏览器端自动跳到下一比赛日，具体日期页不强制跳转。
- 预测 / 推演 / 玄学 / 专题列表页和 Markdown 详情页。
- 赔率价值评估模型页面 `/value/`，读取 `data/value/reviewed/*.json`，仅展示影子盘研究信号。
- GitHub Pages base path：`/worldcup-prediction-site`。

## 运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

当前 Windows 环境如果 `npm` shim 异常，可使用：

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build --cache .\.npm-cache
```
## 赔率价值模型

生成 value signal：

```powershell
node scripts/generate-value-signals.mjs
```

共享盘生成：

```powershell
$env:FWC_DATA_ROOT='D:\我的坚果云\fwc2026'
node scripts/generate-value-signals.mjs
```

输入合同见 `contracts/schemas/odds.schema.json`，输出合同见 `contracts/schemas/value_signal.schema.json`。页面和数据只用于研究，不构成投注建议。