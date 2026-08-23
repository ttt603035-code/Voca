# Voca · 英语词汇学习 Web App

基于 **Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** 的英语词汇学习应用，采用 **Apple / iOS / iPadOS 原生 App 视觉语言**，支持 **中文 / English 双语界面**。

## 词库架构（数据与 App 彻底分离）

```
public/vocabulary/          ← 词库数据（GitHub 项目内，只读）
├── index.json              ← 内置词书注册表（新增词书只需加 JSON + 注册）
├── tem4.json               ← 专四（测试数据）
└── cet6.json               ← 六级（测试数据）
        ↓
src/services/vocabulary.ts  ← Vocabulary Service（唯一读取入口）
        ↓
统一 Word 数据模型（src/lib/types.ts）
        ↓
Review / Favorites / Mistakes / Similar Words / Insights / UI
```

- **内置词库**（专四、六级…）：JSON 文件 → Service 读取 → 只读，不写入 localStorage
- **用户词库**（我的单词 / 导入的词书）：浏览器本地持久化，可增删改
- 词书结构固定为 **Book → List → Word**，`listOrder` / `wordOrder` 原始顺序永久保留
- 以后新增词书（如 IELTS）：`public/vocabulary/` 加 JSON + 在 `index.json` 注册，**无需改任何 React 代码**
- 代码中不包含任何词库数据（`src/` 内无单词数组）

## 信息架构

```
Words（单词）
├── Vocabulary 单词本
│   ├── 专四（内置，来自 tem4.json）
│   ├── 六级（内置，来自 cet6.json）
│   └── 我的单词 My Words（Reading / Writing / Daily，用户数据）
├── Favorites 收藏
├── Mistakes 错题
└── Similar Words 易混词
```

- 底部 Tab Bar：Today / Words / Review / Insights（iPhone）；iPad 为 Settings 风格侧边栏
- 内置词书中的单词可正常：收藏、进错题、加入易混词、进入 Review、间隔重复、发音

## 功能

- **Today**：Today's Review 大数字 + 进度、连续天数、Difficult Words、AI Reading 入口（预留）
- **Review**：3D 翻转卡片背词，Again / Hard / Good / Easy 四档自评，简化版 SM-2 间隔重复，筛选 All / Due Today / Difficult / Mistakes / Favorites
- **发音**：Web Speech API（en-US / en-GB 可选，可关闭），Lucide Volume2 按钮
- **Similar Words**：易混词组对比 + Key Difference + Practice 练习；单词详情可 Add to Similar Words / New Group
- **Mistakes**：错误词列表（Wrong × N），一键 Review Mistakes
- **Practice Test**：四选一测试（Word → Meaning / Meaning → Word）
- **Insights**：Day / Week / Month / Year，Study Time / Words Reviewed / Accuracy / Streak，圆润趋势图 + 掌握度分布
- **Import Vocabulary**：仅用于用户词库（CSV / Excel / TXT / 粘贴），Preview 确认；与内置词书同名时自动创建副本
- **Settings**：Language（中文/English 即时切换）、Vocabulary（导入 + 每轮新词）、Appearance（Light/Auto/Dark + 12 种 Apple 系统色 + 随机）、Sound、Gemini API Key 预留位、导出/重置
- **i18n**：`src/lib/locales.ts`（zh-CN / en-US）统一文案；单词内容不随界面语言变化

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 生产构建
```

## 项目结构

```
public/vocabulary/          # 内置词库 JSON（数据层）
src/
├── services/vocabulary.ts  # 内置词库读取服务
├── types/vocabulary.ts     # 词库 JSON 类型
├── components/
│   ├── kit/                # Apple 设计系统原语 + 图表
│   ├── layout/             # TabBar / SideNav / AppLayout
│   ├── word-sheet.tsx      # 单词详情 / 编辑 / 加入易混词
│   ├── word-rows.tsx       # 单词列表行（保持原始顺序）
│   ├── import-vocab-sheet.tsx
│   └── ui/                 # shadcn/ui 组件
├── lib/
│   ├── types.ts            # 统一 Book / List / Word / 全局状态
│   ├── confusables.ts      # 内置易混词组
│   ├── import-vocab.ts     # CSV / Excel / TXT 解析
│   ├── locales.ts          # i18n 文案
│   ├── i18n.ts             # useT()
│   ├── accents.ts          # 主题色预设
│   ├── srs.ts              # 间隔重复（简化版 SM-2）
│   └── speech.ts           # TTS
├── store/voca-context.tsx  # 全局状态（用户数据持久化 + 内置词库异步合并 + 旧数据迁移）
└── pages/                  # today / words / book / list / favorites /
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
