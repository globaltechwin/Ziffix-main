"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Trash2,
  ChevronRight,
  Info,
  Mail,
  Smartphone,
  Tag,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function CustomerSettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    bookingUpdates: true,
    promotions: false,
    email: false,
  });

  const phone = user?.phone || "";

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preference updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your account preferences.
        </p>
      </div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Sun className="size-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Appearance</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Select your preferred theme for the interface.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = mounted && theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Icon className="size-6" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Bell className="size-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Push Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive alerts on your device
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={() => handleNotificationToggle("push")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Bell className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Booking Updates
                </p>
                <p className="text-xs text-muted-foreground">
                  Status changes for your bookings
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.bookingUpdates}
              onCheckedChange={() =>
                handleNotificationToggle("bookingUpdates")
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Tag className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Promotions
                </p>
                <p className="text-xs text-muted-foreground">
                  Deals and offers from Ziffix
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={() =>
                handleNotificationToggle("promotions")
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Email Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={() => handleNotificationToggle("email")}
            />
          </div>
        </div>
      </motion.div>

      {/* Privacy & Security */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">
            Privacy & Security
          </h3>
        </div>
        <div className="space-y-1">
          <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Change Password
                </p>
                <p className="text-xs text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          <Separator />

          <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Info className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Data & Privacy
                </p>
                <p className="text-xs text-muted-foreground">
                  Manage your data preferences
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Account Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="space-y-1">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span className="text-sm font-medium">Log out</span>
          </button>

          <Separator />

          <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-destructive hover:bg-destructive/5">
            <Trash2 className="size-4" />
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your account and data
              </p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="space-y-1">
          <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted/50">
            <span className="text-sm text-muted-foreground">
              App Version
            </span>
            <span className="text-sm text-foreground">1.0.0</span>
          </button>
          <Separator />
          <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted/50">
            <span className="text-sm text-muted-foreground">
              Terms of Service
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <Separator />
          <button className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted/50">
            <span className="text-sm text-muted-foreground">
              Privacy Policy
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
