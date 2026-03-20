import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://mcpplayground.tech"
  ),
  title: {
    default: "MCP Playground — Test Any MCP Server in Your Browser",
    template: "%s — MCP Playground",
  },
  description:
    "The interactive playground for Model Context Protocol. Browse the official registry, inspect tools and resources, and execute them live — no installation needed.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "AI tools",
    "MCP server",
    "playground",
    "testing",
    "inspector",
  ],
  openGraph: {
    title: "MCP Playground",
    description: "Test any MCP server in your browser. No installation needed.",
    type: "website",
    siteName: "MCP Playground",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Playground",
    description: "Test any MCP server in your browser. No installation needed.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <Providers>
          <TooltipProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
