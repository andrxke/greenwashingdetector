import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoClaim Auditor | AI Greenwashing Detection",
  description:
    "AI-powered greenwashing detection platform. Analyze websites, ESG reports, and marketing copy for deceptive environmental claims.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2220%22 font-size=%2220%22>\uD83C\uDF31</text></svg>"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base-950 bg-grid font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
