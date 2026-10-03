"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string | null;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  basePrice: number;
  startingPrice?: number;
  duration: number;
}

interface Technician {
  id: string;
  name: string;
}

export default function AdminCreateBookingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [customersResponse, servicesResponse, techniciansResponse] = await Promise.all([
          fetch("/api/admin/customers", { cache: "no-store" }),
          fetch("/api/admin/services", { cache: "no-store" }),
          fetch("/api/admin/technicians", { cache: "no-store" }),
        ]);

        const [customersData, servicesData, techniciansData] = await Promise.all([
          customersResponse.json(),
          servicesResponse.json(),
          techniciansResponse.json(),
        ]);

        if (!customersResponse.ok) throw new Error(customersData?.error || "Failed to load customers");
        if (!servicesResponse.ok) throw new Error(servicesData?.error || "Failed to load services");
        if (!techniciansResponse.ok) throw new Error(techniciansData?.error || "Failed to load technicians");

        if (!mounted) return;

        setCustomers(Array.isArray(customersData.customers) ? customersData.customers : []);
        setServices(Array.isArray(servicesData.services) ? servicesData.services : []);
        setTechnicians(
          Array.isArray(techniciansData.technicians)
            ? techniciansData.technicians.map((item: Technician) => ({ id: item.id, name: item.name }))
            : []
        );
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load booking form");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  function handleServiceChange(value: string) {
    setServiceId(value);

    const service = services.find((item) => item.id === value);
    const price = service?.startingPrice ?? service?.basePrice ?? 0;

    setTotalAmount(value && service ? String(price) : "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!customerId || !serviceId || !scheduledDate || !scheduledTime || !address.trim()) {
      setError("Customer, service, date, time, and address are required.");
      return;
    }

    const amount = Number(totalAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid booking amount.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          serviceId,
          technicianId: technicianId || null,
          scheduledDate,
          scheduledTime,
          address: address.trim(),
          notes: notes.trim() || null,
          totalAmount: amount,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to create booking");

      router.push("/admin/bookings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="size-4" />
        Back to Bookings
      </Link>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Booking</h1>
          <p className="mt-1 text-sm text-slate-500">Create a service booking for a customer from the admin portal.</p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field label="Customer">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="field-input" required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name || "Customer"} — {customer.phone}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Service">
            <select value={serviceId} onChange={(e) => handleServiceChange(e.target.value)} className="field-input" required>
              <option value="">Select service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — ₹{(service.startingPrice ?? service.basePrice ?? 0).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Technician (optional)">
            <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="field-input">
              <option value="">Assign later</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>{technician.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Total amount (₹)">
            <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} type="number" min="0" step="1" className="field-input" required />
          </Field>

          <Field label="Service date">
            <input value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} type="date" className="field-input" required />
          </Field>

          <Field label="Time slot">
            <input value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} placeholder="02:00 PM - 04:00 PM" className="field-input" required />
          </Field>

          <Field label="Service address" className="sm:col-span-2">
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="field-input" required />
          </Field>

          <Field label="Notes (optional)" className="sm:col-span-2">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="field-input" />
          </Field>

          <div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link href="/admin/bookings" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.75rem;
          background: white;
          padding: 0.7rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
        }
        .field-input:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
