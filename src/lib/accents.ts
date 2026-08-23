/** Apple 系统色主题预设（light / dark 双值） */
export interface Accent {
  id: string
  name: string
  /** 浅色模式主色 */
  light: string
  /** 深色模式主色 */
  dark: string
  /** 主色上的文字色（浅色模式） */
  fg: string
  /** 主色上的文字色（深色模式，缺省同 fg） */
  fgDark?: string
}

export const DEFAULT_ACCENT_ID = "apple-blue"

export const ACCENTS: Accent[] = [
  { id: "apple-blue", name: "系统蓝", light: "#007AFF", dark: "#0A84FF", fg: "#FFFFFF" },
  { id: "red", name: "系统红", light: "#FF3B30", dark: "#FF453A", fg: "#FFFFFF" },
  { id: "orange", name: "系统橙", light: "#FF9500", dark: "#FF9F0A", fg: "#FFFFFF" },
  { id: "yellow", name: "系统黄", light: "#FFCC00", dark: "#FFD60A", fg: "#1C1C1E", fgDark: "#1C1C1E" },
  { id: "green", name: "系统绿", light: "#34C759", dark: "#30D158", fg: "#FFFFFF" },
  { id: "mint", name: "系统薄荷", light: "#00C7BE", dark: "#63E6E2", fg: "#1C1C1E", fgDark: "#1C1C1E" },
  { id: "teal", name: "系统青", light: "#30B0C7", dark: "#40C8E0", fg: "#FFFFFF", fgDark: "#1C1C1E" },
  { id: "cyan", name: "系统天蓝", light: "#32ADE6", dark: "#64D2FF", fg: "#FFFFFF", fgDark: "#1C1C1E" },
  { id: "indigo", name: "系统靛", light: "#5856D6", dark: "#5E5CE6", fg: "#FFFFFF" },
  { id: "purple", name: "系统紫", light: "#AF52DE", dark: "#BF5AF2", fg: "#FFFFFF" },
  { id: "pink", name: "系统粉", light: "#FF2D55", dark: "#FF375F", fg: "#FFFFFF" },
  { id: "brown", name: "系统棕", light: "#A2845E", dark: "#AC8E68", fg: "#FFFFFF" },
]

export function getAccent(id: string | null | undefined): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

const VAR_KEYS = [
  "--voca-accent",
  "--voca-accent-dark",
  "--voca-accent-fg",
  "--voca-accent-fg-dark",
] as const

/** 将主题色应用为 CSS 变量；null 表示恢复 Apple 系统蓝 */
export function applyAccent(id: string | null): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const accent = getAccent(id)
  if (accent.id === DEFAULT_ACCENT_ID) {
    VAR_KEYS.forEach((v) => root.style.removeProperty(v))
    return
  }
  root.style.setProperty("--voca-accent", accent.light)
  root.style.setProperty("--voca-accent-dark", accent.dark)
  root.style.setProperty("--voca-accent-fg", accent.fg)
  root.style.setProperty("--voca-accent-fg-dark", accent.fgDark ?? accent.fg)
}
