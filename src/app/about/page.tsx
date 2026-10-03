import { InfoPage } from "@/components/shared/InfoPage";

export default function AboutPage() {
  return <InfoPage title="About Ziffix" eyebrow="About us" description="Ziffix is a home-services platform designed to make everyday service discovery, booking, and follow-up simple." sections={[
    { title: "One place for home services", body: "Customers can browse services, review service information, select options, schedule a visit, and track bookings from one account." },
    { title: "Service-first experience", body: "The customer portal is organized around services, bookings, profiles, invoices, and subscriptions so the important actions remain easy to find." },
    { title: "Professional operations", body: "The admin and technician portals provide operational tools for customers, services, bookings, technicians, and service delivery." },
    { title: "Built for ongoing improvement", body: "Ziffix can grow with additional services, pricing, technician workflows, and customer features without changing the core booking experience." },
  ]} />;
}
