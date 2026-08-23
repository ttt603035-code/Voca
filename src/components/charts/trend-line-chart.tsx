
export interface TrendPoint {
  label: string
  value: number
}

const W = 600
const H = 220
const PAD = { top: 18, right: 18, bottom: 28, left: 40 }

function niceMax(v: number): number {
  if (v <= 0) return 1
  if (v < 2) return 2
  if (v < 10) return Math.ceil(v)
  return Math.ceil(v / 5) * 5
}

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

/** 平滑趋势折线图（P2 风格：圆点 + 末点空心标记） */
export function TrendLineChart({
  points,
  color = "var(--primary)",
  unit = "",
}: {
  points: TrendPoint[]
  color?: string
  unit?: string
}) {
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const px = (i: number) =>
    PAD.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)
  const py = (v: number) => PAD.top + plotH - (v / top) * plotH

  const pts = points.map((p, i) => ({ x: px(i), y: py(p.value) }))
  const path = smoothPath(pts)
  const last = pts[pts.length - 1]
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f)
  // 14 天时只隔一个显示标签
  const labelStep = points.length > 10 ? 2 : 1

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="学习趋势图"
    >
      {ticks.map((t, i) => {
        const y = py(t)
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              className="stroke-border/70"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {Math.round(t * 10) / 10}
            </text>
          </g>
        )
      })}

      {path && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 4 : 3}
          fill={i === pts.length - 1 ? "var(--background)" : color}
          stroke={color}
          strokeWidth={2}
        />
      ))}

      {/* 末点数值 */}
      {last && (
        <text
          x={Math.min(last.x, W - PAD.right - 4)}
          y={Math.max(last.y - 12, 12)}
          textAnchor="end"
          fill={color}
          className="text-[12px] font-semibold"
        >
          {Math.round(points[points.length - 1].value * 10) / 10}
          {unit}
        </text>
      )}

      {points.map((p, i) =>
        i % labelStep === 0 || i === points.length - 1 ? (
          <text
            key={i}
            x={px(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  )
}
