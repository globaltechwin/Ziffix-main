"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    bookingUpdates: true,
    paymentAlerts: true,
    newSignups: false,
  });

  return (
    <div>
      <PageHeader title="Settings" description="Configure system settings" />

      <div className="space-y-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Admin Profile</h3>
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input defaultValue="Admin User" /></div>
              <div><Label>Email</Label><Input type="email" defaultValue="admin@ziffix.com" /></div>
            </div>
            <div><Label>Phone</Label><Input defaultValue="+91 98765 43210" /></div>
            <div><Label>Current Password</Label><Input type="password" placeholder="Enter current password" /></div>
            <div><Label>New Password</Label><Input type="password" placeholder="Enter new password" /></div>
            <Button type="submit">Save Profile</Button>
          </form>
        </motion.div>

        {/* Notification Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Notification Settings</h3>
          <div className="space-y-4">
            {[
              { key: "email" as const, label: "Email Notifications", desc: "Receive email notifications for important updates" },
              { key: "sms" as const, label: "SMS Notifications", desc: "Receive SMS alerts for critical events" },
              { key: "bookingUpdates" as const, label: "Booking Updates", desc: "Get notified when bookings are created or updated" },
              { key: "paymentAlerts" as const, label: "Payment Alerts", desc: "Get notified for payments and refunds" },
              { key: "newSignups" as const, label: "New Signups", desc: "Get notified when new customers register" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                />
              </div>
            ))}
          </div>
          <Button className="mt-4" onClick={() => toast.success("Notification settings saved")}>Save Notifications</Button>
        </motion.div>

        {/* System Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">System Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Currency</Label><Input defaultValue="₹ INR" disabled /></div>
              <div><Label>Timezone</Label><Input defaultValue="Asia/Kolkata (IST)" disabled /></div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Temporarily disable customer-facing features</p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
