/**
 * 柔和主题色（Accent Theme）
 *
 * 主题色只作为 Accent（按钮/进度/选中/图表/焦点），
 * 不改变页面基础色（白底、深灰文字、浅灰层级）。
 * 每个主题提供 Light / Dark 两套柔和值 + Tint（选中/激活面）。
 */

export interface Accent {
  id: string
  name: string
  /** Light Mode 主色 */
  light: string
  /** Dark Mode 主色（适配深色的柔和值，不是原样照搬） */
  dark: string
  /** Light Mode Tint（选中/激活背景） */
  tint: string
  /** Dark Mode Tint */
  tintDark: string
  /** 主色按钮上的文字色 */
  fg: string
  /** Dark Mode 主色按钮上的文字色 */
  fgDark: string
}

export const DEFAULT_ACCENT_ID = "soft-blue"

export const ACCENTS: Accent[] = [
  {
    id: "soft-blue",
    name: "Soft Blue",
    light: "#7FA8D8",
    dark: "#92B3DC",
    tint: "#EAF2FB",
    tintDark: "rgba(127, 168, 216, 0.16)",
    fg: "#1D1D1F",
    fgDark: "#1D1D1F",
  },
  {
    id: "soft-purple",
    name: "Soft Purple",
    light: "#9B8FC4",
    dark: "#A89DD0",
    tint: "#F0ECF8",
    tintDark: "rgba(155, 143, 196, 0.16)",
    fg: "#1D1D1F",
    fgDark: "#1D1D1F",
  },
  {
    id: "soft-pink",
    name: "Soft Pink",
    light: "#D9A0B5",
    dark: "#E0ADC1",
    tint: "#FAEEF2",
    tintDark: "rgba(217, 160, 181, 0.16)",
    fg: "#1D1D1F",
    fgDark: "#1D1D1F",
  },
  {
    id: "soft-peach",
    name: "Soft Peach",
    light: "#D9A47F",
    dark: "#E0B08D",
    tint: "#FBF1EA",
    tintDark: "rgba(217, 164, 127, 0.16)",
    fg: "#1D1D1F",
    fgDark: "#1D1D1F",
  },
  {
    id: "soft-mint",
    name: "Soft Mint",
    light: "#83B9A4",
    dark: "#92C2B0",
    tint: "#EDF7F2",
    tintDark: "rgba(131, 185, 164, 0.16)",
    fg: "#1D1D1F",
    fgDark: "#1D1D1F",
  },
  {
    id: "soft-yellow",
    name: "Soft Yellow",
    light: "#C7AD6D",
    dark: "#CDB87F",
    tint: "#FBF7E8",
    tintDark: "rgba(199, 173, 109, 0.16)",
    fg: "#1D1D1F",
    fgDark: "#1D1D1F",
  },
  {
    id: "black",
    name: "Black",
    light: "#000000",
    dark: "#F5F5F7",
    tint: "#F2F2F2",
    tintDark: "rgba(245, 245, 247, 0.14)",
    fg: "#FFFFFF",
    fgDark: "#1D1D1F",
  },
]

export function getAccent(id: string | null | undefined): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

const VAR_KEYS = [
  "--voca-accent",
  "--voca-accent-dark",
  "--voca-accent-fg",
  "--voca-accent-fg-dark",
  "--voca-tint",
  "--voca-tint-dark",
] as const

/** 将主题色应用为 CSS 变量；null 表示默认 Soft Blue */
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
  root.style.setProperty("--voca-accent-fg-dark", accent.fgDark)
  root.style.setProperty("--voca-tint", accent.tint)
  root.style.setProperty("--voca-tint-dark", accent.tintDark)
}
