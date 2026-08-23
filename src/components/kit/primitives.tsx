import { ChevronRight, Minus, Plus, Search, X } from "lucide-react"
import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

/* ───────────────────────── 标题层级 ───────────────────────── */

export function LargeTitle({
  title,
  actions,
  back,
}: {
  title: string
  actions?: React.ReactNode
  back?: () => void
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5">
        {back && (
          <button
            type="button"
            onClick={back}
            className="-ml-2 flex size-9 items-center justify-center rounded-full text-primary active:bg-foreground/[0.06]"
            aria-label="返回"
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="truncate text-[32px] leading-[41px] font-semibold tracking-[-0.02em]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{children}</h2>
  )
}

export function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-[13px] font-normal text-muted-foreground">
      {children}
    </p>
  )
}

/* ───────────────────────── 分组容器 / 列表行 ───────────────────────── */

/** iOS inset grouped list 容器（白底页面上的极浅灰分组） */
export function InsetGroup({
  className,
  children,
  dividers = true,
}: {
  className?: string
  children: React.ReactNode
  dividers?: boolean
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[19px] bg-grouped",
        dividers && "divide-y divide-border/70",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ListRow({
  icon: Icon,
  tint,
  primary,
  secondary,
  trailing,
  chevron,
  onClick,
  className,
  as = "div",
}: {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  tint?: string
  primary: React.ReactNode
  secondary?: React.ReactNode
  trailing?: React.ReactNode
  chevron?: boolean
  onClick?: () => void
  className?: string
  as?: "div" | "button"
}) {
  const Tag = (as === "button" || onClick) && "button" || "div"
  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left",
        onClick && "cursor-pointer transition-colors active:bg-foreground/[0.045]",
        className,
      )}
    >
      {Icon && (
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-[8px]"
          style={
            tint
              ? { backgroundColor: `${tint}1A` }
              : { backgroundColor: "rgba(120,120,128,0.12)" }
          }
        >
          <Icon
            className="size-[18px]"
            style={tint ? { color: tint } : undefined}
          />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[17px] leading-tight">{primary}</span>
        {secondary && (
          <span className="truncate text-[15px] leading-tight text-muted-foreground">
            {secondary}
          </span>
        )}
      </span>
      {trailing && (
        <span className="flex shrink-0 items-center gap-2">{trailing}</span>
      )}
      {chevron && (
        <ChevronRight className="size-[18px] shrink-0 text-muted-foreground/35" />
      )}
    </Tag>
  )
}

/* ───────────────────────── 搜索框 ───────────────────────── */

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded-[10px] bg-foreground/[0.055] px-3 transition-shadow focus-within:ring-2 focus-within:ring-ring/40 dark:bg-white/[0.08]",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground/80" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search"}
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex size-5 items-center justify-center rounded-full bg-foreground/20 active:bg-foreground/30"
          aria-label="清空"
        >
          <X className="size-3 text-white dark:text-black/60" />
        </button>
      )}
    </div>
  )
}

/* ───────────────────────── 按钮 ───────────────────────── */

export function AppleButton({
  variant = "filled",
  size = "default",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "filled" | "tinted" | "plain"
  size?: "default" | "sm"
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[12px] font-medium transition-opacity active:opacity-75 disabled:pointer-events-none disabled:opacity-40",
        variant === "filled" &&
          "h-12 w-full bg-primary text-[17px] text-primary-foreground",
        variant === "tinted" &&
          "h-12 w-full bg-primary/10 text-[17px] text-primary",
        variant === "plain" && "h-11 px-4 text-[17px] text-primary",
        size === "sm" && "h-10 text-[15px]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** 顶栏小图标按钮 */
export function IconBtn({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-primary transition-colors active:bg-foreground/[0.06]",
        className,
      )}
    >
      <Icon className="size-[22px]" />
    </button>
  )
}

/* ───────────────────────── 进度条 ───────────────────────── */

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div
      className={cn(
        "h-1 w-full overflow-hidden rounded-full bg-foreground/[0.08]",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
          barClassName,
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* ───────────────────────── 分段控件 ───────────────────────── */

export function SegmentedControl({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex w-fit rounded-[10px] bg-foreground/[0.055] p-0.5 dark:bg-white/[0.08]",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-8 rounded-[8px] px-3.5 text-[14px] font-medium transition-all",
              active
                ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-[#48484a]"
                : "text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── 步进器 ───────────────────────── */

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 100,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)))
  return (
    <div className="flex items-center overflow-hidden rounded-[10px] bg-foreground/[0.055] dark:bg-white/[0.08]">
      <button
        type="button"
        onClick={() => set(value - 1)}
        className="flex size-9 items-center justify-center text-primary transition-colors active:bg-foreground/[0.06]"
        aria-label="减少"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-9 text-center text-[15px] tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => set(value + 1)}
        className="flex size-9 items-center justify-center text-primary transition-colors active:bg-foreground/[0.06]"
        aria-label="增加"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

/* ───────────────────────── 统计块 ───────────────────────── */

export function StatTile({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 bg-card px-4 py-4", className)}>
      <span className="text-[28px] leading-none font-medium tracking-[-0.01em] tabular-nums">
        {value}
      </span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  )
}

/* ───────────────────────── 空状态 ───────────────────────── */

export function EmptyState({
  icon: Icon,
  tint = "var(--primary)",
  title,
  description,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  tint?: string
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
      {Icon && (
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{
            backgroundColor: `color-mix(in oklab, ${tint} 12%, transparent)`,
          }}
        >
          <Icon className="size-7" style={{ color: tint }} />
        </div>
      )}
      <div>
        <p className="text-[17px] font-semibold">{title}</p>
        {description && (
          <p className="mt-1 max-w-64 text-[15px] leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

/* ───────────────────────── iOS 风格弹窗 ───────────────────────── */

export function AppleAlert({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  destructive,
  onConfirm,
  rows,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm?: () => void
  /** 自定义多行操作（如导入冲突：更新 / 副本 / 取消） */
  rows?: { label: string; onClick: () => void; destructive?: boolean }[]
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] animate-fade-in"
        />
        <AlertDialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-[81] w-[calc(100vw-48px)] max-w-[300px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-popover p-0 shadow-[0_20px_60px_rgba(0,0,0,0.28)] animate-pop-in dark:bg-[#2c2c2e]"
        >
          <div className="px-6 pt-5 pb-4 text-center">
            <AlertDialogPrimitive.Title className="text-[17px] leading-snug font-semibold">
              {title}
            </AlertDialogPrimitive.Title>
            {description && (
              <AlertDialogPrimitive.Description className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                {description}
              </AlertDialogPrimitive.Description>
            )}
          </div>
          {rows ? (
            <div className="grid grid-cols-1 divide-y divide-border border-t border-border">
              {rows.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => {
                    r.onClick()
                    onOpenChange(false)
                  }}
                  className={cn(
                    "h-[46px] bg-transparent text-[17px] transition-colors active:bg-foreground/[0.05]",
                    r.destructive
                      ? "font-semibold text-destructive"
                      : "font-medium text-primary",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "grid border-t border-border",
                cancelLabel ? "grid-cols-2 divide-x divide-border" : "grid-cols-1",
              )}
            >
              {cancelLabel && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-[46px] bg-transparent text-[17px] font-medium text-primary transition-colors active:bg-foreground/[0.05]"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onConfirm?.()
                  onOpenChange(false)
                }}
                className={cn(
                  "h-[46px] bg-transparent text-[17px] transition-colors active:bg-foreground/[0.05]",
                  destructive ? "font-semibold text-destructive" : "font-medium text-primary",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          )}
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

/** 用于 asChild 包装（如 Link） */
export const SlotEl = Slot
