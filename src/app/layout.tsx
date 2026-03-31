import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import Providers from "./providers";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TINA Airdrop | Dashboard",
  description: "Claim your TINA token airdrop on Solana TOKEN2022",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} dark`}>
      <body className="min-h-screen bg-[#060e20] text-[#dee5ff] font-[family-name:var(--font-body)] antialiased selection:bg-[#34fea0]/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
