import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicPulse - Municipal Issue Management & Tracking",
  description: "Level 3 DBMS Project with Relational + Vector Database",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
