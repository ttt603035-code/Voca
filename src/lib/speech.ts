import * as React from "react"
import { useVoca } from "@/store/voca-context"

/** 使用浏览器 Web Speech API 朗读英文单词 */
export function speakText(text: string, lang: "en-US" | "en-GB"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.9
    const voices = window.speechSynthesis.getVoices()
    const exact = voices.find((v) => v.lang === lang)
    const anyEn = voices.find(
      (v) =>
        v.lang.startsWith(lang === "en-GB" ? "en-GB" : "en") &&
        v.lang !== (lang === "en-GB" ? "en-US" : "en-GB"),
    )
    const voice = exact ?? anyEn
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
  } catch {
    // 忽略 TTS 不可用的环境
  }
}

/** 带设置的朗读 hook：受 Sound 开关与 Voice 偏好控制，返回正在朗读的单词 */
export function useSpeak() {
  const { state } = useVoca()
  const [speakingWord, setSpeakingWord] = React.useState<string | null>(null)
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const speak = React.useCallback(
    (word: string) => {
      if (!state.settings.sound) return
      speakText(word, state.settings.voice)
      setSpeakingWord(word)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setSpeakingWord(null), 1600)
    },
    [state.settings.sound, state.settings.voice],
  )

  return { speak, speakingWord }
}
