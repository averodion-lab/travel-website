"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
};

/** A pill button with a down arrow that opens a list of choices (a styled
 * select, so each choice can show an icon and a count). */
export default function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  // Close on a click outside; focus the chosen option when the list opens.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function pick(v: T) {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  }

  function onKey(e: React.KeyboardEvent<HTMLUListElement>) {
    const items = [
      ...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
    ];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? i + 1 : i - 1;
      items[(next + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex min-h-11 items-center gap-2 rounded-full border px-5 py-2 text-sm transition-colors ${open ? "border-ink bg-white text-ink" : "border-line bg-white text-bark hover:border-bark"}`}
      >
        {current.icon}
        {current.label}
        {current.count !== undefined && (
          <span className="tabular-nums opacity-60">{current.count}</span>
        )}
        <svg
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
          className={`ml-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="m5 7.5 5 5 5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          id={id}
          role="listbox"
          aria-label={label}
          onKeyDown={onKey}
          className="absolute left-0 top-full z-[700] mt-2 max-h-80 min-w-full overflow-y-auto rounded-xl border border-line bg-white py-1.5 shadow-lg"
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={on}
                tabIndex={-1}
                onClick={() => pick(o.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(o.value);
                  }
                }}
                className={`flex cursor-pointer items-center gap-2.5 whitespace-nowrap px-4 py-2.5 text-sm outline-none hover:bg-sand focus-visible:bg-sand ${on ? "text-ink" : "text-bark"}`}
              >
                {o.icon}
                <span className={on ? "font-medium" : ""}>{o.label}</span>
                {o.count !== undefined && (
                  <span className="ml-auto pl-4 tabular-nums opacity-60">
                    {o.count}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={`w-3 text-clay-dark ${on ? "" : "invisible"}`}
                >
                  ✓
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
