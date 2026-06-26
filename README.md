# 2026 世界杯预测网站

Astro 静态站骨架。

## 内容来源

默认读取共享盘：

```text
D:\我的坚果云\fwc2026
```

可以用环境变量覆盖：

```text
FWC_SHARED_ROOT=D:\我的坚果云\fwc2026
```

## 当前已实现

- 首页读取 `data/matches/matches.seed.json`
- 读取 reviewed 预测和推演 JSON
- 三天日期选择器
- 比赛预测卡
- 预测 / 推演 / 玄学 / 专题列表页
- Markdown 详情页路由

## 运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```
