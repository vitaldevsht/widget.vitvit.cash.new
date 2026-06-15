import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import InactivityLogout from "../components/InactivityLogout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VitVit.Cash - HTG to USDC",
  description:
    "A seamless, mobile-responsive stablecoin On-Ramp for converting Haitian Gourde (HTG) to USDC on Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InactivityLogout />
        {children}
      </body>
    </html>
  );
}
