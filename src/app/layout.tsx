import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElevateBox Approval System",
  description: "Role-based document approval and publishing workflow",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
