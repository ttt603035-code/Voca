/** 柔和主题色预设（参考 iOS 系统色的柔和色调） */
export interface Accent {
  id: string
  name: string
  /** 主色（oklch） */
  primary: string
  /** 主色上的文字色 */
  primaryFg: string
}

export const DEFAULT_ACCENT_ID = "default"

export const ACCENTS: Accent[] = [
  {
    id: DEFAULT_ACCENT_ID,
    name: "翡翠绿",
    primary: "oklch(0.596 0.145 163.225)",
    primaryFg: "oklch(0.979 0.021 166.113)",
  },
  {
    id: "peach",
    name: "蜜桃红",
    primary: "oklch(0.68 0.14 25)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "apricot",
    name: "杏橙",
    primary: "oklch(0.73 0.13 55)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "cream",
    name: "奶油黄",
    primary: "oklch(0.8 0.13 85)",
    primaryFg: "oklch(0.28 0.03 85)",
  },
  {
    id: "mint",
    name: "薄荷绿",
    primary: "oklch(0.69 0.13 160)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "teal",
    name: "青瓷",
    primary: "oklch(0.69 0.1 200)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "mist",
    name: "雾霾蓝",
    primary: "oklch(0.67 0.11 240)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "violet",
    name: "紫罗兰",
    primary: "oklch(0.65 0.12 285)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "lilac",
    name: "香芋紫",
    primary: "oklch(0.7 0.11 320)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "sakura",
    name: "樱花粉",
    primary: "oklch(0.71 0.13 350)",
    primaryFg: "oklch(0.985 0 0)",
  },
  {
    id: "cocoa",
    name: "可可棕",
    primary: "oklch(0.64 0.07 60)",
    primaryFg: "oklch(0.985 0 0)",
  },
]

export function getAccent(id: string | null | undefined): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

const ACCENT_VARS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
]

/** 将主题色应用为 CSS 变量；null 表示恢复默认 */
export function applyAccent(id: string | null): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const accent = getAccent(id)
  if (accent.id === DEFAULT_ACCENT_ID) {
    ACCENT_VARS.forEach((v) => root.style.removeProperty(v))
    return
  }
  root.style.setProperty("--primary", accent.primary)
  root.style.setProperty("--primary-foreground", accent.primaryFg)
  root.style.setProperty("--ring", accent.primary)
  root.style.setProperty("--sidebar-primary", accent.primary)
  root.style.setProperty("--sidebar-primary-foreground", accent.primaryFg)
  root.style.setProperty("--sidebar-ring", accent.primary)
}
