import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HW5 X-clone",
  description: "English X-style forum for NTU Web Programming HW5.",
  icons: {
    icon: "/orbit-logo.svg",
  },
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
