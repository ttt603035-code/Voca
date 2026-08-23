import * as React from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { applyAccent } from "@/lib/accents"
import { SideNav } from "./side-nav"
import { TabBar } from "./tab-bar"
import { useVoca } from "@/store/voca-context"

/** 同步主题色 CSS 变量 */
function AccentSync() {
  const { state } = useVoca()
  const accentId = state.settings.accentId
  React.useEffect(() => {
    applyAccent(accentId)
  }, [accentId])
  return null
}

const KEY_TO_ROUTE: Record<string, string> = {
  T: "/",
  W: "/words",
  R: "/review",
  I: "/insights",
  S: "/similar",
  M: "/mistakes",
  P: "/test",
  G: "/settings",
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  // 键盘快捷键（桌面端）
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='dialog']",
        )
      ) {
        return
      }
      const route = KEY_TO_ROUTE[e.key.toUpperCase()]
      if (route) navigate(route)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [navigate])

  return (
    <div className="min-h-dvh">
      <AccentSync />
      <SideNav />
      <main className="lg:pl-[272px]">
        <div
          key={location.pathname}
          className="mx-auto w-full max-w-[680px] px-4 pt-6 pb-[calc(var(--tabbar-h)+24px)] animate-page-in sm:px-6 lg:pt-10 lg:pb-16"
        >
          <Outlet />
        </div>
      </main>
      <TabBar />
    </div>
  )
}
