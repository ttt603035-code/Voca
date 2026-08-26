import { addDays, todayStr } from "./srs"
import type { VocaState } from "./types"

export interface TrendPoint {
  date: string
  label: string
  learned: number
  reviewed: number
  /** 未来日期的待复习词数（灰色柱） */
  pending?: number
}

type T = (key: "today" | "pendingNow", vars?: Record<string, string | number>) => string

const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"]
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function mmdd(dateStr: string): string {
  const [, m, d] = dateStr.split("-")
  return `${Number(m)}/${Number(d)}`
}

/**
 * 构建趋势窗口：
 * - 7 天：前天 ~ 今天（实际学习）+ 明天 / 后天 / 3天后（待复习灰柱）
 * - 30 / 90 天：纯历史窗口
 */
export function buildTrend(
  state: VocaState,
  days: 7 | 30 | 90,
  lang: "zh" | "en",
  t: T,
): TrendPoint[] {
  const today = todayStr()
  const weekdays = lang === "zh" ? WEEKDAYS_ZH : WEEKDAYS_EN
  const points: TrendPoint[] = []

  if (days === 7) {
    for (let i = -3; i <= 3; i++) {
      const date = addDays(today, i)
      let label: string
      if (i === 0) label = t("today")
      else if (i === 1) label = lang === "zh" ? "明天" : "Tomorrow"
      else if (i === 2) label = lang === "zh" ? "后天" : "Day after"
      else if (i === 3) label = lang === "zh" ? "3天后" : "+3 Days"
      else if (i === -1) label = lang === "zh" ? "昨天" : "Yesterday"
      else label = mmdd(date)
      if (i <= 0) {
        const s = state.activity[date]
        points.push({
          date,
          label,
          learned: s?.learned ?? 0,
          reviewed: s?.reviewed ?? 0,
        })
      } else {
        let pending = 0
        for (const w of state.words) {
          const p = state.progress[w.id]
          if (p && p.status !== "new" && p.due === date) pending += 1
        }
        points.push({ date, label, learned: 0, reviewed: 0, pending })
      }
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(today, -i)
      const s = state.activity[date]
      points.push({
        date,
        label: i === 0 ? t("today") : mmdd(date),
        learned: s?.learned ?? 0,
        reviewed: s?.reviewed ?? 0,
      })
    }
    // 周末标签（可选提示，保留 weekday 供调用方使用）
    void weekdays
  }
  return points
}

/** X 轴标签步长 */
export function trendLabelStep(days: 7 | 30 | 90): number {
  return days === 7 ? 1 : days === 30 ? 5 : 15
}

/* ───────────────────────── 今日 / 本周 / 本月窗口 ───────────────────────── */

export type TrendMode = "day" | "week" | "month"

const WEEKDAY_LABELS_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

/**
 * 构建 今日 / 本周 / 本月 的学习窗口（不背单词统计页风格）：
 * - day：只有今天一个点
 * - week：本周一 ~ 今天
 * - month：本月 1 号 ~ 今天
 */
export function buildWindowTrend(
  state: VocaState,
  mode: TrendMode,
  lang: "zh" | "en",
  t: T,
): TrendPoint[] {
  const today = todayStr()
  const [y, m, d] = today.split("-").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  const points: TrendPoint[] = []
  const dateOf = (yy: number, mm: number, dd: number) =>
    `${yy}-${pad(mm)}-${pad(dd)}`

  if (mode === "day") {
    const s = state.activity[today]
    points.push({
      date: today,
      label: t("today"),
      learned: s?.learned ?? 0,
      reviewed: s?.reviewed ?? 0,
    })
    return points
  }

  if (mode === "week") {
    const dow = new Date(y, m - 1, d).getDay() // 0 = Sunday
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const yesterday = addDays(today, -1)
    for (let off = mondayOffset; off <= 0; off++) {
      const date = addDays(today, off)
      const s = state.activity[date]
      let label: string
      if (date === today) label = t("today")
      else if (date === yesterday) label = lang === "zh" ? "昨天" : "Yesterday"
      else {
        const [yy, mm, dd] = date.split("-").map(Number)
        const wd = new Date(yy, mm - 1, dd).getDay()
        label = lang === "zh" ? WEEKDAY_LABELS_ZH[wd] : WEEKDAYS_EN[wd]
      }
      points.push({
        date,
        label,
        learned: s?.learned ?? 0,
        reviewed: s?.reviewed ?? 0,
      })
    }
    return points
  }

  // month：本月 1 号 ~ 今天
  for (let dayNo = 1; dayNo <= d; dayNo++) {
    const date = dateOf(y, m, dayNo)
    const s = state.activity[date]
    points.push({
      date,
      label: date === today ? t("today") : mmdd(date),
      learned: s?.learned ?? 0,
      reviewed: s?.reviewed ?? 0,
    })
  }
  return points
}

/** 窗口趋势 X 轴标签步长（最多 ~6 个标签） */
export function windowLabelStep(n: number): number {
  if (n <= 7) return 1
  return Math.max(1, Math.ceil(n / 6))
}

/** 当前待复习词数 */
export function pendingCount(state: VocaState): number {
  const today = todayStr()
  let n = 0
  for (const w of state.words) {
    const p = state.progress[w.id]
    if (p && p.status !== "new" && p.due <= today) n += 1
  }
  return n
}
