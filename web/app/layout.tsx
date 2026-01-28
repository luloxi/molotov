import type { Metadata } from "next";
import { DM_Sans, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "./components/SafeArea";
import { Navigation } from "./components/Navigation";
import { ErrorFilter } from "./components/ErrorFilter";
import { farcasterConfig } from "../farcaster.config";
import { Providers } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Molotov Gallery - NFT Art on Base",
    description:
      "Discover, collect, and sell extraordinary NFT art on Base. A decentralized gallery for artists and collectors.",
    icons: {
      icon: [
        {
          url: "/mini-logo.svg",
          type: "image/svg+xml",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: farcasterConfig.miniapp.version,
        imageUrl: farcasterConfig.miniapp.heroImageUrl,
        button: {
          title: "Explore Gallery",
          action: {
            name: "Launch Molotov Gallery",
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en">
        <body className={`${dmSans.variable} ${sourceCodePro.variable}`}>
          <ErrorFilter />
          <Navigation />
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </Providers>
  );
}
