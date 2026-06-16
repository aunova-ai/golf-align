import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GolfAlign",
  description: "스윙을 기록하고, 성장을 정렬하다."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D89A2B"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
