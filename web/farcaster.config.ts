export const farcasterConfig = {
  miniapp: {
    name: "Molotov Gallery",
    description: "Discover, collect, and sell extraordinary NFT art on Base",
    version: "next",
    heroImageUrl: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/hero.png`,
    iconUrl: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/icon.png`,
    splashImageUrl: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/splash.png`,
    splashBackgroundColor: "#0a0a14",
  },
};
