import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyClipping",
  description: "Your creative campaign workspace.",
  icons: {
    icon: "/myclipping.png",
    shortcut: "/myclipping.png",
    apple: "/myclipping.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

import AuthProvider from "./components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
