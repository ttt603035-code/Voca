import { Menu, X } from "lucide-react"
import * as React from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { applyAccent } from "@/lib/accents"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { useVoca } from "@/store/voca-context"

interface NavItem {
  to: string
  label: string
  key: string
  end?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "计划",
    items: [{ to: "/", label: "主页", key: "H", end: true }],
  },
  {
    title: "练习",
    items: [
      { to: "/words", label: "单词本", key: "W" },
      { to: "/learn", label: "卡片学习", key: "C" },
      { to: "/quiz", label: "快速测试", key: "Q" },
      { to: "/confusables", label: "近义词辨析", key: "N" },
    ],
  },
  {
    title: "统计",
    items: [
      { to: "/progress", label: "学习进度", key: "P" },
      { to: "/trends", label: "学习趋势", key: "T" },
    ],
  },
  {
    title: "系统",
    items: [{ to: "/settings", label: "设置", key: "S" }],
  },
]

const KEY_TO_ROUTE = Object.fromEntries(
  NAV_SECTIONS.flatMap((s) => s.items).map((i) => [i.key, i.to]),
)

const PAGE_TITLES: [string, string][] = [
  ["/words", "单词本"],
  ["/learn", "卡片学习"],
  ["/quiz", "快速测试"],
  ["/confusables", "近义词辨析"],
  ["/progress", "学习进度"],
  ["/trends", "学习趋势"],
  ["/settings", "设置"],
]

/** 同步主题色 CSS 变量 */
function AccentSync() {
  const { state } = useVoca()
  const accentId = state.settings.accentId
  React.useEffect(() => {
    applyAccent(accentId)
  }, [accentId])
  return null
}

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 切换页面时关闭抽屉
  React.useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // 键盘快捷键（H / W / C / Q / N / P / T / S）
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

  const title =
    PAGE_TITLES.find(([p]) => location.pathname.startsWith(p))?.[1] ?? "主页"

  return (
    <div className="min-h-screen">
      <AccentSync />

      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开目录"
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="text-base font-semibold">{title}</h1>
        </div>
      </header>

      {/* 左侧抽屉目录（P1 风格） */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[300px] gap-0 overflow-y-auto p-5 sm:max-w-[320px]">
          <SheetTitle className="sr-only">目录</SheetTitle>
          <div className="mb-5 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              目录
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setDrawerOpen(false)}
              aria-label="关闭目录"
            >
              <X className="size-4" />
            </Button>
          </div>

          <nav className="space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-2">
                <div className="px-1 text-xs font-medium text-muted-foreground">
                  {section.title}
                </div>
                <div className="space-y-0.5 rounded-xl border bg-card p-1.5 shadow-sm">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground/80 hover:bg-accent",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "w-4 text-center text-xs font-semibold tabular-nums",
                              isActive
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground/70",
                            )}
                          >
                            {item.key}
                          </span>
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <p className="mt-6 px-1 text-[11px] leading-relaxed text-muted-foreground">
            提示：在页面任意位置按字母键（H / W / C / Q / N / P / T / S）可快速跳转。
          </p>
        </SheetContent>
      </Sheet>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
