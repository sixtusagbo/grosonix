import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

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
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(139, 92, 246, 0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              color: "#FFFFFF",
            },
          }}
        />
      </body>
    </html>
  );
}
