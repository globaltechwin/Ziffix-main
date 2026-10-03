"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { serviceDetails } from "@/data/serviceDetails";

const STORAGE_KEY = "ziffix-service-status";

interface ServiceContextType {
  serviceStatus: Record<string, boolean>;
  isServiceActive: (slug: string) => boolean;
  toggleService: (slug: string) => void;
}

const ServiceContext = createContext<ServiceContextType | null>(null);

const defaultStatus: Record<string, boolean> = Object.fromEntries(
  serviceDetails.map((s) => [s.slug, s.isActive])
);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>(defaultStatus);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServiceStatus(JSON.parse(stored));
    }
  } catch {}

  setHydrated(true);
}, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serviceStatus));
    }
  }, [serviceStatus, hydrated]);

  const isServiceActive = useCallback(
    (slug: string) => serviceStatus[slug] ?? true,
    [serviceStatus]
  );

  const toggleService = useCallback((slug: string) => {
    setServiceStatus((prev) => ({
      ...prev,
      [slug]: !(prev[slug] ?? true),
    }));
  }, []);

  return (
    <ServiceContext.Provider value={{ serviceStatus, isServiceActive, toggleService }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useService must be used within ServiceProvider");
  return ctx;
}
