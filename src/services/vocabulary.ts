/**
 * Vocabulary Service — 内置词库的唯一读取入口
 *
 * 流程：
 *   public/vocabulary/index.json → 词书注册表
 *   public/vocabulary/*.json     → 词书内容
 *
 * React 组件不直接读取 JSON，统一通过本 Service 获取 Book / List / Word。
 * 以后新增词书：在 public/vocabulary/ 加 JSON + 在 index.json 注册即可，
 * 无需修改任何页面组件。
 */

import type {
  BuiltInBookData,
  BuiltInListData,
  BuiltInWordData,
  VocabularyIndex,
  VocabularyIndexEntry,
} from "@/types/vocabulary"

/**
 * 将 public/ 资源路径解析为可部署到任意子路径的 URL。
 * 配合 vite.config.ts 的 `base: "./"`，GitHub Pages 仓库站点也能加载词库。
 */
export function publicAsset(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.BASE_URL || "./"
  return `${base}${path.replace(/^\//, "")}`
}

const INDEX_URL = publicAsset("vocabulary/index.json")

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-cache" })
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (${res.status})`)
  }
  return (await res.json()) as T
}

/** 读取词书注册表 */
export async function fetchIndex(): Promise<VocabularyIndex> {
  const index = await fetchJson<VocabularyIndex>(INDEX_URL)
  if (!index || !Array.isArray(index.books)) {
    throw new Error("Invalid vocabulary index.json")
  }
  return index
}

/** 规范化词书：保留原始 List / Word 顺序，补齐缺失字段 */
function normalizeBook(
  entry: VocabularyIndexEntry,
  raw: Partial<BuiltInBookData>,
): BuiltInBookData {
  const lists: BuiltInListData[] = (raw.lists ?? [])
    .map((l, i) => {
      const words: BuiltInWordData[] = (l.words ?? []).map((w, wi) => ({
        id: w.id || `${entry.id}-${l.id ?? i + 1}-${wi + 1}`,
        word: String(w.word ?? "").trim(),
        phonetic: w.phonetic,
        meaning: w.meaning,
        partOfSpeech: w.partOfSpeech,
        example: w.example,
        wordOrder: w.wordOrder ?? wi + 1,
      })).filter((w) => w.word !== "")
      return {
        id: l.id ?? `${entry.id}-list-${i + 1}`,
        name: l.name ?? `List ${i + 1}`,
        order: l.order ?? i + 1,
        words,
      }
    })
    // 按词书原始顺序（order 字段；缺失时按出现顺序）
    .sort((a, b) => a.order - b.order)

  return {
    id: entry.id,
    name: entry.name,
    cover: raw.cover,
    lists,
  }
}

/** 读取单本词书 */
export async function fetchBook(entry: VocabularyIndexEntry): Promise<BuiltInBookData> {
  const raw = await fetchJson<Partial<BuiltInBookData>>(publicAsset(entry.file))
  return normalizeBook(entry, raw)
}

/** 读取全部内置词书（按 index.json 注册顺序） */
export async function loadAllBooks(): Promise<BuiltInBookData[]> {
  const index = await fetchIndex()
  const books = await Promise.all(index.books.map((e) => fetchBook(e)))
  // 保持 index.json 中的注册顺序
  return index.books.map((e) => books.find((b) => b.id === e.id)!).filter(Boolean)
}
