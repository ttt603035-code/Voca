import type { Book, VocaList, Word } from "./types"

/**
 * 内置词库：专四 TEM-4 / 六级 CET-6 / 我的单词 My Words
 * 单词 id 保持稳定（seed-XXX），迁移旧数据时学习进度可继续生效。
 * 每个 List 内的 wordOrder 即词书原始顺序，永久保留。
 */

export const SEED_BOOKS: Book[] = [
  { id: "book-tem4", name: "专四 TEM-4", builtIn: true },
  { id: "book-cet6", name: "六级 CET-6", builtIn: true },
  { id: "book-mine", name: "我的单词 My Words", builtIn: true },
]

export const SEED_LISTS: VocaList[] = [
  { id: "list-tem4-1", bookId: "book-tem4", name: "List 01", listOrder: 1 },
  { id: "list-tem4-2", bookId: "book-tem4", name: "List 02", listOrder: 2 },
  { id: "list-tem4-3", bookId: "book-tem4", name: "List 03", listOrder: 3 },
  { id: "list-cet6-1", bookId: "book-cet6", name: "List 01", listOrder: 1 },
  { id: "list-cet6-2", bookId: "book-cet6", name: "List 02", listOrder: 2 },
  { id: "list-mine-daily", bookId: "book-mine", name: "Daily", listOrder: 1 },
]

// 旧级别 → 所属 List 的映射（仅用于迁移旧数据）
export const LEVEL_TO_LIST: Record<string, string> = {
  A1: "list-tem4-1",
  A2: "list-tem4-2",
  B1: "list-tem4-3",
  B2: "list-cet6-1",
  C1: "list-cet6-2",
}

interface SeedRow {
  word: string
  ipa: string
  pos: string
  meaning: string
  example: string
  exampleZh: string
}

const A1: SeedRow[] = [
  { word: "apple", ipa: "/ˈæpl/", pos: "n.", meaning: "苹果", example: "I eat an apple every morning.", exampleZh: "我每天早上吃一个苹果。" },
  { word: "water", ipa: "/ˈwɔːtər/", pos: "n.", meaning: "水；水分", example: "Please give me a glass of water.", exampleZh: "请给我一杯水。" },
  { word: "house", ipa: "/haʊs/", pos: "n.", meaning: "房子；住宅", example: "They live in a small house near the park.", exampleZh: "他们住在公园附近的一栋小房子里。" },
  { word: "book", ipa: "/bʊk/", pos: "n.", meaning: "书；书籍", example: "She is reading an interesting book.", exampleZh: "她正在读一本有趣的书。" },
  { word: "friend", ipa: "/frend/", pos: "n.", meaning: "朋友", example: "He is my best friend since childhood.", exampleZh: "他是我从小的最好的朋友。" },
  { word: "happy", ipa: "/ˈhæpi/", pos: "adj.", meaning: "高兴的；幸福的", example: "I am happy to see you again.", exampleZh: "再次见到你，我很高兴。" },
  { word: "food", ipa: "/fuːd/", pos: "n.", meaning: "食物", example: "The food here is very tasty.", exampleZh: "这里的食物非常美味。" },
  { word: "morning", ipa: "/ˈmɔːrnɪŋ/", pos: "n.", meaning: "早晨；上午", example: "Good morning, everyone.", exampleZh: "大家早上好。" },
  { word: "school", ipa: "/skuːl/", pos: "n.", meaning: "学校", example: "The children go to school by bus.", exampleZh: "孩子们乘公交车去上学。" },
  { word: "family", ipa: "/ˈfæməli/", pos: "n.", meaning: "家庭；家人", example: "I love my family very much.", exampleZh: "我非常爱我的家人。" },
  { word: "money", ipa: "/ˈmʌni/", pos: "n.", meaning: "钱；金钱", example: "He saves money every month.", exampleZh: "他每个月都会存钱。" },
  { word: "time", ipa: "/taɪm/", pos: "n.", meaning: "时间；时刻", example: "What time is it now?", exampleZh: "现在几点了？" },
  { word: "work", ipa: "/wɜːrk/", pos: "n./v.", meaning: "工作；劳动", example: "She works in a hospital.", exampleZh: "她在一家医院工作。" },
  { word: "name", ipa: "/neɪm/", pos: "n.", meaning: "名字；名称", example: "May I have your name, please?", exampleZh: "请问你叫什么名字？" },
  { word: "city", ipa: "/ˈsɪti/", pos: "n.", meaning: "城市", example: "Beijing is a very big city.", exampleZh: "北京是一座非常大的城市。" },
  { word: "love", ipa: "/lʌv/", pos: "v./n.", meaning: "爱；热爱", example: "I love learning English.", exampleZh: "我热爱学习英语。" },
  { word: "sleep", ipa: "/sliːp/", pos: "v.", meaning: "睡觉", example: "I sleep eight hours every day.", exampleZh: "我每天睡八个小时。" },
  { word: "breakfast", ipa: "/ˈbrekfəst/", pos: "n.", meaning: "早餐", example: "Breakfast is the most important meal.", exampleZh: "早餐是最重要的一餐。" },
  { word: "rain", ipa: "/reɪn/", pos: "n./v.", meaning: "雨；下雨", example: "It often rains in spring.", exampleZh: "春天经常下雨。" },
  { word: "road", ipa: "/roʊd/", pos: "n.", meaning: "道路；公路", example: "The road to the village is narrow.", exampleZh: "通往村庄的道路很窄。" },
]

const A2: SeedRow[] = [
  { word: "travel", ipa: "/ˈtrævəl/", pos: "v.", meaning: "旅行", example: "We traveled to Japan last summer.", exampleZh: "去年夏天我们去了日本旅行。" },
  { word: "decide", ipa: "/dɪˈsaɪd/", pos: "v.", meaning: "决定", example: "I can't decide what to eat for dinner.", exampleZh: "我没法决定晚餐吃什么。" },
  { word: "improve", ipa: "/ɪmˈpruːv/", pos: "v.", meaning: "改进；提高", example: "Reading helps improve your vocabulary.", exampleZh: "阅读有助于提高你的词汇量。" },
  { word: "because", ipa: "/bɪˈkɔːz/", pos: "conj.", meaning: "因为", example: "I was late because the bus was slow.", exampleZh: "我迟到了，因为公交车开得很慢。" },
  { word: "different", ipa: "/ˈdɪfrənt/", pos: "adj.", meaning: "不同的", example: "We have different opinions about the plan.", exampleZh: "我们对这个计划有不同的看法。" },
  { word: "interesting", ipa: "/ˈɪntrəstɪŋ/", pos: "adj.", meaning: "有趣的", example: "This is an interesting story.", exampleZh: "这是一个有趣的故事。" },
  { word: "remember", ipa: "/rɪˈmembər/", pos: "v.", meaning: "记得；记住", example: "Remember to lock the door before you leave.", exampleZh: "离开前记得锁门。" },
  { word: "weather", ipa: "/ˈweðər/", pos: "n.", meaning: "天气", example: "The weather is really nice today.", exampleZh: "今天天气非常好。" },
  { word: "health", ipa: "/helθ/", pos: "n.", meaning: "健康", example: "Eating well is good for your health.", exampleZh: "吃得健康有益健康。" },
  { word: "experience", ipa: "/ɪkˈspɪriəns/", pos: "n.", meaning: "经验；经历", example: "She has five years of teaching experience.", exampleZh: "她有五年的教学经验。" },
  { word: "important", ipa: "/ɪmˈpɔːrtnt/", pos: "adj.", meaning: "重要的", example: "Sleep is important for children.", exampleZh: "睡眠对孩子很重要。" },
  { word: "believe", ipa: "/bɪˈliːv/", pos: "v.", meaning: "相信；认为", example: "I believe in myself.", exampleZh: "我相信我自己。" },
  { word: "borrow", ipa: "/ˈbɔːroʊ/", pos: "v.", meaning: "借（入）", example: "Can I borrow your pen for a minute?", exampleZh: "我能借你的笔用一下吗？" },
  { word: "choose", ipa: "/tʃuːz/", pos: "v.", meaning: "选择", example: "You can choose any color you like.", exampleZh: "你可以选择你喜欢的任何颜色。" },
  { word: "difficult", ipa: "/ˈdɪfɪkəlt/", pos: "adj.", meaning: "困难的", example: "The exam was more difficult than I expected.", exampleZh: "考试比我预想的更难。" },
  { word: "environment", ipa: "/ɪnˈvaɪrənmənt/", pos: "n.", meaning: "环境", example: "We should protect the environment.", exampleZh: "我们应该保护环境。" },
  { word: "knowledge", ipa: "/ˈnɑːlɪdʒ/", pos: "n.", meaning: "知识", example: "Knowledge is power.", exampleZh: "知识就是力量。" },
  { word: "market", ipa: "/ˈmɑrkɪt/", pos: "n.", meaning: "市场；集市", example: "She buys vegetables at the market.", exampleZh: "她在市场上买蔬菜。" },
  { word: "mistake", ipa: "/mɪˈsteɪk/", pos: "n.", meaning: "错误", example: "Everyone makes mistakes, and that's okay.", exampleZh: "每个人都会犯错，这没关系。" },
  { word: "neighbor", ipa: "/ˈneɪbər/", pos: "n.", meaning: "邻居", example: "Our neighbors are very friendly.", exampleZh: "我们的邻居非常友好。" },
]

const B1: SeedRow[] = [
  { word: "achieve", ipa: "/əˈtʃiːv/", pos: "v.", meaning: "实现；达成", example: "She worked hard to achieve her goals.", exampleZh: "她努力工作以实现自己的目标。" },
  { word: "afford", ipa: "/əˈfɔːrd/", pos: "v.", meaning: "负担得起", example: "We can't afford a new car right now.", exampleZh: "我们现在买不起新车。" },
  { word: "argue", ipa: "/ˈɑːrɡjuː/", pos: "v.", meaning: "争论", example: "They argued about the movie for an hour.", exampleZh: "他们为那部电影争论了一个小时。" },
  { word: "benefit", ipa: "/ˈbenɪfɪt/", pos: "n.", meaning: "好处；利益", example: "There are many benefits of regular exercise.", exampleZh: "经常锻炼有很多好处。" },
  { word: "communicate", ipa: "/kəˈmjunɪkeɪt/", pos: "v.", meaning: "交流；沟通", example: "Good communication is the key to a great team.", exampleZh: "良好的沟通是优秀团队的关键。" },
  { word: "curious", ipa: "/ˈkjʊriəs/", pos: "adj.", meaning: "好奇的", example: "Children are naturally curious about the world.", exampleZh: "孩子对世界天生充满好奇。" },
  { word: "develop", ipa: "/dɪˈveləp/", pos: "v.", meaning: "发展；培养", example: "This app helps you develop good habits.", exampleZh: "这款应用帮助你培养好习惯。" },
  { word: "encourage", ipa: "/ɪnˈkɜːrɪdʒ/", pos: "v.", meaning: "鼓励", example: "My teacher always encourages me to speak English.", exampleZh: "我的老师总是鼓励我说英语。" },
  { word: "escape", ipa: "/ɪˈskeɪp/", pos: "v.", meaning: "逃跑；逃脱", example: "The animals tried to escape from the cage.", exampleZh: "动物们试图从笼子里逃出去。" },
  { word: "familiar", ipa: "/fəˈmær/", pos: "adj.", meaning: "熟悉的", example: "This song is familiar to everyone.", exampleZh: "这首歌人人都熟悉。" },
  { word: "habit", ipa: "/ˈhæbɪt/", pos: "n.", meaning: "习惯", example: "Reading before bed is a good habit.", exampleZh: "睡前阅读是个好习惯。" },
  { word: "influence", ipa: "/ˈɪnfluəns/", pos: "n./v.", meaning: "影响", example: "Music has a great influence on our mood.", exampleZh: "音乐对我们的情绪有很大影响。" },
  { word: "journey", ipa: "/ˈdʒɜːrni/", pos: "n.", meaning: "旅程；行程", example: "Life is a journey, not a race.", exampleZh: "人生是一段旅程，而不是一场赛跑。" },
  { word: "lazy", ipa: "/ˈleɪzi/", pos: "adj.", meaning: "懒惰的", example: "Don't be lazy. Start studying now.", exampleZh: "别懒惰，现在就开始学习。" },
  { word: "manage", ipa: "/ˈmænɪdʒ/", pos: "v.", meaning: "管理；设法做到", example: "He manages a team of ten people.", exampleZh: "他管理着一个十人团队。" },
  { word: "opinion", ipa: "/oʊˈpɪnjən/", pos: "n.", meaning: "意见；看法", example: "In my opinion, the plan will work.", exampleZh: "在我看来，这个计划是可行的。" },
  { word: "patience", ipa: "/ˈpeɪʃns/", pos: "n.", meaning: "耐心", example: "Learning a language takes a lot of patience.", exampleZh: "学习一门语言需要很多耐心。" },
  { word: "practice", ipa: "/ˈpræktɪs/", pos: "n./v.", meaning: "练习；实践", example: "Daily practice is the best way to improve.", exampleZh: "每天练习是提高的最好方法。" },
  { word: "refuse", ipa: "/rɪˈfjuz/", pos: "v.", meaning: "拒绝", example: "She refused to answer the question.", exampleZh: "她拒绝回答那个问题。" },
  { word: "suggest", ipa: "/səˈdʒest/", pos: "v.", meaning: "建议", example: "I suggest we leave early to avoid the traffic.", exampleZh: "我建议我们早点出发以避开交通拥堵。" },
]

const B2: SeedRow[] = [
  { word: "accomplish", ipa: "/əˈkmplɪ/", pos: "v.", meaning: "完成；实现", example: "He accomplished everything on his to-do list.", exampleZh: "他完成了待办清单上的一切。" },
  { word: "analyze", ipa: "/ˈænəlaɪz/", pos: "v.", meaning: "分析", example: "Let's analyze the data before making a decision.", exampleZh: "在做决定之前，我们先分析一下数据。" },
  { word: "aware", ipa: "/əˈwer/", pos: "adj.", meaning: "意识到的", example: "Are you aware of the risks involved?", exampleZh: "你意识到其中涉及的风险了吗？" },
  { word: "challenge", ipa: "/ˈtʃælɪndʒ/", pos: "n./v.", meaning: "挑战", example: "Learning a new language is a big challenge.", exampleZh: "学习一门新语言是一个巨大的挑战。" },
  { word: "concentrate", ipa: "/ˈkɑnsntreɪt/", pos: "v.", meaning: "集中（注意力）", example: "It's hard to concentrate in a noisy room.", exampleZh: "在嘈杂的房间里很难集中注意力。" },
  { word: "conflict", ipa: "/ˈkɑːnflɪkt/", pos: "n.", meaning: "冲突；矛盾", example: "The conflict between the two groups lasted for years.", exampleZh: "两个群体之间的冲突持续了多年。" },
  { word: "determine", ipa: "/dɪˈtɜːrmɪn/", pos: "v.", meaning: "决定；查明", example: "The results will determine our next step.", exampleZh: "结果将决定我们的下一步。" },
  { word: "efficient", ipa: "/ɪˈfɪʃənt/", pos: "adj.", meaning: "高效的", example: "This is a more efficient way to study vocabulary.", exampleZh: "这是一种更高效的学习词汇的方法。" },
  { word: "evidence", ipa: "/ˈevɪdəns/", pos: "n.", meaning: "证据", example: "There is no evidence to support this claim.", exampleZh: "没有证据支持这一说法。" },
  { word: "essential", ipa: "/ɪˈsenʃl/", pos: "adj.", meaning: "必不可少的", example: "Sleep is essential for memory and learning.", exampleZh: "睡眠对记忆和学习至关重要。" },
  { word: "evaluate", ipa: "/ɪˈvæljueɪt/", pos: "v.", meaning: "评估；评价", example: "Teachers evaluate students' progress every term.", exampleZh: "老师每学期都会评估学生的进步。" },
  { word: "flexible", ipa: "/ˈfleksəbl/", pos: "adj.", meaning: "灵活的", example: "Our class schedule is quite flexible.", exampleZh: "我们的课程安排相当灵活。" },
  { word: "generate", ipa: "/ˈdʒenəreɪt/", pos: "v.", meaning: "产生；生成", example: "The solar panel generates clean electricity.", exampleZh: "太阳能电池板产生清洁电力。" },
  { word: "hesitate", ipa: "/ˈhezɪteɪt/", pos: "v.", meaning: "犹豫", example: "Don't hesitate to ask questions in class.", exampleZh: "在课堂上不要犹豫，尽管提问。" },
  { word: "identical", ipa: "/aɪˈdentɪkl/", pos: "adj.", meaning: "完全相同的", example: "The two copies of the report are identical.", exampleZh: "报告的两个副本完全相同。" },
  { word: "interpret", ipa: "/ɪnˈtɜːrprt/", pos: "v.", meaning: "解释；理解", example: "How should we interpret this result?", exampleZh: "我们该如何理解这个结果？" },
  { word: "maintain", ipa: "/meɪnˈteɪn/", pos: "v.", meaning: "维持；保养", example: "It's important to maintain a healthy diet.", exampleZh: "保持健康的饮食很重要。" },
  { word: "negotiate", ipa: "/nɪˈɡoʃieɪt/", pos: "v.", meaning: "谈判；协商", example: "They negotiated a better price with the supplier.", exampleZh: "他们与供应商谈到了更好的价格。" },
  { word: "particular", ipa: "/pərˈtɪkjələr/", pos: "adj.", meaning: "特定的；特别的", example: "Is there a particular reason for the delay?", exampleZh: "延误有特别的原因吗？" },
  { word: "significant", ipa: "/sɪɡˈnɪfɪkənt/", pos: "adj.", meaning: "重要的；显著的", example: "The company saw significant growth last year.", exampleZh: "公司去年实现了显著增长。" },
]

const C1: SeedRow[] = [
  { word: "ambiguous", ipa: "/æmˈbɪɡjuəs/", pos: "adj.", meaning: "模棱两可的", example: "His answer was deliberately ambiguous.", exampleZh: "他的回答故意含糊其辞。" },
  { word: "comprehensive", ipa: "/ˌkɑːmprɪˈhensv/", pos: "adj.", meaning: "全面的；综合的", example: "The report gives a comprehensive overview of the market.", exampleZh: "这份报告对市场进行了全面的概述。" },
  { word: "deliberate", ipa: "/dɪˈlɪbərət/", pos: "adj.", meaning: "故意的；蓄意的", example: "The damage to the equipment was deliberate.", exampleZh: "对设备的损坏是蓄意为之的。" },
  { word: "emphasize", ipa: "/ˈemfəsaɪz/", pos: "v.", meaning: "强调", example: "The teacher emphasized the key points of the lesson.", exampleZh: "老师强调了这节课的重点。" },
  { word: "feasible", ipa: "/ˈfiːzəbl/", pos: "adj.", meaning: "可行的", example: "The project is technically feasible, but costly.", exampleZh: "这个项目在技术上是可行的，但成本很高。" },
  { word: "hypothesis", ipa: "/haɪˈpɑθəsɪs/", pos: "n.", meaning: "假设", example: "The experiment was designed to test the hypothesis.", exampleZh: "这个实验是为了检验该假设而设计的。" },
  { word: "inevitable", ipa: "/ɪnˈevɪtəbl/", pos: "adj.", meaning: "不可避免的", example: "Change is inevitable in any growing company.", exampleZh: "在快速发展的公司里，变化是不可避免的。" },
  { word: "meticulous", ipa: "/məˈtɪkjələs/", pos: "adj.", meaning: "一丝不苟的", example: "She is meticulous about every detail of the plan.", exampleZh: "她对计划的每一个细节都一丝不苟。" },
  { word: "paradox", ipa: "/ˈpærədɑːks/", pos: "n.", meaning: "悖论", example: "It is a paradox that more choices can make us less happy.", exampleZh: "选择越多反而越不快乐，这是个悖论。" },
  { word: "perspective", ipa: "/pərˈspektɪv/", pos: "n.", meaning: "视角；观点", example: "Try to see the problem from a different perspective.", exampleZh: "试着从不同的角度看这个问题。" },
  { word: "phenomenon", ipa: "/fəˈnɑmɪnən/", pos: "n.", meaning: "现象", example: "Sleeping is a natural phenomenon for all mammals.", exampleZh: "睡眠是所有哺乳动物的一种自然现象。" },
  { word: "profound", ipa: "/prəˈfaʊnd/", pos: "adj.", meaning: "深刻的；深远的", example: "The book had a profound effect on my thinking.", exampleZh: "这本书对我的思维方式产生了深远的影响。" },
  { word: "resilience", ipa: "/rɪˈzɪliəns/", pos: "n.", meaning: "韧性；恢复力", example: "Resilience helps us recover from setbacks.", exampleZh: "韧性帮助我们走出挫折。" },
  { word: "scrutinize", ipa: "/ˈskruːtənaɪz/", pos: "v.", meaning: "仔细审查", example: "Investors scrutinized the company's accounts carefully.", exampleZh: "投资者仔细审查了公司的账目。" },
  { word: "tentative", ipa: "/ˈtentətv/", pos: "adj.", meaning: "试探性的；不确定的", example: "We reached a tentative agreement on the budget.", exampleZh: "我们在预算上达成了初步协议。" },
  { word: "ubiquitous", ipa: "/juːˈbkwtəs/", pos: "adj.", meaning: "无处不在的", example: "Smartphones have become truly ubiquitous.", exampleZh: "智能手机已经真正无处不在。" },
  { word: "alleviate", ipa: "/əˈliːvieɪt/", pos: "v.", meaning: "缓解；减轻", example: "This medicine can alleviate the pain.", exampleZh: "这种药可以缓解疼痛。" },
  { word: "controversy", ipa: "/ˈkɑːntrəvɜːrsi/", pos: "n.", meaning: "争议；争论", example: "The new policy caused a lot of controversy.", exampleZh: "这个决定引起了很多争议。" },
  { word: "deteriorate", ipa: "/dɪˈtɪriəreɪt/", pos: "v.", meaning: "恶化；变坏", example: "His health began to deteriorate last winter.", exampleZh: "他的健康从去年冬天开始恶化。" },
  { word: "articulate", ipa: "/ɑːrˈtɪkjuleɪt/", pos: "v./adj.", meaning: "清楚地表达；善于表达的", example: "She articulated her concerns clearly in the meeting.", exampleZh: "她在会上清楚地表达了自己的担忧。" },
]

function buildWords(
  listId: string,
  rows: SeedRow[],
  idStart: number,
): Word[] {
  return rows.map((r, i) => ({
    id: `seed-${String(idStart + i).padStart(3, "0")}`,
    listId,
    wordOrder: i + 1,
    word: r.word,
    ipa: r.ipa,
    pos: r.pos,
    meaning: r.meaning,
    example: r.example,
    exampleZh: r.exampleZh,
  }))
}

export const SEED_WORDS: Word[] = [
  ...buildWords("list-tem4-1", A1, 1),
  ...buildWords("list-tem4-2", A2, 21),
  ...buildWords("list-tem4-3", B1, 41),
  ...buildWords("list-cet6-1", B2, 61),
  ...buildWords("list-cet6-2", C1, 81),
]
