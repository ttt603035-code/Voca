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
