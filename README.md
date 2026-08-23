# Voca · 英语词汇学习 Web App

基于 **Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** 的英语词汇学习应用，采用 **Apple / iOS / iPadOS 原生 App 视觉语言**，支持 **中文 / English 双语界面**。

## 信息架构

```
Words（单词）
├── Vocabulary 单词本
│   ├── 专四 TEM-4（List 01/02/03，内置 60 词）
│   ├── 六级 CET-6（List 01/02，内置 40 词）
│   └── 我的单词 My Words（Daily）
├── Favorites 收藏
├── Mistakes 错题
└── Similar Words 易混词
```

- 单词本（Book）→ List → 单词 三层结构，**原始词书顺序（wordOrder）永久保留，不重排**
- 底部 Tab Bar：Today / Words / Review / Insights（iPhone）；iPad 为 Settings 风格侧边栏

## 功能

- **Today**：Today's Review 大数字 + 进度、连续天数、Difficult Words、AI Reading 入口（预留）
- **Review**：3D 翻转卡片背词（正面单词+音标+发音按钮，背面释义+例句），Again / Hard / Good / Easy 四档自评，简化版 SM-2 间隔重复，筛选 All / Due Today / Difficult / Mistakes / Favorites
- **发音**：Web Speech API（en-US / en-GB 可选，可关闭），Lucide Volume2 按钮，带播放反馈
- **Similar Words**：易混词组（borrow·lend、affect·effect、adapt·adopt·adept、economic 系列…），对比布局 + Key Difference + Practice 练习；任意单词详情可 **Add to Similar Words / New Group**
- **Mistakes**：错误词列表（Wrong × N），一键 Review Mistakes
- **Practice Test**：四选一测试（Word → Meaning / Meaning → Word）
- **Insights**：Day / Week / Month / Year 范围，Study Time / Words Reviewed / Accuracy / Streak，圆润趋势图 + 掌握度分布
- **Import Vocabulary 导入词库**：CSV / Excel(.xlsx) / TXT / 粘贴文本，导入前 Preview 确认，重复词库可选「更新现有 / 创建副本」，保留 Book / List / listOrder / wordOrder 原始顺序
  - CSV 列：`book,list,listOrder,wordOrder,word,phonetic,meaning,partOfSpeech,example`
  - TXT：`List 01` 等行标题自动分组，支持 `word, pos, meaning` 行格式
- **Settings**：Language（中文/English 即时切换）、Vocabulary（导入 + 每轮新词）、Appearance（Light/Auto/Dark + 12 种 Apple 系统色主题 + 随机）、Sound（发音开关 + 美音/英音）、Gemini API Key 预留位、本地存储导出/重置
- **i18n**：`src/lib/locales.ts`（zh-CN / en-US）统一文案，界面语言切换不刷新页面；**单词内容（释义等）不随界面语言变化**
- 数据持久化于浏览器 localStorage（含旧版扁平词库的自动迁移）

## 视觉系统（Apple Design Language）

- 纯白页面背景（`#FFFFFF`），极浅灰（`#F5F5F7`）仅用于分组/选择器/输入框等次级区域；Dark Mode 为标准 Apple 深色（黑底 + `#1C1C1E` 卡片）
- SF Pro / system-ui 字体栈；32px 大标题、17px 正文、克制的灰色层级
- 19pt 圆角 inset grouped list；10pt 胶囊按钮/输入框；14pt Popover；极轻阴影、极少分隔线
- iPhone：底部 Tab Bar + 安全区；iPad：分组侧边栏 + 更宽内容区
- 微动画：卡片 3D 翻转、页面淡入、Sheet 滑入、进度缓动

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
│   ├── word-sheet.tsx          # 单词详情 / 编辑 / 加入易混词（底部 Sheet）
│   ├── word-rows.tsx           # 单词列表行（保持原始顺序）
│   ├── import-vocab-sheet.tsx  # 词库导入流程（来源 → 预览 → 冲突处理）
│   └── ui/                     # shadcn/ui 组件（Select 按 Apple 风格重调）
├── lib/
│   ├── types.ts                # Book / List / Word / SimilarGroup / 全局状态
│   ├── seed-words.ts           # 内置词库（专四 / 六级 / 我的单词）
│   ├── confusables.ts          # 内置易混词组（10 组）
│   ├── import-vocab.ts         # CSV / Excel / TXT 解析
│   ├── locales.ts              # i18n 文案（zh-CN / en-US）
│   ├── i18n.ts                 # useT() 界面语言 hook
│   ├── accents.ts              # Apple 系统色主题预设（12 种）
│   ├── srs.ts                  # 间隔重复算法（简化版 SM-2）
│   └── speech.ts               # TTS 朗读（en-US / en-GB）
├── store/voca-context.tsx      # 全局状态 + 持久化 + 旧数据迁移 + 选择器
└── pages/                      # today / words / book / list / favorites /
                                # review / insights / similar / mistakes /
                                # test / settings
```

## 间隔重复（简化版 SM-2）

| 操作 | 间隔变化 |
| --- | --- |
| Again | 当天再学（间隔归零，遗忘 +1，记忆因子 −0.2） |
| Hard | 间隔 ×1.2（首次 1 天） |
| Good | 间隔 ×记忆因子（首次 1 天） |
| Easy | 间隔 ×记忆因子×1.3（首次 2 天） |

记忆因子初始 2.5，范围 [1.3, 3.0]；间隔 ≥ 21 天标记为 Mastered。
