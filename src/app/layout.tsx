import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import SiteTracker from "@/components/site-tracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

/** Cloudflare Web Analytics site tokens (public, safe to expose). */
const CF_ANALYTICS_WORKERS =
  process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ?? "a1a69dfa6c4b40fa90578726304c7042";
const CF_ANALYTICS_SITE = "6d0c3f15313c45abb6a251bf9be284da";

export const metadata: Metadata = {
  title: "LOCARD - More than just a card holder",
  description:
    "Card holder premium dengan tracker terpadu. Lacak lokasi terakhir, bunyikan alarm, dan tetap tenang — bahkan saat ponsel ikut hilang.",
  openGraph: {
    title: "LOCARD - More than just a card holder",
    description:
      "Card holder premium dengan tracker terpadu. Pre-order LOCARD mulai Rp299.000.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}

        <SiteTracker />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=location.hostname;var t=(h==="locard.site"||h.slice(-12)===".locard.site")?"${CF_ANALYTICS_SITE}":"${CF_ANALYTICS_WORKERS}";var s=document.createElement("script");s.src="https://static.cloudflareinsights.com/beacon.min.js";s.defer=true;s.setAttribute("data-cf-beacon",JSON.stringify({token:t}));(document.head||document.documentElement).appendChild(s)}catch(e){}})();`,
          }}
        />
      </body>
    </html>
  );
}
