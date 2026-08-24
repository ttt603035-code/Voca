import {
  BookOpenText,
  ChartNoAxesColumn,
  Home,
  Layers3,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/glass-tabs"
import { useT } from "@/lib/i18n"
import type { LocaleKey } from "@/lib/locales"
import { cn } from "@/lib/utils"

export const TABS: {
  to: string
  key: LocaleKey
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string; strokeWidth?: number }>
  end?: boolean
}[] = [
  { to: "/", key: "tabToday", icon: Home, end: true },
  { to: "/words", key: "tabWords", icon: BookOpenText },
  { to: "/review", key: "tabReview", icon: Layers3 },
  { to: "/insights", key: "tabInsights", icon: ChartNoAxesColumn },
]

/** 当前路径匹配到哪个主 tab（用于设置玻璃滑块的初始位置） */
function useActiveTab() {
  const { pathname } = useLocation()
  const match = TABS.find((tab) =>
    tab.end ? pathname === tab.to : pathname.startsWith(tab.to),
  )
  return match?.to ?? "/"
}

/**
 * 移动端底部悬浮「液态玻璃」导航坞。
 * 使用 Glass Tabs 的弹簧水滴指示器在 tab 之间滑动。
 */
export function TabBar() {
  const { t } = useT()
  const navigate = useNavigate()
  const active = useActiveTab()

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{
        paddingLeft: "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
      }}
    >
      <Tabs
        value={active}
        onValueChange={(v) => navigate(v)}
        className="w-full"
      >
        <TabsList
          tint={0.22}
          className="w-full border border-white/25 shadow-[0_12px_36px_-14px_rgba(0,0,0,0.26)] dark:border-white/[0.07]"
          contentClassName="w-full"
        >
          {TABS.map((tab) => {
            const on = active === tab.to
            return (
              <TabsTrigger
                key={tab.to}
                value={tab.to}
                aria-label={t(tab.key)}
                className="h-12 min-w-0 flex-1 flex-col gap-1 px-1 py-1"
              >
                <tab.icon
                  className={cn(
                    "size-[22px] transition-transform duration-200",
                    on && "scale-110",
                  )}
                  fill="none"
                  strokeWidth={on ? 2.2 : 1.75}
                />
                <span className="max-w-full truncate text-[10px] leading-none font-medium tracking-tight">
                  {t(tab.key)}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </div>
  )
}
