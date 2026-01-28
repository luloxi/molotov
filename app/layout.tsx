import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "./components/SafeArea";
import { Navigation } from "./components/Navigation";
import { farcasterConfig } from "../farcaster.config";
import { Providers } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Molotov Gallery - NFT Art on Base",
    description: "Discover, collect, and sell extraordinary NFT art on Base. A decentralized gallery for artists and collectors.",
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <Navigation />
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </Providers>
  );
}
