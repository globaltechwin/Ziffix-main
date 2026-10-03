import { InfoPage } from "@/components/shared/InfoPage";

export default function TermsPage() {
  return <InfoPage title="Terms" eyebrow="Service terms" description="These general terms describe the expected use of the Ziffix service platform." sections={[
    { title: "Use of the platform", body: "Use Ziffix with accurate account and booking information and only for legitimate service requests." },
    { title: "Bookings", body: "A booking records the selected service, requested schedule, service address, and booking amount. Availability and technician assignment may change as the booking is processed." },
    { title: "Service information", body: "Service descriptions, options, images, durations, and prices are presented through the current Ziffix catalog and may be updated by authorized administrators." },
    { title: "Account responsibility", body: "Keep your login information secure and contact support if you believe your account information needs correction or protection." },
  ]} />;
}
