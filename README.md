# Voca · 英语词汇学习 Web App

一个基于 **Vite + React 19 + TypeScript + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)** 的英语词汇学习应用。内置 100 个按 CEFR 分级（A1–C1）的单词，支持间隔重复（简化版 SM-2）、卡片学习、快速测试与学习进度统计。

## 功能

- **首页仪表盘**：今日待复习、连续学习天数（streak）、每日目标进度、每日一词
- **单词本**：搜索 / 按级别和状态筛选，添加、编辑、删除自定义单词，一键朗读（Web Speech TTS）
- **卡片学习**：3D 翻转卡片，自评四档（不认识 / 有点印象 / 认识 / 很简单），简化版 SM-2 间隔重复自动安排下次复习，支持键盘快捷键（空格翻卡，1–4 评分）
- **快速测试**：四选一（看单词选释义 / 看释义选单词），即时反馈与答题回顾
- **学习进度**：掌握率、按级别分布、近 7 天复习量图表
- **其他**：深色 / 浅色 / 跟随系统主题，数据持久化在浏览器 `localStorage`，每日目标可自定义

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
| 发音 | 浏览器 Web Speech API（`speechSynthesis`） |

## 项目结构

```
src/
├── components/
│   ├── layout/app-layout.tsx   # 侧边栏 / 移动端顶栏布局
│   ├── theme-provider.tsx      # 主题切换（浅色/深色/系统）
│   ├── word-status-badge.tsx   # 单词状态徽章
│   └── ui/                     # shadcn/ui 组件
├── lib/
│   ├── types.ts                # 数据模型
│   ├── seed-words.ts           # 内置词库（100 词，A1–C1）
│   ├── srs.ts                  # 间隔重复算法（简化版 SM-2）
│   └── speech.ts               # TTS 朗读
├── store/voca-context.tsx      # 全局状态 + 持久化 + 选择器
├── pages/
│   ├── dashboard.tsx           # 首页
│   ├── words.tsx               # 单词本
│   ├── learn.tsx               # 卡片学习
│   ├── quiz.tsx                # 快速测试
│   └── progress.tsx            # 学习进度
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
