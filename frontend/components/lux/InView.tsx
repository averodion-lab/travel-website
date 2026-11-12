"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Adds the class `in` the first time the element scrolls into view, which
 *  starts the `.lux-*` transitions in globals.css (rise, unveil, settle). */
export default function InView({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  style,
}: {
  children?: ReactNode;
  className?: string;
  /** Milliseconds before the transition starts, for staggered items. */
  delay?: number;
  as?: "div" | "li" | "section";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const merged = delay ? { ...style, transitionDelay: `${delay}ms` } : style;
  return (
    // @ts-expect-error: the ref fits every tag this component allows
    <Tag ref={ref} className={className} style={merged}>
      {children}
    </Tag>
  );
}
