"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/api";

const NAV = [
  { href: "/fleet", label: "The Residence" },
  { href: "/gallery", label: "Gallery" },
  { href: "/how-it-works", label: "Experience" },
  { href: "/destinations", label: "Places" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

// Desktop: three links left of the name, three to its right.
const LEFT = NAV.slice(0, 3);
const RIGHT = NAV.slice(3);

function NavLinks({ pathname, items = NAV }: { pathname: string; items?: typeof NAV }) {
  return (
    <>
      {items.map((item) => {
        const current = pathname === item.href || (item.href === "/fleet" && pathname.startsWith("/fleet"));
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className="nav-link lux-label">
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function CurrentNavLinks({ items }: { items: typeof NAV }) {
  return <NavLinks pathname={usePathname()} items={items} />;
}

/** Stays at the top of the screen: links on the left, the name in the middle,
 *  "Reserve" on the right. With `overlay` it starts transparent over a hero
 *  photo and turns solid ivory once the page is scrolled. */
export default function Header({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the phone menu is open: no page scrolling, and Escape closes it.
  useEffect(() => {
    if (!menu) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const clear = overlay && !scrolled;
  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,color,box-shadow] duration-500 ${
          clear ? "text-cream" : "bg-cream/92 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-md"
        }`}
      >
        <div
          className={`relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 transition-[padding] duration-500 sm:px-8 ${
            scrolled ? "py-3" : "py-6"
          }`}
        >
          <nav className="hidden items-center gap-7 xl:flex" aria-label="Main">
            {/* The current page is only known in the browser, so it gets its own boundary. */}
            <Suspense fallback={<NavLinks pathname="" items={LEFT} />}>
              <CurrentNavLinks items={LEFT} />
            </Suspense>
          </nav>

          <Link
            href="/"
            className="py-2 font-display text-xl uppercase tracking-[0.22em] sm:text-2xl sm:tracking-[0.3em] xl:absolute xl:left-1/2 xl:-translate-x-1/2"
          >
            {SITE_NAME}
          </Link>

          <div className="flex items-center gap-3 xl:gap-7">
            <nav className="hidden items-center gap-7 xl:flex" aria-label="More">
              <Suspense fallback={<NavLinks pathname="" items={RIGHT} />}>
                <CurrentNavLinks items={RIGHT} />
              </Suspense>
            </nav>
            <Link href="/book-now" className="lux-label border border-current px-3 py-3 transition-colors hover:bg-current/10 sm:px-5">
              Reserve
            </Link>
            <button
              type="button"
              onClick={() => setMenu(true)}
              aria-label="Menu"
              aria-expanded={menu}
              aria-controls="site-menu"
              className="flex h-11 w-11 items-center justify-center border border-current xl:hidden"
            >
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Phone and tablet menu: a full-screen ivory page with large links.
          Outside <header>, whose backdrop blur would trap a fixed child. */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menu}
        className={`fixed inset-0 z-50 flex flex-col bg-cream text-ink transition-[opacity,visibility] duration-500 xl:hidden ${
          menu ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6 sm:px-8">
          <Link
            href="/"
            onClick={() => setMenu(false)}
            tabIndex={menu ? 0 : -1}
            className="font-display text-xl uppercase tracking-[0.22em] sm:text-2xl sm:tracking-[0.3em]"
          >
            {SITE_NAME}
          </Link>
          <button
            type="button"
            onClick={() => setMenu(false)}
            aria-label="Close menu"
            tabIndex={menu ? 0 : -1}
            className="flex h-11 w-11 items-center justify-center border border-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-5 sm:px-8" aria-label="Mobile">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenu(false)}
              tabIndex={menu ? 0 : -1}
              className="flex items-baseline gap-4 py-2 font-display text-4xl transition-[opacity,transform] duration-700 ease-out sm:text-5xl"
              style={{
                opacity: menu ? 1 : 0,
                transform: menu ? "none" : "translateY(18px)",
                transitionDelay: menu ? `${120 + i * 60}ms` : "0ms",
              }}
            >
              <span className="w-7 font-sans text-xs text-muted">0{i + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8">
          <Link
            href="/book-now"
            onClick={() => setMenu(false)}
            tabIndex={menu ? 0 : -1}
            className="btn btn-primary w-full"
          >
            Reserve your stay
          </Link>
          <p className="lux-label mt-5 text-center text-muted">Georgia · The Carolinas · Tennessee · Alabama</p>
        </div>
      </div>
      {/* Pages without a hero photo need room for the fixed header. */}
      {!overlay && <div className="h-[5.75rem]" />}
    </>
  );
}
