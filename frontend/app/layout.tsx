import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import Footer from "@/components/Footer";
import { SITE_NAME } from "@/lib/api";
import { INDEXABLE, OG, SITE_URL } from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

// Colours the phone browser's address bar to match the site.
export const viewport: Viewport = {
  themeColor: "#f7f3ec",
};

// Search and link-preview defaults; each page sets its own title,
// description, canonical link and preview image with lib/seo.ts pageMeta().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Luxury RV Rental, Delivered to Your Campsite | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Rent a luxury 40 ft fifth wheel from Canton, GA. We deliver and set it up at campgrounds across Georgia, the Smokies and the Southeast. Book online.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_US", images: [OG.home] },
  twitter: { card: "summary_large_image" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="film-grain flex min-h-full flex-col">
        {/* Every page opens at the top, also after a reload: stop the browser
            from restoring the old scroll position. A link to a spot on a page
            (like /fleet#book) still lands there: that spot streams in a moment
            after the page (first hidden, then moved into place), so wait until
            it is visible (up to 4 seconds), then scroll to it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{history.scrollRestoration='manual';if(!location.hash){window.scrollTo(0,0)}else{var id=decodeURIComponent(location.hash.slice(1)),n=0,t=setInterval(function(){var el=document.getElementById(id);if(el&&el.getClientRects().length){clearInterval(t);setTimeout(function(){el.scrollIntoView({block:'start',behavior:'instant'})},80)}else if(++n>80){clearInterval(t)}},50)}}catch(e){}",
          }}
        />
        {/* Without JavaScript nothing scrolls into view, so show everything. */}
        <noscript>
          <style>{".reveal{opacity:1;transform:none}"}</style>
        </noscript>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
