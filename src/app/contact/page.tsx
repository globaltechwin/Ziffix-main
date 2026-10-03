import { InfoPage } from "@/components/shared/InfoPage";

export default function ContactPage() {
  return <InfoPage title="Contact Ziffix" eyebrow="Support" description="Use the available contact channels for questions about Ziffix services, bookings, or account support." sections={[
    { title: "Phone support", body: "Call 7667163373 for service and account assistance." },
    { title: "Email support", body: "Email support@servly.in with your booking or account details when you need help." },
    { title: "Head office", body: "Head Office - 2nd Floor, Munshi Pulia, Metro Station, Metro Plaza, Flat NO - 103, Sector 17, Indira Nagar, Lucknow, Uttar Pradesh 226016." },
    { title: "Booking help", body: "For an existing booking, keep your booking number available so the support team can locate the service quickly." },
  ]} />;
}
