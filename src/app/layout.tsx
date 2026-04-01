import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Elementals — Cosmic Card Duel",
  description: "A competitive 1v1 card game of Sun, Moon, and Star.",
  icons:       { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#050510",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full overflow-hidden bg-cosmic-900 text-white font-body antialiased">
        {/* Persistent starfield */}
        <div className="starfield" aria-hidden="true" />
        {/* App content */}
        <div className="relative z-10 h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
