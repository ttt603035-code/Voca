import {
  BookOpenText,
  ChartNoAxesColumn,
  CircleX,
  Copy,
  Home,
  Layers3,
  ListChecks,
  Settings,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { GlassGroup, GlassIcon } from "@/components/ui/glass-item"
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
  { to: "/words", labelKey: "tabWords", icon: BookOpenText, tint: "#34C759" },
  { to: "/review", labelKey: "tabReview", icon: Layers3, tint: "#FF9500" },
  {
    to: "/insights",
    labelKey: "tabInsights",
    icon: ChartNoAxesColumn,
    tint: "#AF52DE",
  },
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
          "group relative flex min-h-[44px] w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-[background-color,transform] duration-150",
          isActive
            ? "bg-white/50 text-foreground shadow-[0_8px_22px_-16px_rgba(0,0,0,0.55)] dark:bg-white/[0.11]"
            : "text-foreground/80 hover:bg-white/32 active:scale-[0.99] dark:hover:bg-white/[0.06]",
        )
      }
    >
      <GlassIcon
        icon={item.icon}
        tint={item.tint}
        className="size-[30px] rounded-[9px]"
      />
      <span className="text-[15px] font-medium tracking-[-0.01em]">
        {t(item.labelKey)}
      </span>
    </NavLink>
  )
}

function NavSection({
  label,
  items,
}: {
  label?: string
  items: Item[]
}) {
  return (
    <section className="space-y-2">
      {label && (
        <p className="px-3 text-[12px] font-medium tracking-[0.02em] text-muted-foreground/80 uppercase">
          {label}
        </p>
      )}
      <GlassGroup
        dividers={false}
        tint={0.16}
        blur={26}
        radius={18}
        className="p-1.5"
      >
        <nav className="space-y-0.5">
          {items.map((item) => (
            <SideItem key={item.to} item={item} />
          ))}
        </nav>
      </GlassGroup>
    </section>
  )
}

/** 桌面端侧边导航：统一使用玻璃分组和玻璃列表项风格 */
export function SideNav() {
  const { t, lang } = useT()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col gap-5 overflow-y-auto px-4 pt-7 pb-6 lg:flex">
      <div className="px-3 pb-1">
        <p className="text-[23px] font-semibold tracking-[-0.03em]">Voca</p>
      </div>
      <NavSection items={MAIN} />
      <NavSection label={lang === "zh" ? "更多" : "More"} items={MORE} />
      <p className="mt-auto px-3 text-[12px] leading-relaxed text-muted-foreground/65">
        {t("appDesc")}
      </p>
    </aside>
  )
}
