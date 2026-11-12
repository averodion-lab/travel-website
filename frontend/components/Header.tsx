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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            className="font-display text-xl uppercase tracking-[0.22em] sm:text-2xl sm:tracking-[0.3em] xl:absolute xl:left-1/2 xl:-translate-x-1/2"
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
            <details className="group relative xl:hidden">
              <summary
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-current [&::-webkit-details-marker]:hidden"
                aria-label="Menu"
              >
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                  <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </summary>
              <nav className="absolute right-0 mt-2 flex w-60 flex-col border border-line bg-cream py-2 text-ink shadow-lg" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href} className="lux-label px-5 py-3.5 hover:bg-sand">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>
      {/* Pages without a hero photo need room for the fixed header. */}
      {!overlay && <div className="h-[5.75rem]" />}
    </>
  );
}
