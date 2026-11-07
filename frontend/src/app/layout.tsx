import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocioTrack | Social Media Engagement Agent Core",
  description:
    "Autonomous Social Media Engagement Agent with LangGraph StateGraph, Brand Voice Evaluation, and Reinforcement Learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
