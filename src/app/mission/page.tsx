import { InfoPage } from "@/components/shared/InfoPage";

export default function MissionPage() {
  return <InfoPage title="Mission & Vision" eyebrow="Our direction" description="Our goal is to create a dependable digital experience for discovering and managing home services." sections={[
    { title: "Our mission", body: "Make professional home services easier to discover, schedule, manage, and track from a single customer experience." },
    { title: "Our vision", body: "Build a service platform where customers, administrators, and technicians have clear information and practical tools for every stage of a booking." },
    { title: "Customer focus", body: "Clear service information, transparent booking status, and accessible account tools are central to the Ziffix experience." },
    { title: "Operational clarity", body: "Ziffix is designed to keep service teams informed about customers, bookings, technicians, and service delivery." },
  ]} />;
}
