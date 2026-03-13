import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Pablo Ovejas - Gestión ganadera",
  description: "Control de ovejas y gastos de explotación",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen pb-20 md:pb-4">
        <main className="max-w-lg mx-auto min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
