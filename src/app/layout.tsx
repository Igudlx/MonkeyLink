import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MonkeyLink",
  description: "Send events and messages to your Unity game from the web.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
