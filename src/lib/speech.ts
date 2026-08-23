/** 使用浏览器内置 TTS 朗读英文单词 */
export function speak(text: string, rate = 0.85): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = "en-US"
    u.rate = rate
    const enVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("en"))
    if (enVoice) u.voice = enVoice
    window.speechSynthesis.speak(u)
  } catch {
    // 忽略 TTS 不可用的环境
  }
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}
