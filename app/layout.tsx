import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recall Rush",
  description: "Active recall flashcards for fast study sprints"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
