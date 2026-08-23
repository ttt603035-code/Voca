/** 词库导入解析：CSV / Excel(.xlsx) / TXT / 粘贴文本 → 统一 ImportPayload */

export interface ImportedWord {
  wordOrder?: number
  word: string
  ipa?: string
  pos?: string
  meaning?: string
  example?: string
  exampleZh?: string
}

export interface ImportedList {
  name: string
  listOrder?: number
  words: ImportedWord[]
}

export interface ImportedBook {
  name: string
  lists: ImportedList[]
}

export interface ImportPayload {
  books: ImportedBook[]
  total: number
}

/* ─────────────── CSV 核心解析 ─────────────── */

const COLUMN_ALIASES: Record<string, string[]> = {
  book: ["book", "单词本", "词本", "词书"],
  list: ["list", "listname", "单元", "分组"],
  listOrder: ["listorder", "list_order", "listno", "list_no"],
  wordOrder: ["wordorder", "word_order", "wordno", "no", "序号", "编号"],
  word: ["word", "单词", "英语"],
  ipa: ["phonetic", "ipa", "音标"],
  meaning: ["meaning", "释义", "意思", "中文", "释义中文"],
  pos: ["partofspeech", "pos", "词性"],
  example: ["example", "例句", "exampleen", "例句英文"],
  exampleZh: ["examplezh", "例句翻译", "例句中文", "example_zh"],
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_/-]/g, "")
}

function buildColumnMap(header: string[]): (key: string) => number {
  const map = new Map<string, number>()
  header.forEach((h, i) => {
    const norm = normalizeHeader(h)
    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some((a) => normalizeHeader(a) === norm) && !map.has(key)) {
        map.set(key, i)
        break
      }
    }
  })
  return (key: string) => map.get(key) ?? -1
}

function pick(row: string[], idx: number): string {
  return idx >= 0 && idx < row.length ? String(row[idx]).trim() : ""
}

function parseRows(rows: string[][]): ImportPayload {
  const cleaned = rows
    .map((r) => r.map((c) => String(c).trim()))
    .filter((r) => r.some((c) => c !== ""))

  if (cleaned.length === 0) return { books: [], total: 0 }

  // 表头检测
  const first = cleaned[0].map(normalizeHeader)
  const hasHeader = first.some((c) => c === "word" || c === "单词")
  let dataRows = cleaned
  let colOf: (key: string) => number
  if (hasHeader) {
    colOf = buildColumnMap(cleaned[0])
    dataRows = cleaned.slice(1)
  } else {
    // 无表头：按列数推断
    const n = cleaned[0].length
    const order =
      n >= 9
        ? ["book", "list", "listOrder", "wordOrder", "word", "ipa", "meaning", "pos", "example"]
        : n === 4
          ? ["word", "ipa", "pos", "meaning"]
          : n === 3
            ? ["word", "pos", "meaning"]
            : n === 2
              ? ["word", "meaning"]
              : ["word"]
    colOf = (key: string) => {
      const i = order.indexOf(key)
      return i
    }
  }

  const books = new Map<string, ImportedBook>()
  for (const row of dataRows) {
    const word = pick(row, colOf("word"))
    if (!word) continue
    const bookName = pick(row, colOf("book")) || "Imported"
    const listName = pick(row, colOf("list")) || "List 01"

    let book = books.get(bookName.toLowerCase())
    if (!book) {
      book = { name: bookName, lists: [] }
      books.set(bookName.toLowerCase(), book)
    }
    let list = book.lists.find(
      (l) => l.name.toLowerCase() === listName.toLowerCase(),
    )
    if (!list) {
      list = { name: listName, words: [] }
      book.lists.push(list)
    }

    const woRaw = pick(row, colOf("wordOrder"))
    const loRaw = pick(row, colOf("listOrder"))
    if (list.listOrder === undefined && loRaw !== "") {
      list.listOrder = Number(loRaw)
    }
    list.words.push({
      wordOrder: woRaw !== "" ? Number(woRaw) : undefined,
      word,
      ipa: pick(row, colOf("ipa")) || undefined,
      pos: pick(row, colOf("pos")) || undefined,
      meaning: pick(row, colOf("meaning")) || undefined,
      example: pick(row, colOf("example")) || undefined,
      exampleZh: pick(row, colOf("exampleZh")) || undefined,
    })
  }

  // 排序与补号：保留原始 listOrder / wordOrder，缺失的按出现顺序补齐
  let total = 0
  const resultBooks: ImportedBook[] = []
  for (const book of books.values()) {
    const ordered = [...book.lists]
    ordered.forEach((l, i) => {
      if (l.listOrder === undefined) {
        l.listOrder = i + 1
      }
    })
    ordered.sort((a, b) => (a.listOrder ?? 0) - (b.listOrder ?? 0))
    for (const list of ordered) {
      list.words.forEach((w, i) => {
        if (w.wordOrder === undefined || Number.isNaN(w.wordOrder)) {
          w.wordOrder = i + 1
        }
      })
      total += list.words.length
    }
    resultBooks.push({ name: book.name, lists: ordered })
  }
  return { books: resultBooks, total }
}

/* ─────────────── CSV 文本 ─────────────── */

function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === "," || c === "\t") {
      row.push(cell)
      cell = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      cell = ""
      if (row.some((x) => x !== "")) rows.push(row)
      row = []
    } else {
      cell += c
    }
  }
  row.push(cell)
  if (row.some((x) => x !== "")) rows.push(row)
  return rows
}

export function parseCsv(text: string): ImportPayload {
  return parseRows(parseCsvText(text))
}

/* ─────────────── Excel ─────────────── */

export async function parseXlsx(data: ArrayBuffer): Promise<ImportPayload> {
  const XLSX = await import("xlsx")
  const wb = XLSX.read(data, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: false,
  })
  return parseRows(rows as string[][])
}

/* ─────────────── TXT / 粘贴文本 ─────────────── */

const LIST_LINE =
  /^(?:list\s*\d+|第?\s*\d+\s*(?:单元|课|章|组|list|unit)|unit\s*\d+|chapter\s*\d+|part\s*\d+)$/i
const BOOK_LINE = /^book[:：]\s*(.+)$/i
const WORD_SPLIT = /^\s*([A-Za-z][A-Za-z'’-]*)\s*[,，;；\t]?\s*(.*)$/

export function parseTxt(text: string, defaultBook = "Imported"): ImportPayload {
  const books = new Map<string, ImportedBook>()
  let bookName = defaultBook
  let listName: string | null = null
  let listCount = 0
  let wordCountInList = 0

  const getBook = (name: string) => {
    let b = books.get(name.toLowerCase())
    if (!b) {
      b = { name, lists: [] }
      books.set(name.toLowerCase(), b)
    }
    return b
  }

  const getOrCreateList = (book: ImportedBook, name: string) => {
    let l = book.lists.find((x) => x.name.toLowerCase() === name.toLowerCase())
    if (!l) {
      l = { name, words: [] }
      book.lists.push(l)
    }
    return l
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue

    const bookMatch = line.match(BOOK_LINE)
    if (bookMatch) {
      bookName = bookMatch[1].trim()
      listName = null
      continue
    }

    const book = getBook(bookName)

    if (LIST_LINE.test(line)) {
      listName = line
      listCount += 1
      wordCountInList = 0
      getOrCreateList(book, line)
      continue
    }

    // 单词行：支持 “word” / “word meaning” / “word, meaning” / “word, pos, meaning”
    const m = line.match(WORD_SPLIT)
    if (!m) continue
    const word = m[1]
    const rest = (m[2] || "").trim()
    let pos = ""
    let meaning = rest
    if (rest) {
      const parts = rest.split(/[,，;；]\s*/)
      if (
        parts.length > 1 &&
        /^(?:n|v|adj|adv|prep|conj|pron|num|art|int|aux|modal)\.?$/.test(
          parts[0].trim(),
        )
      ) {
        pos = parts[0].trim()
        meaning = parts.slice(1).join(", ").trim()
      }
    }

    if (!listName) {
      listName = "List 01"
      listCount += 1
    }
    const list = getOrCreateList(book, listName)
    wordCountInList += 1
    list.words.push({
      wordOrder: wordCountInList,
      word,
      pos: pos || undefined,
      meaning: meaning || undefined,
    })
  }

  // 补 listOrder
  let total = 0
  const resultBooks: ImportedBook[] = []
  for (const book of books.values()) {
    book.lists.forEach((l, i) => {
      if (l.listOrder === undefined) l.listOrder = i + 1
    })
    total += book.lists.reduce((s, l) => s + l.words.length, 0)
    resultBooks.push({ name: book.name, lists: book.lists })
  }
  return { books: resultBooks, total }
}
