import {
  BookOpen,
  ChartLine,
  CircleX,
  Copy,
  Home,
  Layers,
  ListChecks,
  Settings,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { useT } from "@/lib/i18n"
import type { LocaleKey } from "@/lib/locales"
import { cn } from "@/lib/utils"

interface Item {
  to: string
  labelKey: LocaleKey
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  tint: string
  end?: boolean
}

const MAIN: Item[] = [
  { to: "/", labelKey: "tabToday", icon: Home, tint: "#007AFF", end: true },
  { to: "/words", labelKey: "tabWords", icon: BookOpen, tint: "#34C759" },
  { to: "/review", labelKey: "tabReview", icon: Layers, tint: "#FF9500" },
  { to: "/insights", labelKey: "tabInsights", icon: ChartLine, tint: "#AF52DE" },
]

const MORE: Item[] = [
  { to: "/similar", labelKey: "similarWords", icon: Copy, tint: "#30B0C7" },
  { to: "/mistakes", labelKey: "mistakes", icon: CircleX, tint: "#FF3B30" },
  { to: "/test", labelKey: "practiceTest", icon: ListChecks, tint: "#FFCC00" },
  { to: "/settings", labelKey: "settings", icon: Settings, tint: "#8E8E93" },
]

function SideItem({ item }: { item: Item }) {
  const { t } = useT()
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[15px] transition-colors",
          isActive
            ? "text-primary-foreground"
            : "text-foreground/85 active:bg-foreground/[0.05] hover:bg-foreground/[0.04]",
        )
      }
      style={({ isActive }) =>
        isActive ? { backgroundColor: "var(--primary)" } : undefined
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px]"
            style={
              isActive
                ? { backgroundColor: "color-mix(in srgb, var(--primary) 18%, transparent)" }
                : { backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" }
            }
          >
            <item.icon
              className="size-[15px]"
              style={{ color: isActive ? "var(--primary-foreground)" : "var(--primary)" }}
            />
          </span>
          {t(item.labelKey)}
        </>
      )}
    </NavLink>
  )
}

/** iPadOS 风格侧边导航（Settings / Mail 式分组） */
export function SideNav() {
  const { t } = useT()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col gap-5 overflow-y-auto border-r border-black/[0.05] bg-background px-4 pt-7 pb-6 lg:flex dark:border-white/[0.06]">
      <nav className="space-y-0.5 rounded-[14px] bg-grouped p-1.5">
        {MAIN.map((item) => (
          <SideItem key={item.to} item={item} />
        ))}
      </nav>
      <div>
        <p className="mb-2 px-2.5 text-[13px] text-muted-foreground">More</p>
        <nav className="space-y-0.5 rounded-[14px] bg-grouped p-1.5">
          {MORE.map((item) => (
            <SideItem key={item.to} item={item} />
          ))}
        </nav>
      </div>
      <p className="mt-auto px-2.5 text-[12px] text-muted-foreground/70">
        Voca · {t("appDesc")}
      </p>
    </aside>
  )
}
