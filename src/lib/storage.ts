/**
 * 安全 localStorage 包装
 * 部分环境（Safari 隐私模式、禁用 Cookie 的浏览器、file:// 协议）
 * 访问 localStorage 会抛异常 —— 直接抛异常会导致整个 React 应用白屏。
 */

function isAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false
    const k = "__voca_storage_test__"
    window.localStorage.setItem(k, "1")
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

let available: boolean | null = null

function check(): boolean {
  if (available === null) available = isAvailable()
  return available
}

export const safeStorage = {
  get(key: string): string | null {
    if (!check()) return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    if (!check()) return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // 存储不可用（隐私模式/配额满）：静默降级为内存态
    }
  },
  remove(key: string): void {
    if (!check()) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}
