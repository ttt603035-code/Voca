# Voca · 英语词汇学习 Web App

基于 **Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** 的英语词汇学习应用，采用 **Apple / iOS / iPadOS 原生 App 视觉语言**，支持 **中文 / English 双语界面**。

## 词库架构（数据与 App 彻底分离）

```
public/vocabulary/          ← 词库数据（GitHub 项目内，只读）
├── index.json              ← 内置词书注册表（新增词书只需加 JSON + 注册）
├── tem4.json               ← 专四（华研专四词汇突破8000：4,646 词 / 44 组，顺序与用户源文件一致）
└── cet6.json               ← 六级（测试数据）
        ↓
src/services/vocabulary.ts  ← Vocabulary Service（唯一读取入口）
        ↓
统一 Word 数据模型（src/lib/types.ts）
        ↓
Review / Favorites / Mistakes / Similar Words / Insights / UI
```

- **内置词库**（专四、六级…）：JSON 文件 → Service 读取 → 只读，不写入 localStorage
- **专四词书来源**：《华研专四词汇突破8000》（`华研专四词汇突破8000.txt` / `.csv`），单词顺序、分组、释义完全跟随用户源文件（Part I~IV 共 36 个 Lesson + 附录2 热词 8 类 = 44 组 / 4,646 词）；音标由考纲词表补充
- **用户词库**（我的单词 / 导入的词书）：浏览器本地持久化，可增删改
- 词书结构固定为 **Book → List → Word**，`listOrder` / `wordOrder` 原始顺序永久保留
- 以后新增词书（如 IELTS）：`public/vocabulary/` 加 JSON + 在 `index.json` 注册，**无需改任何 React 代码**
- 代码中不包含任何词库数据（`src/` 内无单词数组）

## 信息架构

```
Words（单词）
├── Vocabulary 单词本
│   ├── 专四（内置，来自 tem4.json，华研专四词汇突破8000）
│   ├── 六级（内置，来自 cet6.json）
│   └── 我的单词 My Words（Reading / Writing / Daily，用户数据）
├── Favorites 收藏
├── Mistakes 错题
└── Similar Words 易混词
```

- 底部 Tab Bar：Today / Words / Review / Insights（iPhone）；iPad 为 Settings 风格侧边栏
- 内置词书中的单词可正常：收藏、进错题、加入易混词、进入 Review、间隔重复、发音

## 功能

- **Today**：学习概况（今日学习/复习/时长 + 累计词数/时长）、Today's Review 大数字 + 进度、连续天数、学习趋势（7/30/90 天：学习词数/复习词数/待复习词数堆叠柱 + 学习时长曲线）、Difficult Words、AI Reading 入口（预留）
- **Review**：3D 翻转卡片背词，Again / Hard / Good / Easy 四档自评，简化版 SM-2 间隔重复；筛选 All / Due Today / Difficult / Mistakes / Favorites；**范围化 Practice**（单个 List / 整个词书 Practice All + 范围 Select：All words / Unmastered / Due for Review / Mistakes / Favorites / Similar Words Practice All）；完成后 **StudyHub 清透风格完成弹窗**（Words reviewed / Mastered / Need review / Study time / Accuracy + Review Again / Review Difficult Words）；每次 Practice 记录会话（日期/时长/范围/词数/正确率）
- **Words**：单词本（专四/六级/我的单词）→ List（词数 + 状态：Not started / Recently studied / N% mastered + 轻进度条 + 单 List Practice）→ Word（行内发音/收藏/掌握状态）
- **Mistakes 错题本**：真实错题历史（word/date/session/book/list/wrong count），按日期分组（Today / 08-22…），点日期看当天错词 + Practice Again，词行显示错 N 次 + Last wrong
- **Similar Words 易混词**：分类（拼写相似/词形相似/意义混淆/我创建的）Select 筛选、词组收藏（心形）、New Group（单词详情或页面 + 号）、组内对比 + Key Difference + Practice this group、Practice All（All / Unmastered / Mistakes / Favorites）
- **Favorites**：收藏单词 + 收藏易混词组
- **发音**：Web Speech API（en-US / en-GB 可选，可关闭），Lucide Volume2 按钮
- **Similar Words**：易混词组对比 + Key Difference + Practice 练习；单词详情可 Add to Similar Words / New Group
- **Mistakes**：错误词列表（Wrong × N），一键 Review Mistakes
- **Practice Test**：四选一测试（Word → Meaning / Meaning → Word）
- **Insights**：最近 7/30/90 天 Select，Study Time / Words Reviewed / Accuracy / Current Streak，圆润趋势图（学习词数/复习词数/待复习 + 学习时长）+ 掌握度分布 + 错题入口
- **Import Vocabulary**：仅用于用户词库（CSV / Excel / TXT / 粘贴），Preview 确认；与内置词书同名时自动创建副本
- **Settings**：Language（中文/English 即时切换）、Vocabulary（导入 + 每轮新词）、Appearance（Light/Auto/Dark + 12 种 Apple 系统色 + 随机）、Sound（发音开关 + 美音/英音）、Gemini API Key 预留位、导出/重置
- **i18n**：`src/lib/locales.ts`（zh-CN / en-US）统一文案（Today/Words/Review/Insights/Practice/完成页/错题/易混词/空状态/错误提示全覆盖）；单词内容不随界面语言变化

## 视觉方向（Apple 交互 + StudyHub 清透视觉）

- 纯白背景 + 极浅灰分组层级；柔和圆角（10/14/19/22pt）；极轻阴影
- 弹窗/Sheet/Select 统一清透语言：背景轻遮罩 + backdrop blur、白色半透明毛玻璃面板、无厚重边框
- 隐藏滚动条、iOS 触控反馈（active 态）、iPhone/iPad 优先
- 不用橙色教育 App 视觉、不用 Sidebar、不用 SaaS Dashboard 风格

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产构建
```

## 部署

构建产物是纯静态站点（`dist/`），可放到任意静态托管：

- **GitHub Pages / 任意子路径**：`vite.config.ts` 使用 `base: "./"`，路由为 `HashRouter`（`/#/words`），刷新不会 404。
- **Vercel**：根目录已含 `vercel.json` SPA rewrite。
- **Netlify**：根目录已含 `netlify.toml` 与 `public/_redirects`。

用户数据走安全 `localStorage` 包装；隐私模式或存储不可用时降级为内存态，避免白屏。

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
│   ├── types.ts            # 统一 Book / List / Word / SessionRecord / 全局状态
│   ├── confusables.ts      # 内置易混词组（含分类）
│   ├── import-vocab.ts     # CSV / Excel / TXT 解析
│   ├── trends.ts           # 趋势窗口计算（7/30/90 天 + 待复习）
│   ├── locales.ts          # i18n 文案
│   ├── i18n.ts             # useT() + 时长/日期格式化
│   ├── accents.ts          # 主题色预设
│   ├── srs.ts              # 间隔重复（简化版 SM-2）
│   ├── speech.ts           # TTS
│   └── storage.ts          # 安全 localStorage（隐私模式降级）
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
