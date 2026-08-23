# Voca · 英语词汇学习 Web App

一个基于 **Vite + React 19 + TypeScript + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)** 的英语词汇学习应用。内置 100 个按 CEFR 分级（A1–C1）的单词，支持间隔重复（简化版 SM-2）、卡片学习、快速测试、近义词辨析与学习趋势统计。

## 功能

- **主页仪表盘**：今日待复习、连续学习天数、每日目标进度、每日一词
- **单词本**：搜索 / 按级别和状态筛选，添加、编辑、删除自定义单词，一键朗读（Web Speech TTS）
- **卡片学习**：3D 翻转卡片，四档自评（不认识 / 有点印象 / 认识 / 很简单），简化版 SM-2 间隔重复，键盘快捷键（空格翻卡，1–4 评分）
- **快速测试**：四选一（看单词选释义 / 看释义选单词），即时反馈与答题回顾
- **近义词辨析**：8 组易混淆词（borrow/lend、say/tell、affect/effect、raise/rise、lay/lie、weather/whether、quiet/silent、watch/look），逐组辨析 + 选词填空练习
- **学习进度**：掌握率、按级别分布、正确率
- **学习趋势**：今日/累计词量与学习时长统计、词量分布堆叠柱状图（学习/复习/未来待复习）、学习时长平滑曲线（近 7 日 / 近 14 日）
- **设置**：浅色/深色/跟随系统主题、11 种柔和主题色（含随机切换）、每日目标、Gemini API Key 预留位、数据导出（JSON）与重置
- **左侧抽屉目录**：P1 风格分组导航（计划/练习/统计/系统），支持字母快捷键（H / W / C / Q / N / P / T / S）
- **其他**：学习时长自动统计（卡片 + 测试）、数据持久化在浏览器 `localStorage`

## 快速开始

```bash
npm install
npm run dev      # 开发服务器，默认 http://localhost:5173
npm run build    # 类型检查 + 生产构建
```

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React 19 + react-router v7（客户端路由） |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite`）+ shadcn/ui（Radix UI 原语 + Lucide 图标） |
| 状态 | React Context + `useReducer`，`localStorage` 持久化 |
| 图表 | 手写 SVG / 堆叠柱状图（无图表依赖） |
| 发音 | 浏览器 Web Speech API（`speechSynthesis`） |

## 项目结构

```
src/
├── components/
│   ├── layout/app-layout.tsx   # 顶栏 + 左侧抽屉目录 + 快捷键 + 主题色同步
│   ├── charts/                 # 堆叠柱状图 / 平滑趋势折线图（SVG）
│   ├── theme-provider.tsx      # 主题切换（浅色/深色/系统）
│   ├── word-status-badge.tsx   # 单词状态徽章
│   └── ui/                     # shadcn/ui 组件
├── lib/
│   ├── types.ts                # 数据模型
│   ├── seed-words.ts           # 内置词库（100 词，A1–C1）
│   ├── confusables.ts          # 易混淆词组数据（8 组 + 24 道填空）
│   ├── accents.ts              # 柔和主题色预设（11 种，可随机）
│   ├── srs.ts                  # 间隔重复算法（简化版 SM-2）
│   └── speech.ts               # TTS 朗读
├── store/voca-context.tsx      # 全局状态 + 持久化 + 选择器
├── pages/
│   ├── dashboard.tsx           # 主页
│   ├── words.tsx               # 单词本
│   ├── learn.tsx               # 卡片学习
│   ├── quiz.tsx                # 快速测试
│   ├── confusables.tsx         # 近义词辨析
│   ├── progress.tsx            # 学习进度
│   ├── trends.tsx              # 学习趋势
│   └── settings.tsx            # 设置
└── App.tsx                     # 路由
```

## 间隔重复策略（简化版 SM-2）

| 自评 | 间隔变化 |
| --- | --- |
| 不认识 | 当天再学（间隔归零，遗忘次数 +1，记忆因子 −0.2） |
| 有点印象 | 间隔 ×1.2（首次为 1 天） |
| 认识 | 间隔 ×记忆因子（首次 1 天） |
| 很简单 | 间隔 ×记忆因子×1.3（首次 2 天） |

记忆因子初始 2.5，范围 [1.3, 3.0]；间隔达到 21 天后标记为「已掌握」。
