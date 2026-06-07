import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccountIQ — CIMA Learning",
  description: "Gamified CIMA accounting education powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
