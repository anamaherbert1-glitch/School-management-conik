import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School management conik",
  description: "Plateforme SaaS de gestion scolaire et universitaire",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
