import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

interface InfoPageProps {
  title: string;
  eyebrow: string;
  description: string;
  sections: Array<{ title: string; body: string }>;
}

export function InfoPage({ title, eyebrow, description, sections }: InfoPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
          <ArrowLeft className="size-4" />
          Back to Ziffix
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#08265f] via-[#0b3c91] to-blue-600 px-6 py-10 text-white sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">{description}</p>
          </div>

          <div className="grid gap-5 p-6 sm:p-10 lg:grid-cols-2">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-6 sm:p-10">
            <div className="grid gap-4 sm:grid-cols-3">
              <ContactItem icon={<Phone className="size-4" />} text="7667163373" />
              <ContactItem icon={<Mail className="size-4" />} text="support@servly.in" />
              <ContactItem icon={<MapPin className="size-4" />} text="Lucknow, Uttar Pradesh" />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="size-4 text-blue-600" />
                Ziffix customer information and service support.
              </div>
              <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Sign in to Ziffix
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ContactItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
      <span className="text-blue-600">{icon}</span>
      {text}
    </div>
  );
}
