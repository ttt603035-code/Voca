import { cn } from "@/lib/utils"

export interface BarSegment {
  value: number
  className: string
}

export interface BarPoint {
  label: string
  segments: BarSegment[]
  /** 高亮列（如“今天”） */
  highlight?: boolean
}

function niceMax(v: number): number {
  if (v <= 0) return 10
  const step = v > 50 ? 20 : 10
  return Math.ceil(v / step) * step
}

export function StackedBarChart({
  data,
  height = 200,
}: {
  data: BarPoint[]
  height?: number
}) {
  const maxTotal = Math.max(
    0,
    ...data.map((d) => d.segments.reduce((s, x) => s + x.value, 0)),
  )
  const top = niceMax(maxTotal)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f))

  return (
    <div className="flex gap-2">
      {/* Y 轴刻度 */}
      <div
        className="relative w-8 shrink-0"
        style={{ height }}
        aria-hidden
      >
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
            style={{ bottom: `${(i / (ticks.length - 1)) * 100}%` }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {/* 网格线 */}
          {ticks.map((_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-border/70"
              style={{ bottom: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          {/* 柱子 */}
          <div className="absolute inset-0 flex items-end gap-[3%] px-1">
            {data.map((d) => {
              const total = d.segments.reduce((s, x) => s + x.value, 0)
              return (
                <div
                  key={d.label}
                  className="flex h-full flex-1 flex-col justify-end"
                  title={`${d.label}：${total}`}
                >
                  {total > 0 && (
                    <div className="flex w-3/4 max-w-7 flex-col-reverse overflow-hidden rounded-md">
                      {d.segments
                        .filter((s) => s.value > 0)
                        .map((s, i) => (
                          <div
                            key={i}
                            className={cn("w-full transition-all", s.className)}
                            style={{ height: `${(s.value / top) * 100}%` }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {/* X 轴标签 */}
        <div className="mt-2 flex gap-[3%] px-1">
          {data.map((d) => (
            <span
              key={d.label}
              className={cn(
                "flex-1 truncate text-center text-[11px]",
                d.highlight
                  ? "font-semibold text-primary"
                  : "text-muted-foreground",
              )}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 图例 */
export function ChartLegend({
  items,
}: {
  items: { label: string; className: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((it) => (
        <span
          key={it.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span className={cn("size-3 rounded-sm", it.className)} />
          {it.label}
        </span>
      ))}
    </div>
  )
}
