import type { Metadata } from "next";
import { LocaleProvider } from "@/lib/locale-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Lead Triage CRM Router | Sekimosoft",
  description:
    "Convert inbound customer inquiries into structured CRM-ready lead data with AI-assisted triage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
