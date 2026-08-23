import * as React from "react"
import { LOCALES, type LocaleKey } from "./locales"
import { useVoca } from "@/store/voca-context"

/** 统一的界面语言 hook：t(key, vars?) → 翻译文本 */
export function useT() {
  const { state } = useVoca()
  const lang = state.settings.language

  const t = React.useCallback(
    (key: LocaleKey, vars?: Record<string, string | number>) => {
      let text = LOCALES[lang][key] ?? LOCALES.zh[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
        }
      }
      return text
    },
    [lang],
  )

  const locale = lang === "zh" ? "zh-CN" : "en-US"

  return { t, lang, locale }
}

export function dateStr(locale: string): string {
  return new Date().toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    weekday: "long",
  })
}

export function greetingKey(): LocaleKey {
  const h = new Date().getHours()
  if (h < 5) return "goodNight"
  if (h < 11) return "goodMorning"
  if (h < 13) return "goodNoon"
  if (h < 18) return "goodAfternoon"
  return "goodEvening"
}

type T = (key: LocaleKey, vars?: Record<string, string | number>) => string

/** 时长格式化：26 分钟 / 42 小时 15 分 · 26m / 42h 15m */
export function fmtDuration(
  seconds: number,
  t: T,
  lang: "zh" | "en",
): string {
  const m = Math.max(0, Math.round(seconds / 60))
  if (m < 60) return lang === "zh" ? `${m}${t("minWord")}` : `${m}${t("minWord")}`
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (lang === "zh") {
    return mm > 0 ? `${h}${t("hourWord")}${mm}${t("minWord")}` : `${h}${t("hourWord")}`
  }
  return mm > 0 ? `${h}${t("hourWord")} ${mm}${t("minWord")}` : `${h}${t("hourWord")}`
}

/** MM/DD 短日期 */
export function fmtShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-")
  return `${m}/${d}`
}
