import { Badge } from "@/components/ui/badge"
import type { WordProgress } from "@/lib/types"
import { todayStr } from "@/lib/srs"

export function wordStatusLabel(
  p: WordProgress,
  today = todayStr(),
): { text: string; className: string } {
  if (p.status === "new") {
    return {
      text: "未学习",
      className: "border-transparent bg-muted text-muted-foreground",
    }
  }
  if (p.status === "mastered") {
    return {
      text: "已掌握",
      className:
        "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    }
  }
  if (p.due <= today) {
    return {
      text: "待复习",
      className: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
    }
  }
  return {
    text: "学习中",
    className: "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400",
  }
}

export function WordStatusBadge({
  progress,
}: {
  progress: WordProgress
}) {
  const { text, className } = wordStatusLabel(progress)
  return <Badge variant="outline" className={className}>{text}</Badge>
}
