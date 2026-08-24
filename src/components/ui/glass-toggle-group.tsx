"use client";

import {
  type ComponentProps,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GlassSurface } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

interface ToggleCtx {
  value: string;
  setValue: (v: string) => void;
}
const ToggleContext = createContext<ToggleCtx>({
  value: "",
  setValue: () => undefined,
});

interface GlassToggleGroupProps extends Omit<ComponentProps<"div">, "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  tint?: number;
  children?: ReactNode;
}

/** A segmented control — a frosted bar with a sliding glass indicator. */
export function GlassToggleGroup({
  value: controlled,
  defaultValue = "",
  onValueChange,
  tint = 0.35,
  className,
  children,
  ...props
}: GlassToggleGroupProps) {
  const [internal, setInternal] = useState(defaultValue);
  const active = controlled !== undefined ? controlled : internal;
  const setValue = useCallback(
    (v: string) => {
      if (controlled === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );
  const ctx = useMemo(() => ({ value: active, setValue }), [active, setValue]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const indicator = useRef<HTMLDivElement | null>(null);

  const place = useCallback(() => {
    const list = listRef.current;
    const ind = indicator.current;
    if (!list || !ind) return;
    const el = list.querySelector<HTMLElement>(
      `[data-toggle][data-value="${CSS.escape(active)}"]`,
    );
    if (!el) {
      ind.style.opacity = "0";
      return;
    }
    ind.style.opacity = "1";
    ind.style.width = `${el.offsetWidth}px`;
    ind.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [active]);

  useLayoutEffect(() => {
    place();
  }, [place]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [place]);

  return (
    <ToggleContext.Provider value={ctx}>
      <GlassSurface
        {...props}
        tint={tint}
        radius={9999}
        className={cn("relative isolate w-full p-1", className)}
        contentClassName="relative flex w-full items-center"
      >
        <div ref={listRef} className="relative flex w-full items-center gap-0">
          <div
            ref={indicator}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-white/70 opacity-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-[transform,width,opacity] duration-300 ease-out dark:bg-white/[0.14] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]"
          />
          {children}
        </div>
      </GlassSurface>
    </ToggleContext.Provider>
  );
}

interface GlassToggleItemProps extends ComponentProps<"button"> {
  value: string;
}

export function GlassToggleItem({
  value,
  children,
  className,
  ...props
}: GlassToggleItemProps) {
  const { value: active, setValue } = useContext(ToggleContext);
  const on = active === value;
  return (
    <button
      type="button"
      data-toggle
      data-value={value}
      aria-pressed={on}
      onClick={() => setValue(value)}
      className={cn(
        "relative z-10 inline-flex select-none items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
        on
          ? "text-foreground"
          : "text-foreground/60 hover:text-foreground/85",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
