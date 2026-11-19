import type { Metadata, Viewport } from "next";
import { Great_Vibes, Cormorant_Garamond, Nunito } from "next/font/google";
import "./globals.css";
import "./invite.css";
import "./invite-wide.css";
import { invitation } from "@/config/invitation";

const script = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-script", display: "swap" });
const sans = Nunito({ weight: ["600", "700", "800"], subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Cormorant_Garamond({ weight: ["500", "600", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(invitation.siteUrl),
  title: "A Sea of Blessings for Aurora",
  description: "You're invited to Aurora's magical underwater world.",
  openGraph: { title: "A Sea of Blessings for Aurora", description: "A little magic awaits beneath the waves...", type: "website" },
  robots: { index: false, follow: false }, // private family invitation
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#7cc4e4" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${script.variable} ${serif.variable} ${sans.variable}`}>
      <head>
        {/* first video frames start loading immediately: phone poster / desktop poster */}
        <link rel="preload" as="image" href="/media/poster.jpg" media="(max-width: 899px), (max-aspect-ratio: 1/1)" />
        <link rel="preload" as="image" href="/media/desktop-poster.jpg" media="(min-width: 900px) and (min-aspect-ratio: 1/1)" />
      </head>
      <body>{children}</body>
    </html>
  );
}
