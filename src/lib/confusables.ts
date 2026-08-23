/** 易混淆词组数据：形近 / 义近 / 音近的单词归类与辨析 */

export interface ConfusableWord {
  word: string
  ipa: string
  pos: string
  meaning: string
  /** 一句话区分 */
  diff: string
}

export interface ConfusableSentence {
  /** 带 ___ 空缺的英文句子 */
  text: string
  /** 正确答案（组内单词的原形） */
  answer: string
  zh: string
}

export interface ConfusableGroup {
  id: string
  title: string
  emoji: string
  /** 组内单词 */
  words: ConfusableWord[]
  /** 核心区分技巧 */
  tip: string
  /** 练习句（从组内单词中选词填空） */
  sentences: ConfusableSentence[]
}

export const CONFUSABLE_GROUPS: ConfusableGroup[] = [
  {
    id: "borrow-lend",
    title: "借：borrow vs lend",
    emoji: "🔄",
    words: [
      {
        word: "borrow",
        ipa: "/ˈbɔːroʊ/",
        pos: "v.",
        meaning: "借入（把东西拿过来用）",
        diff: "borrow from sb：从某人处借来",
      },
      {
        word: "lend",
        ipa: "/lend/",
        pos: "v.",
        meaning: "借出（把东西给别人用）",
        diff: "lend sth to sb：把某物借给某人",
      },
    ],
    tip: "方向相反：borrow 是“借进来”，lend 是“借出去”。",
    sentences: [
      {
        text: "Can I ___ your pen? I'll return it after class.",
        answer: "borrow",
        zh: "我能借你的笔吗？下课后还你。",
      },
      {
        text: "She will ___ you $50 if you ask her.",
        answer: "lend",
        zh: "如果你开口，她会借给你 50 美元。",
      },
      {
        text: "You can ___ books from this library.",
        answer: "borrow",
        zh: "你可以从这家图书馆借书。",
      },
    ],
  },
  {
    id: "say-tell",
    title: "说：say vs tell",
    emoji: "💬",
    words: [
      {
        word: "say",
        ipa: "/seɪ/",
        pos: "v.",
        meaning: "说（后接内容，不直接接人）",
        diff: "say sth / say that…：说某事",
      },
      {
        word: "tell",
        ipa: "/tel/",
        pos: "v.",
        meaning: "告诉（后面要有人）",
        diff: "tell sb sth：告诉某人某事",
      },
    ],
    tip: "tell 后面必须跟“人”（tell sb）；say 后面跟“内容”。",
    sentences: [
      {
        text: "Let's not ___ them about the surprise.",
        answer: "tell",
        zh: "别把惊喜告诉他们。",
      },
      {
        text: "Don't ___ such things to your parents.",
        answer: "say",
        zh: "别把这些事告诉你父母。",
      },
      {
        text: "I never ___ my secrets.",
        answer: "say",
        zh: "我从不说出自己的秘密。",
      },
    ],
  },
  {
    id: "affect-effect",
    title: "影响：affect vs effect",
    emoji: "🌊",
    words: [
      {
        word: "affect",
        ipa: "/əˈfekt/",
        pos: "v.",
        meaning: "影响（动词）",
        diff: "动词：affect sb's health 影响某人的健康",
      },
      {
        word: "effect",
        ipa: "/ɪˈfekt/",
        pos: "n.",
        meaning: "影响；效果（名词）",
        diff: "名词：have an effect on 对……有影响",
      },
    ],
    tip: "记法：affect 是动词，effect 是名词——“have an effect on” 是固定搭配。",
    sentences: [
      {
        text: "Loud noise can ___ your sleep.",
        answer: "affect",
        zh: "嘈杂的声音会影响你的睡眠。",
      },
      {
        text: "The medicine has a quick ___ on pain.",
        answer: "effect",
        zh: "这药对疼痛起效很快。",
      },
      {
        text: "Do late emails ___ your focus?",
        answer: "affect",
        zh: "深夜的邮件会影响你的注意力吗？",
      },
    ],
  },
  {
    id: "raise-rise",
    title: "升：raise vs rise",
    emoji: "📈",
    words: [
      {
        word: "raise",
        ipa: "/reɪz/",
        pos: "v.",
        meaning: "举起；提高（及物动词，带宾语）",
        diff: "raise sth：把某物抬高，raise your hand",
      },
      {
        word: "rise",
        ipa: "/raɪz/",
        pos: "v.",
        meaning: "上升；起身（不及物动词，自己升）",
        diff: "rise 不需要宾语：the sun rises 太阳升起",
      },
    ],
    tip: "raise 要“带着东西升”（及物），rise 是“自己升”（不及物）。",
    sentences: [
      {
        text: "Please ___ your hand if you have a question.",
        answer: "raise",
        zh: "有问题请举手。",
      },
      {
        text: "Prices can ___ quickly in spring.",
        answer: "rise",
        zh: "价格春天涨得很快。",
      },
      {
        text: "The company decided to ___ prices next month.",
        answer: "raise",
        zh: "公司决定下个月提价。",
      },
    ],
  },
  {
    id: "lay-lie",
    title: "躺与放：lay vs lie",
    emoji: "🛏️",
    words: [
      {
        word: "lay",
        ipa: "/leɪ/",
        pos: "v.",
        meaning: "放置；产卵（及物，过去式 laid）",
        diff: "lay sth down：把某物放下",
      },
      {
        word: "lie",
        ipa: "/laɪ/",
        pos: "v.",
        meaning: "躺；位于（不及物，过去式 lay）",
        diff: "lie down：躺下；注意 lie 的过去式正是 lay",
      },
    ],
    tip: "lie 的过去式是 lay——英语最经典的坑：“Yesterday I lay in bed…”",
    sentences: [
      {
        text: "Please ___ the keys on the table.",
        answer: "lay",
        zh: "请把钥匙放在桌子上。",
      },
      {
        text: "The cat likes to ___ in the sun.",
        answer: "lie",
        zh: "这只猫喜欢躺着晒太阳。",
      },
      {
        text: "Yesterday I ___ in bed until noon.",
        answer: "lay",
        zh: "昨天我躺到中午才起床。（此处 lay 是 lie 的过去式）",
      },
    ],
  },
  {
    id: "weather-whether",
    title: "同音词：weather vs whether",
    emoji: "🌦️",
    words: [
      {
        word: "weather",
        ipa: "/ˈweðər/",
        pos: "n.",
        meaning: "天气",
        diff: "名词：the weather 天气",
      },
      {
        word: "whether",
        ipa: "/ˈweðər/",
        pos: "conj.",
        meaning: "是否（连词）",
        diff: "whether + 从句：I wonder whether…",
      },
    ],
    tip: "读音完全相同：名词位置是 weather，引导从句的是 whether。",
    sentences: [
      {
        text: "The ___ is cold and windy today.",
        answer: "weather",
        zh: "今天天气又冷又多风。",
      },
      {
        text: "I'm not sure ___ he will come.",
        answer: "whether",
        zh: "我不确定他是否会来。",
      },
      {
        text: "Check the ___ forecast before you travel.",
        answer: "weather",
        zh: "出行前看看天气预报。",
      },
    ],
  },
  {
    id: "quiet-silent",
    title: "安静：quiet vs silent",
    emoji: "🤫",
    words: [
      {
        word: "quiet",
        ipa: "/ˈkwaət/",
        pos: "adj.",
        meaning: "安静的（不吵闹）",
        diff: "强调“不吵”，仍可小声说话：a quiet room",
      },
      {
        word: "silent",
        ipa: "/ˈsaɪlənt/",
        pos: "adj.",
        meaning: "沉默的；寂静的（完全不出声）",
        diff: "强调“零声音”：remain silent 保持沉默",
      },
    ],
    tip: "quiet 是“不吵”，silent 是“彻底没声音”。",
    sentences: [
      {
        text: "Be ___ in the library.",
        answer: "quiet",
        zh: "在图书馆请保持安静。",
      },
      {
        text: "She remained ___ throughout the meeting.",
        answer: "silent",
        zh: "整个会议期间她一言不发。",
      },
      {
        text: "Keep the office ___ while we're on a call.",
        answer: "quiet",
        zh: "我们通话时让办公室保持安静。",
      },
    ],
  },
  {
    id: "watch-look",
    title: "看：watch vs look",
    emoji: "👀",
    words: [
      {
        word: "look",
        ipa: "/lʊk/",
        pos: "v.",
        meaning: "看（强调“看”的动作/方向）",
        diff: "look at sth：看某物（动作性）",
      },
      {
        word: "watch",
        ipa: "/wɑːtʃ/",
        pos: "v.",
        meaning: "观看（持续注视动态过程）",
        diff: "watch TV / a match：看电视 / 比赛",
      },
    ],
    tip: "look 是“看过去一下”（动作），watch 是“盯着看一段过程”。",
    sentences: [
      {
        text: "___ at the blackboard, please.",
        answer: "look",
        zh: "请看黑板。",
      },
      {
        text: "Do you like to ___ games on TV?",
        answer: "watch",
        zh: "你喜欢在电视上看比赛吗？",
      },
      {
        text: "___! The bus is coming.",
        answer: "look",
        zh: "看！公交车来了。",
      },
    ],
  },
]
