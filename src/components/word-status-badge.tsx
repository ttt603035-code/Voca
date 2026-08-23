import { useT } from "@/lib/i18n"
import type { LocaleKey } from "@/lib/locales"
import type { WordProgress } from "@/lib/types"
import { todayStr } from "@/lib/srs"
import { cn } from "@/lib/utils"

/**
 * 单词状态（同色系：使用当前主题色的透明度变化，保持克制）
 * 未学习 → 灰色；学习中 → 主题色 60%；待复习/已掌握 → 主题色
 */
export function wordStatusMeta(
  p: WordProgress,
  today = todayStr(),
): { key: LocaleKey; color: string; dim?: boolean } {
  if (p.status === "new") {
    return { key: "statusNew", color: "var(--muted-foreground)" }
  }
  if (p.status === "mastered") {
    return { key: "statusMastered", color: "var(--primary)" }
  }
  if (p.due <= today) {
    return { key: "statusDue", color: "var(--primary)" }
  }
  return { key: "statusLearning", color: "var(--primary)", dim: true }
}

export function WordStatusText({
  progress,
  className,
}: {
  progress: WordProgress
  className?: string
}) {
  const { t } = useT()
  const { key, color, dim } = wordStatusMeta(progress)
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-[13px]",
        dim && "opacity-60",
        className,
      )}
      style={{ color }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color, opacity: dim ? 0.5 : 1 }}
      />
      {t(key)}
    </span>
  )
}
