import type { Metadata } from "next";
import { Bowlby_One, IBM_Plex_Sans, Inter } from "next/font/google";
import Script from "next/script";
import PostHogProvider from "./providers/PostHogProvider";
import "./globals.css";

const cloudflareWebAnalyticsBeacon = JSON.stringify({
  token: "36f5cb17deb24553b7a108978c4aa49a",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby-one",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ege Çam - Music Portfolio",
  description: "Music projects and releases by Ege Cam.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ibmPlexSans.variable} ${bowlbyOne.variable} antialiased`}
      >
        <PostHogProvider>{children}</PostHogProvider>
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={cloudflareWebAnalyticsBeacon}
        />
      </body>
    </html>
  );
}
