import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grosonix - AI Social Media Growth",
  description:
    "Transform your social media presence with AI-powered growth predictions, viral content suggestions, and cross-platform optimization.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(16, 185, 129, 0.1)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "#FFFFFF",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
