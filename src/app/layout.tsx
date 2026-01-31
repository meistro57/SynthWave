import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynthWave DAW",
  description: "Browser-based modular digital audio workstation",
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
