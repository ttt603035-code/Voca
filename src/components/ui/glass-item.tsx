"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";
import { GlassSurface } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

/**
 * GlassGroup — a frosted glass panel that groups glass items together,
 * matching the glasscn sidebar / item surface. Hairline dividers separate rows.
 */
export function GlassGroup({
  children,
  className,
  dividers = true,
  tint = 0.2,
  radius = 20,
  blur = 20,
  as,
  ...props
}: Omit<React.HTMLAttributes<HTMLElement>, "slot"> & {
  dividers?: boolean;
  tint?: number;
  radius?: number;
  blur?: number;
  as?: keyof React.JSX.IntrinsicElements;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  return (
    <GlassSurface
      {...props}
      as={as}
      tint={tint}
      blur={blur}
      saturation={1.55}
      radius={radius}
      specular
      className={cn(
        "overflow-hidden border border-white/30 shadow-[0_12px_34px_-18px_rgba(0,0,0,0.22)] dark:border-white/[0.07] dark:shadow-[0_12px_34px_-18px_rgba(0,0,0,0.65)]",
        className,
      )}
      contentClassName={cn(
        dividers && "divide-y divide-white/25 dark:divide-white/[0.055]",
      )}
    >
      {children}
    </GlassSurface>
  );
}

/** Tinted rounded icon tile used at the leading edge of a glass item. */
export function GlassIcon({
  icon: Icon,
  tint,
  className,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string; style?: React.CSSProperties }>;
  tint?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-white/35 backdrop-blur-lg dark:border-white/[0.07]",
        className,
      )}
      style={{
        backgroundColor: tint
          ? `color-mix(in oklab, ${tint} 16%, transparent)`
          : "rgba(120,120,128,0.1)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <Icon
        className="size-[18px]"
        fill="none"
        style={tint ? { color: tint } : undefined}
      />
    </span>
  );
}

export interface GlassItemProps {
  icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  tint?: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
  as?: "div" | "button";
  children?: React.ReactNode;
}

/**
 * GlassItem — one row in a glass group, with a tinted glass icon tile,
 * title + description, optional trailing and chevron. Presses lift/scrim.
 */
export function GlassItem({
  icon: Icon,
  tint,
  primary,
  secondary,
  trailing,
  chevron,
  onClick,
  className,
  as,
  children,
}: GlassItemProps) {
  const Tag = (as === "button" || onClick) ? "button" : "div";
  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group flex w-full min-h-[48px] items-center gap-3 px-3.5 py-3 text-left transition-[background-color,transform] duration-150",
        onClick &&
          "cursor-pointer active:bg-white/40 dark:active:bg-white/[0.06] active:scale-[0.995]",
        className,
      )}
    >
      {Icon && <GlassIcon icon={Icon} tint={tint} />}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[16px] leading-tight tracking-[-0.01em]">
          {primary}
        </span>
        {secondary && (
          <span className="truncate text-[13px] leading-tight text-muted-foreground">
            {secondary}
          </span>
        )}
        {children}
      </span>
      {trailing != null && (
        <span className="flex shrink-0 items-center gap-2">{trailing}</span>
      )}
      {chevron && (
        <ChevronRight className="size-[18px] shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </Tag>
  );
}

/* ───────────────────────── 圆形玻璃图标按钮（顶栏用） ───────────────────────── */

export function GlassIconButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <GlassSurface
      as="button"
      type="button"
      onClick={onClick}
      aria-label={label}
      tint={0.28}
      blur={18}
      radius={9999}
      specular
      className={cn(
        "flex size-10 items-center justify-center border border-white/35 text-primary shadow-[0_8px_24px_-14px_rgba(0,0,0,0.4)] transition-transform duration-150 active:scale-90 dark:border-white/[0.09]",
        className,
      )}
      contentClassName="flex size-full items-center justify-center"
    >
      <Icon className="size-[20px]" />
    </GlassSurface>
  );
}
