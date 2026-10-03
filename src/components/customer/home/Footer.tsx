import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const companyLinks = [
  { title: "About Us", href: "/about" },
  { title: "Mission & Vision", href: "/mission" },
  { title: "Contact", href: "/contact" },
  { title: "Privacy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
];

const serviceLinks = [
  {
    title: "All Services",
    href: "/customer/services",
  },
  {
    title: "My Bookings",
    href: "/customer/bookings",
  },
  {
    title: "Subscriptions",
    href: "/customer/subscriptions",
  },
  {
    title: "Notifications",
    href: "/customer/notifications",
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-slate-950 text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
          {/* Brand */}
          <div>
            <Link
              href="/customer/home"
              className="inline-flex rounded-lg bg-white px-3 py-2"
            >
              <img
                src="/logo.png"
                alt="Ziffix"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Professional home services delivered by
              trusted service partners at your doorstep.
            </p>

            <Link
              href="/customer/services"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Explore Services
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">
              Company
            </h3>

            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-sm font-semibold">
              Customer
            </h3>

            <ul className="mt-4 space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold">
              Contact Ziffix
            </h3>

            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />

                <p className="text-sm leading-5 text-slate-400">
                  Head Office - 2nd Floor, Munshi Pulia,
                  Metro Station, Metro Plaza, Flat NO - 103,
                  Sector 17, Indira Nagar, Lucknow, Uttar
                  Pradesh 226016
                </p>
              </div>

              <a
                href="tel:7667163373"
                className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-white"
              >
                <Phone className="size-4 shrink-0 text-primary" />
                7667163373
              </a>

              <a
                href="mailto:support@servly.in"
                className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-white"
              >
                <Mail className="size-4 shrink-0 text-primary" />
                support@servly.in
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-slate-800" />

        <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Ziffix. All
            rights reserved.
          </p>

          <p>
            Professional home services at your doorstep.
          </p>
        </div>
      </div>
    </footer>
  );
}