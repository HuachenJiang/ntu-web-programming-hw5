import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HW5 X-clone",
  description: "Phase 1 Next.js foundation for an English X-style forum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
