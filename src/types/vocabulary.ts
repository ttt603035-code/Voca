/**
 * 内置词库数据结构（JSON 文件 → TypeScript 类型）
 *
 * 词库数据存放在 public/vocabulary/*.json，由 Vocabulary Service 读取，
 * 与 React UI 代码完全分离。
 */

/** index.json 中注册的一本书 */
export interface VocabularyIndexEntry {
  id: string
  name: string
  /** JSON 文件地址，相对站点根，如 vocabulary/tem4.json */
  file: string
}

/** index.json */
export interface VocabularyIndex {
  books: VocabularyIndexEntry[]
}

/** 词书中的单词（JSON 原始结构） */
export interface BuiltInWordData {
  id: string
  word: string
  phonetic?: string
  meaning?: string
  partOfSpeech?: string
  example?: string
  /** 词书内原始序号，永久保留 */
  wordOrder: number
}

/** 词书中的 List */
export interface BuiltInListData {
  id: string
  name: string
  /** List 在词书中的原始顺序 */
  order: number
  words: BuiltInWordData[]
}

/** 词书（JSON 完整结构） */
export interface BuiltInBookData {
  id: string
  name: string
  /** 词书封面图（public/ 下相对路径，如 IMG_1519.jpg），可选 */
  cover?: string
  lists: BuiltInListData[]
}
