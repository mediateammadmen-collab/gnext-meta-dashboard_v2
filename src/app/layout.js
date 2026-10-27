import { Geist, Geist_Mono } from "next/font/google";
import { DashboardHeader } from "@/components/dashboard-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GNext Meta Ads Dashboard",
  description: "Live spend, reach, and creative performance from the Meta Marketing API.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DashboardHeader />
        {children}
      </body>
    </html>
  );
}
