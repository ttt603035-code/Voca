import type { WordProgress } from "@/lib/types"
import { todayStr } from "@/lib/srs"
import { cn } from "@/lib/utils"

/** Apple 风格轻量状态：小圆点 + 文字（不用 Badge 堆叠） */
export function wordStatusMeta(
  p: WordProgress,
  today = todayStr(),
): { label: string; color: string } {
  if (p.status === "new") {
    return { label: "未学习", color: "#8E8E93" }
  }
  if (p.status === "mastered") {
    return { label: "已掌握", color: "#34C759" }
  }
  if (p.due <= today) {
    return { label: "待复习", color: "#FF9500" }
  }
  return { label: "学习中", color: "#32ADE6" }
}

export function WordStatusText({
  progress,
  className,
}: {
  progress: WordProgress
  className?: string
}) {
  const { label, color } = wordStatusMeta(progress)
  return (
    <span
      className={cn("flex items-center gap-1.5 text-[13px]", className)}
      style={{ color }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
