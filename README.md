# Voca · 英语词汇学习 Web App

基于 **Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** 的英语词汇学习应用，采用 **Apple / iOS / iPadOS 原生 App 视觉语言**（即使运行在桌面浏览器中也保持移动 App 观感）。

## 功能

- **Today**：Today's Review 大数字 + 简洁进度、连续学习天数、Difficult Words、AI Reading 入口（预留）
- **Words**：Apple 风格分组列表（单词 + 释义 + 轻量状态 + 收藏），搜索，Book / Status / Sort 统一 Apple Select，单词详情 / 编辑 / 删除（底部 Sheet）
- **Review**：沉浸式一次一词，点按显示释义，底部 Again / Hard / Good / Easy 大触控区；筛选 All / Due Today / Difficult / Mistakes / Favorites；简化版 SM-2 间隔重复
- **Insights**：Day / Week / Month / Year 范围选择（Apple Select），Study Time / Words Reviewed / Accuracy / Current Streak 指标块，圆润趋势图（柱状 + 面积），掌握度分布
- **Similar Words**：8 组易混淆词（affect·effect、borrow·lend、raise·rise、lay·lie…），清晰对比布局 + Key Difference + Practice 填空练习
- **Mistakes**：错误词 Apple 列表（Wrong × N），一键跳转 Review 错题模式
- **Practice Test**：四选一测试（Word → Meaning / Meaning → Word）
- **Settings**：Theme（Light / Auto / Dark 分段控件）、Apple 系统色主题色（12 种 + 随机）、Daily Goal 步进器、Gemini API Key 预留位、本地存储大小 / 导出 JSON / 重置

## 视觉系统（Apple Design Language）

- iOS 色板：`#F2F2F7` 分组背景 / `#1C1C1E` 前景 / `#8E8E93` 次级 / `#E3E3E8` 分隔线（深色模式对应 `#000 / #1C1C1E / #2C2C2E / #38383A`）
- SF Pro / system-ui 字体栈；32px 大标题、17px 正文、克制的灰色层级
- 19pt 圆角 inset grouped list（不用 Card 化一切）；10pt 圆角胶囊按钮 / 输入框；14pt 圆角 Popover
- 极轻阴影、极少分隔线、大量留白
- iPhone：底部 Tab Bar（Today / Words / Review / Insights）+ 安全区
- iPad：Settings 风格分组侧边栏 + 宽内容区（Split View 逻辑）
- 微动画：页面淡入上移、Sheet 滑入、Select 缩放淡入、进度条缓动

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 生产构建
```

## 项目结构

```
src/
├── components/
│   ├── kit/primitives.tsx      # Apple 设计系统原语（LargeTitle / InsetGroup / ListRow /
│   │                           #   SearchField / AppleButton / Segmented / Stepper / AppleAlert…）
│   ├── kit/charts.tsx          # Apple 风格图表（圆角柱状 / 面积曲线 / 占比条）
│   ├── layout/                 # TabBar (iPhone) / SideNav (iPad) / AppLayout
│   ├── word-sheet.tsx          # 单词详情 + 编辑底部 Sheet
│   ├── ui/                     # shadcn/ui 组件（Select 已按 Apple 风格重调）
├── lib/
│   ├── seed-words.ts           # 内置词库（100 词，A1–C1）
│   ├── confusables.ts          # 易混淆词组（8 组 + 24 道填空）
│   ├── accents.ts              # Apple 系统色主题预设（12 种）
│   ├── srs.ts                  # 间隔重复算法（简化版 SM-2）
│   └── speech.ts               # TTS 朗读
├── store/voca-context.tsx      # 全局状态 + localStorage 持久化
└── pages/                      # today / words / review / insights / similar /
                                # mistakes / test / settings
```

## 间隔重复（简化版 SM-2）

| 操作 | 间隔变化 |
| --- | --- |
| Again | 当天再学（间隔归零，遗忘 +1，记忆因子 −0.2） |
| Hard | 间隔 ×1.2（首次 1 天） |
| Good | 间隔 ×记忆因子（首次 1 天） |
| Easy | 间隔 ×记忆因子×1.3（首次 2 天） |

记忆因子初始 2.5，范围 [1.3, 3.0]；间隔 ≥ 21 天标记为 Mastered。
