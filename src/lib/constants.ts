export type NavItem = {
  title: string;
  href: string;
  icon: string;
};

export const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Basic access for occasional use",
    icon: "Star",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    features: [
      "3 bookings per month",
      "Basic services only",
      "Standard support",
      "Standard response time",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 499,
    description: "For regular home service needs",
    icon: "Zap",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    features: [
      "Unlimited bookings",
      "All services included",
      "Priority booking slots",
      "Monthly maintenance visit",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    description: "Complete home care solution",
    icon: "Crown",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    features: [
      "Unlimited bookings",
      "All services included",
      "Instant booking priority",
      "Free monthly visit",
      "24/7 priority support",
      "Extended warranty on services",
      "Dedicated technician",
    ],
  },
];

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { title: "Customers", href: "/admin/customers", icon: "Users" },
  { title: "Bookings", href: "/admin/bookings", icon: "Calendar" },
  { title: "Technicians", href: "/admin/technicians", icon: "Wrench" },
  { title: "Services", href: "/admin/services", icon: "Home" },
  { title: "Payments", href: "/admin/payments", icon: "CreditCard" },
  { title: "Subscriptions", href: "/admin/subscriptions", icon: "Crown" },
  { title: "Reports", href: "/admin/reports", icon: "BarChart3" },
  { title: "Users", href: "/admin/users", icon: "UserCog" },
  { title: "Settings", href: "/admin/settings", icon: "Settings" },
];

export const customerNavItems: NavItem[] = [
  { title: "Home", href: "/customer/home", icon: "Home" },
  { title: "Services", href: "/customer/services", icon: "Search" },
  { title: "My Bookings", href: "/customer/bookings", icon: "CalendarCheck" },
  { title: "Invoices", href: "/customer/invoices", icon: "FileText" },
  { title: "Subscriptions", href: "/customer/subscriptions", icon: "Crown" },
  { title: "Notifications", href: "/customer/notifications", icon: "Bell" },
  { title: "Profile", href: "/customer/profile", icon: "User" },
  { title: "Settings", href: "/customer/settings", icon: "Settings" },
];

export const technicianNavItems: NavItem[] = [
  { title: "Dashboard", href: "/technician/dashboard", icon: "LayoutDashboard" },
  { title: "My Jobs", href: "/technician/jobs", icon: "ClipboardList" },
  { title: "Earnings", href: "/technician/earnings", icon: "DollarSign" },
  { title: "Availability", href: "/technician/availability", icon: "Clock" },
  { title: "Notifications", href: "/technician/notifications", icon: "Bell" },
  { title: "Profile", href: "/technician/profile", icon: "User" },
  { title: "Settings", href: "/technician/settings", icon: "Settings" },
];

export const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/customers": "Customers",
  "/admin/bookings": "Bookings",
  "/admin/technicians": "Technicians",
  "/admin/services": "Services",
  "/admin/payments": "Payments",
  "/admin/subscriptions": "Subscriptions",
  "/admin/reports": "Reports",
  "/admin/users": "Users",
  "/admin/settings": "Settings",
  "/customer/home": "Home",
  "/customer/services": "Services",
  "/customer/bookings": "My Bookings",
  "/customer/invoices": "Invoices",
  "/customer/subscriptions": "Subscriptions",
  "/customer/notifications": "Notifications",
  "/customer/profile": "Profile",
  "/customer/settings": "Settings",
  "/technician/dashboard": "Dashboard",
  "/technician/jobs": "My Jobs",
  "/technician/earnings": "Earnings",
  "/technician/availability": "Availability",
  "/technician/notifications": "Notifications",
  "/technician/profile": "Profile",
  "/technician/settings": "Settings",
};
