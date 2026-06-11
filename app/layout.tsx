import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Predictions League",
  description: "Tomoro team World Cup predictions and leaderboard",
  icons: {
    icon: "/world-cup-clean.png",
    shortcut: "/world-cup-clean.png",
    apple: "/world-cup-clean.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
