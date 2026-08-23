import { BookOpen, ChartLine, Home, Layers } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useT } from "@/lib/i18n"
import type { LocaleKey } from "@/lib/locales"
import { cn } from "@/lib/utils"

export const TABS: {
  to: string
  key: LocaleKey
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  end?: boolean
}[] = [
  { to: "/", key: "tabToday", icon: Home, end: true },
  { to: "/words", key: "tabWords", icon: BookOpen },
  { to: "/review", key: "tabReview", icon: Layers },
  { to: "/insights", key: "tabInsights", icon: ChartLine },
]

export function TabBar() {
  const { t } = useT()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06] bg-background/90 backdrop-blur-xl lg:hidden dark:border-white/[0.08]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="主导航"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-[3px] py-1.5 transition-colors",
                isActive ? "text-primary" : "text-[#8e8e93]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  className="size-[25px]"
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span
                  className={cn(
                    "max-w-full truncate text-[10px] leading-none",
                    isActive ? "font-medium" : "font-normal",
                  )}
                >
                  {t(tab.key)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
