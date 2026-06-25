import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutual NDA Creator",
  description:
    "Create and download a completed Common Paper Mutual Non-Disclosure Agreement.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before hydration, causing benign mismatches. */}
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
