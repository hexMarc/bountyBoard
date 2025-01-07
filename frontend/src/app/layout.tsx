import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata = {
  title: "Lens Bounty Board",
  description:
    "A decentralized bounty marketplace powered by Lens Protocol and Grass Tokens",
  icon: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${spaceGrotesk.className} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <main className="relative flex flex-col min-h-screen">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            <div className="absolute inset-0 bg-gradient-radial from-background/0 via-background/80 to-background pointer-events-none" />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
