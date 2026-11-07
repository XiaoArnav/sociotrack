import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocioTrack | AI-Powered Social Media Engagement & Audience Intelligence Agent",
  description:
    "An intelligent social media engagement agent that understands your audience, predicts engagement, and continuously improves your content strategy. Microsoft Hackathon Edition.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F6F7FB] text-[#172033] antialiased min-h-screen selection:bg-[#ECE9FF] selection:text-[#5146D8]">
        {children}
      </body>
    </html>
  );
}
