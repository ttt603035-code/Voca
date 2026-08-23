import type { SimilarGroup } from "./types"

/** 内置易混词组（Similar Words）：长得非常像、容易看错的单词 */

export const SEED_SIMILAR_GROUPS: SimilarGroup[] = [
  {
    id: "borrow-lend",
    title: "borrow · lend",
    builtIn: true,
    tip: "方向相反：borrow 是“借进来”，lend 是“借出去”。",
    words: [
      { word: "borrow", ipa: "/ˈbɔːroʊ/", pos: "v.", meaning: "借入（把东西拿过来用）", diff: "borrow from sb：从某人处借来" },
      { word: "lend", ipa: "/lend/", pos: "v.", meaning: "借出（把东西给别人用）", diff: "lend sth to sb：把某物借给某人" },
    ],
  },
  {
    id: "say-tell",
    title: "say · tell",
    builtIn: true,
    tip: "tell 后面必须跟“人”（tell sb）；say 后面跟“内容”。",
    words: [
      { word: "say", ipa: "/seɪ/", pos: "v.", meaning: "说（后接内容，不直接接人）", diff: "say sth / say that…：说某事" },
      { word: "tell", ipa: "/tel/", pos: "v.", meaning: "告诉（后面要有人）", diff: "tell sb sth：告诉某人某事" },
    ],
  },
  {
    id: "affect-effect",
    title: "affect · effect",
    builtIn: true,
    tip: "affect 是动词，effect 是名词——“have an effect on” 是固定搭配。",
    words: [
      { word: "affect", ipa: "/əˈfekt/", pos: "v.", meaning: "影响（动词）", diff: "affect sb's health 影响某人的健康" },
      { word: "effect", ipa: "/ɪˈfekt/", pos: "n.", meaning: "影响；效果（名词）", diff: "have an effect on 对……有影响" },
    ],
  },
  {
    id: "raise-rise",
    title: "raise · rise",
    builtIn: true,
    tip: "raise 要“带着东西升”（及物），rise 是“自己升”（不及物）。",
    words: [
      { word: "raise", ipa: "/reɪz/", pos: "v.", meaning: "举起；提高（及物，带宾语）", diff: "raise sth：把某物抬高" },
      { word: "rise", ipa: "/raɪz/", pos: "v.", meaning: "上升；起身（不及物）", diff: "the sun rises 太阳升起" },
    ],
  },
  {
    id: "lay-lie",
    title: "lay · lie",
    builtIn: true,
    tip: "lie 的过去式是 lay——英语最经典的坑：“Yesterday I lay in bed…”",
    words: [
      { word: "lay", ipa: "/leɪ/", pos: "v.", meaning: "放置（及物，过去式 laid）", diff: "lay sth down：把某物放下" },
      { word: "lie", ipa: "/laɪ/", pos: "v.", meaning: "躺；位于（不及物，过去式 lay）", diff: "lie down：躺下" },
    ],
  },
  {
    id: "weather-whether",
    title: "weather · whether",
    builtIn: true,
    tip: "读音完全相同：名词位置是 weather，引导从句的是 whether。",
    words: [
      { word: "weather", ipa: "/ˈweðər/", pos: "n.", meaning: "天气", diff: "the weather 天气" },
      { word: "whether", ipa: "/ˈweðər/", pos: "conj.", meaning: "是否（连词）", diff: "whether + 从句：I wonder whether…" },
    ],
  },
  {
    id: "quiet-silent",
    title: "quiet · silent",
    builtIn: true,
    tip: "quiet 是“不吵”，silent 是“彻底没声音”。",
    words: [
      { word: "quiet", ipa: "/ˈkwaət/", pos: "adj.", meaning: "安静的（不吵闹）", diff: "a quiet room：安静的房间" },
      { word: "silent", ipa: "/ˈsaɪlənt/", pos: "adj.", meaning: "沉默的；寂静的", diff: "remain silent 保持沉默" },
    ],
  },
  {
    id: "watch-look",
    title: "watch · look",
    builtIn: true,
    tip: "look 是“看过去一下”（动作），watch 是“盯着看一段过程”。",
    words: [
      { word: "look", ipa: "/lʊk/", pos: "v.", meaning: "看（强调动作/方向）", diff: "look at sth：看某物" },
      { word: "watch", ipa: "/wɑːtʃ/", pos: "v.", meaning: "观看（持续注视动态过程）", diff: "watch TV / a match" },
    ],
  },
  {
    id: "adapt-adopt-adept",
    title: "adapt · adopt · adept",
    builtIn: true,
    tip: "adapt 是“适应/改编”，adopt 是“收养/采用”，adept 是“擅长的”。",
    words: [
      { word: "adapt", ipa: "/əˈdæpt/", pos: "v.", meaning: "适应；改编", diff: "adapt to：适应……" },
      { word: "adopt", ipa: "/əˈdɑːpt/", pos: "v.", meaning: "收养；采用", diff: "adopt a new method 采用新方法" },
      { word: "adept", ipa: "/əˈdept/", pos: "adj./n.", meaning: "擅长的；内行", diff: "be adept at：擅长……" },
    ],
  },
  {
    id: "economic-family",
    title: "economic · economical · economy",
    builtIn: true,
    tip: "economic 是“经济学的/经济上的”，economical 是“节约的”，economy 是“经济”。",
    words: [
      { word: "economic", ipa: "/ˌiːkəˈnɑːmɪk/", pos: "adj.", meaning: "经济学的；经济上的", diff: "economic growth 经济增长" },
      { word: "economical", ipa: "/ˌiːkəˈnɑːmɪkl/", pos: "adj.", meaning: "节约的；经济的", diff: "be economical with water 节约用水" },
      { word: "economy", ipa: "/ɪˈkɑnəmi/", pos: "n.", meaning: "经济；节约", diff: "the national economy 国民经济" },
    ],
  },
]

/** 从词库中为内置组建立 wordId 关联（若组内词存在于词库） */
export function linkGroupWordIds(groups: SimilarGroup[], wordIds: Map<string, string>): SimilarGroup[] {
  return groups.map((g) => ({
    ...g,
    words: g.words.map((w) => {
      const wordId = wordIds.get(w.word.toLowerCase())
      return wordId ? { ...w, wordId } : w
    }),
  }))
}
