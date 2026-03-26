import type { Metadata } from "next";
import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "../components/providers";

export const metadata: Metadata = {
  title: "Frontier Trade Routes",
  description:
    "Privacy-aware frontier logistics terminal with route intelligence, bond-backed orders, and carrier progression on Sui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
