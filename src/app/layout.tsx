import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ServiceProvider } from "@/context/service-context";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ziffix - Home Services Management",
  description:
    "Professional home services management platform for customers, technicians, and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <CartProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <ServiceProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
              </ServiceProvider>
            </ThemeProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}