import { cn } from "@/lib/utils"

function niceMax(v: number): number {
  if (v <= 0) return 1
  if (v < 4) return 4
  if (v < 10) return 10
  return Math.ceil(v / 5) * 5
}

/* ─────────────── Apple 风格圆角柱状图 ─────────────── */

export function AppleBars({
  data,
  height = 170,
  color = "var(--primary)",
  labelStep = 1,
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  /** 每隔几个显示一个 X 轴标签 */
  labelStep?: number
}) {
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)))
  return (
    <div>
      <div className="relative" style={{ height }}>
        <div
          className="absolute inset-0 flex items-end gap-[3.5%] px-1"
          aria-hidden
        >
          {data.map((d, i) => (
            <div key={i} className="flex h-full flex-1 justify-center">
              <div
                className="w-full max-w-[26px] rounded-[4px] transition-[height] duration-500 ease-out"
                style={{
                  height:
                    d.value > 0
                      ? `max(${(d.value / top) * 100}%, 4px)`
                      : "3px",
                  backgroundColor: d.value > 0 ? color : "rgba(120,120,128,0.25)",
                }}
                title={`${d.label}：${d.value}`}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t border-border/80" />
      </div>
      <div className="mt-2 flex gap-[3.5%] px-1">
        {data.map((d, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center text-[11px] text-muted-foreground"
          >
            {i % labelStep === 0 || i === data.length - 1 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── Apple 风格面积曲线 ─────────────── */

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export function AppleArea({
  points,
  height = 150,
  color = "var(--primary)",
}: {
  points: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  const W = 600
  const H = 160
  const PAD = { top: 14, bottom: 8, left: 6, right: 6 }
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const px = (i: number) =>
    PAD.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)
  const py = (v: number) => PAD.top + plotH - (v / top) * plotH
  const pts = points.map((p, i) => ({ x: px(i), y: py(p.value) }))
  const line = smoothPath(pts)
  const area = line
    ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD.bottom} L ${pts[0].x.toFixed(1)} ${H - PAD.bottom} Z`
    : ""
  const last = pts[pts.length - 1]

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="学习时长趋势"
      >
        {area && <path d={area} fill={color} opacity={0.12} />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r={4.5}
            fill={color}
            stroke="var(--card)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <div className="mt-1 flex justify-between border-t border-border/80 pt-1.5">
        {points.map((p, i) => (
          <span
            key={i}
            className={cn(
              "text-[11px] text-muted-foreground",
              points.length > 8 && i % 2 !== 0 && i !== points.length - 1 && "hidden sm:inline",
            )}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── 横向占比条 ─────────────── */

export function AppleStackedBar({
  parts,
  className,
}: {
  parts: { value: number; className: string }[]
  className?: string
}) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  return (
    <div
      className={cn(
        "flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]",
        className,
      )}
    >
      {parts
        .filter((p) => p.value > 0)
        .map((p, i) => (
          <div
            key={i}
            className={p.className}
            style={{ width: `${(p.value / total) * 100}%` }}
          />
        ))}
    </div>
  )
}

export function ChartDot({
  className,
  label,
  count,
}: {
  className: string
  label: string
  count?: number
}) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
      {count !== undefined && (
        <span className="font-medium text-foreground/80 tabular-nums">{count}</span>
      )}
    </span>
  )
}
