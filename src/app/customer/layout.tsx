"use client";

import { useState } from "react";

import { Sidebar } from "@/components/shared/layout/Sidebar";
import { Navbar } from "@/components/shared/layout/Navbar";
import { CartProvider } from "@/context/cart-context";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overlayOpen, setOverlayOpen] =
    useState(false);

  return (
    <CartProvider>
      <div className="flex h-screen overflow-hidden bg-[#f7faff]">

        {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

        <div className="hidden lg:flex">
          <Sidebar
            portal="customer"
            mode="fixed"
          />
        </div>

        {/* =====================================================
            MOBILE SIDEBAR
        ===================================================== */}

        <Sidebar
          portal="customer"
          mode="overlay"
          isOpen={overlayOpen}
          onClose={() => setOverlayOpen(false)}
        />

        {/* Mobile overlay */}
        {overlayOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() =>
              setOverlayOpen(false)
            }
          />
        )}

        {/* =====================================================
            MAIN APPLICATION
        ===================================================== */}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Top navbar */}
          <Navbar
            portal="customer"
            onMenuToggle={() =>
              setOverlayOpen((value) => !value)
            }
          />

          {/* Dashboard */}
          <main className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </main>

        </div>
      </div>
    </CartProvider>
  );
}