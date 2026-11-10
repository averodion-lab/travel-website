import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Mrs_Saint_Delafield } from "next/font/google";
import Footer from "@/components/Footer";
import { SITE_NAME } from "@/lib/api";
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

// Handwritten accent used sparingly next to big headlines.
const script = Mrs_Saint_Delafield({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Luxury Fifth-Wheel Rental in the Southeast`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Rent a 40-foot luxury fifth wheel, delivered and set up for your trip to the Smoky Mountains, the Blue Ridge and the lakes of the Southeast. Book online in minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} ${script.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
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
