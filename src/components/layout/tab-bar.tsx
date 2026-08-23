import { BookOpen, ChartLine, Home, Layers } from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

export const TABS: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  end?: boolean
}[] = [
  { to: "/", label: "Today", icon: Home, end: true },
  { to: "/words", label: "Words", icon: BookOpen },
  { to: "/review", label: "Review", icon: Layers },
  { to: "/insights", label: "Insights", icon: ChartLine },
]

export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06] bg-card/90 backdrop-blur-xl lg:hidden dark:border-white/[0.08] dark:bg-[#1c1c1e]/90"
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
                    "text-[10px] leading-none",
                    isActive ? "font-medium" : "font-normal",
                  )}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
