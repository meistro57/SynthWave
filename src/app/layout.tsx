import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynthWave DAW",
  description: "Browser-based modular digital audio workstation",
};

export const viewport: Viewport = {
  themeColor: "#120c07",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="theme-scrollbar font-sans antialiased">{children}</body>
    </html>
  );
}
