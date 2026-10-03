import { InfoPage } from "@/components/shared/InfoPage";

export default function PrivacyPage() {
  return <InfoPage title="Privacy" eyebrow="Your information" description="This page describes the intended privacy principles for the Ziffix customer experience." sections={[
    { title: "Account information", body: "Ziffix uses account information such as your phone number and name to authenticate your account and provide your requested services." },
    { title: "Booking information", body: "Booking details such as service selection, schedule, address, and notes are used to arrange and manage the requested service." },
    { title: "Access control", body: "Customer, technician, and administrator areas are separated so users see the portal functions associated with their account role." },
    { title: "Support", body: "If you have questions about information associated with your account, contact Ziffix support using the contact details on this site." },
  ]} />;
}
