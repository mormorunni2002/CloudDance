import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CloudDance CRM",
  description: "Local-first outreach CRM for Clouddance insurance broker outreach.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
