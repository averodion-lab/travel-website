"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/api";

const NAV = [
  { href: "/fleet", label: "The Trailer" },
  { href: "/gallery", label: "Gallery" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/destinations", label: "Destinations" },
  { href: "/faq", label: "FAQ" },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV.map((item) => {
        const current = pathname === item.href || (item.href === "/fleet" && pathname.startsWith("/fleet"));
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className="nav-link eyebrow">
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

/** Stays at the top of the screen. With `overlay` it starts transparent over a
 *  hero photo and turns solid once the page is scrolled. */
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
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,color,box-shadow,padding] duration-300 ${
          clear ? "text-cream" : "bg-cream/90 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-md"
        }`}
      >
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 ${scrolled ? "py-3" : "py-5"} transition-[padding] duration-300`}>
          <Link href="/" className="font-display text-2xl uppercase tracking-[0.12em]">
            {SITE_NAME}
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {/* The current page is only known in the browser, so it gets its own boundary. */}
            <Suspense fallback={<NavLinks pathname="" />}>
              <CurrentNavLinks />
            </Suspense>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/fleet#book" className={`btn ${clear ? "btn-light" : "btn-dark"} !px-5 !py-3`}>
              Book Now
            </Link>
            <details className="group relative lg:hidden">
              <summary
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-current [&::-webkit-details-marker]:hidden"
                aria-label="Menu"
              >
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                  <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </summary>
              <nav className="absolute right-0 mt-2 flex w-56 flex-col border border-line bg-cream py-2 text-ink shadow-lg" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href} className="eyebrow px-5 py-3 hover:bg-sand">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>
      {/* Pages without a hero photo need room for the fixed header. */}
      {!overlay && <div className="h-[5.25rem]" />}
    </>
  );
}
