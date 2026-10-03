export interface ReferenceServiceOption {
  name: string;
  description?: string;
}

export interface ReferenceServiceCatalogItem {
  name: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  options: ReferenceServiceOption[];
  included?: string[];
}

// These are the 13 Phase 1 services selected from the supplied Ziffix material.
// Prices are intentionally not stored here because the source material does not
// provide prices. The database uses 0 for these catalog entries until an admin
// sets the live price.
export const referenceServices: ReferenceServiceCatalogItem[] = [
  {
    name: "Home Cleaning",
    slug: "home-cleaning",
    category: "Home Cleaning",
    description: "Regular home cleaning packages for furnished flats and recurring home maintenance.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&h=600&fit=crop",
    options: [
      { name: "1 BHK Furnished Flat" },
      { name: "2 BHK Furnished Flat" },
      { name: "3 BHK Furnished Flat" },
      { name: "4 BHK Furnished Flat" },
      { name: "Home Cleaning - 3 Months" },
      { name: "Home Cleaning - 6 Months" },
      { name: "Home Cleaning - 12 Months" },
    ],
    included: [
      "Floor wiping + mopping",
      "Dusting",
      "Cabinet cleaning",
      "Bathroom floor scrubbing",
      "Toilet seat & fixtures",
      "Washbasin & fixtures",
      "Table, chair / slab cleaning",
      "Sink & below cleaning",
      "Kitchen appliances (chimney, gas stove)",
      "AC cleaning",
      "Windows & mirrors",
      "Switches & fixtures",
      "Wiping & shining furniture",
      "Mirror cleaning",
      "Sofa & mattress dry vacuuming",
    ],
  },
  {
    name: "Bathroom Cleaning",
    slug: "bathroom-cleaning",
    category: "Bathroom Cleaning",
    description: "Washroom cleaning options from the supplied service material.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&h=600&fit=crop",
    options: [
      { name: "Classic Bathroom Cleaning" },
      { name: "Intense Bathroom Cleaning" },
    ],
  },
  {
    name: "Kitchen Cleaning",
    slug: "kitchen-cleaning",
    category: "Kitchen Cleaning",
    description: "Kitchen cleaning packages covering the listed standard and appliance/chimney options.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&h=600&fit=crop",
    options: [
      { name: "Kitchen Cleaning" },
      { name: "With Appliance & Chimney" },
    ],
  },
  {
    name: "Sofa & Carpet Cleaning",
    slug: "sofa-carpet-cleaning",
    category: "Sofa & Carpet Cleaning",
    description: "Sofa, mattress and carpet cleaning packages listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=600&fit=crop",
    options: [
      { name: "3 Sofa Seats + 3 Cushions" },
      { name: "4 Sofa Seats + 4 Cushions" },
      { name: "5 Sofa Seats + 5 Cushions" },
      { name: "6 Sofa Seats + 6 Cushions" },
      { name: "Mattress Cleaning - Single Bed" },
      { name: "Mattress Cleaning - Double Bed" },
      { name: "Carpet Cleaning" },
    ],
  },
  {
    name: "AC Service & Repair",
    slug: "ac-service-repair",
    category: "AC Service & Repair",
    description: "AC servicing, installation/uninstallation and repair options listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1631545806609-3c480b4c2986?w=900&h=600&fit=crop",
    options: [
      { name: "Window AC Servicing" },
      { name: "Split AC Servicing" },
      { name: "Window AC Uninstallation" },
      { name: "Window AC Installation" },
      { name: "Split AC Uninstallation" },
      { name: "Split AC Installation" },
      { name: "AC Repair (Window / Split)" },
      { name: "Gas Leak Fixing & Refill (Window / Split)" },
    ],
  },
  {
    name: "Mosquito & Safety Nets",
    slug: "mosquito-safety-nets",
    category: "Mosquito & Safety Nets",
    description: "Bird and balcony safety net services listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900&h=600&fit=crop",
    options: [
      { name: "Nylon Bird Net" },
      { name: "Balcony Safety Net Installation" },
    ],
  },
  {
    name: "Curtain Care",
    slug: "curtain-care",
    category: "Curtain Care",
    description: "Curtain and blind-curtain care by the size ranges listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&h=600&fit=crop",
    options: [
      { name: "Blind Curtain - Medium (Up to 30 Sqft)" },
      { name: "Curtain - Medium (Up to 30 Sqft)" },
      { name: "Blind Curtain - Big (Up to 40 Sqft)" },
      { name: "Curtain - Big (Up to 40 Sqft)" },
      { name: "Blind Curtain - XL (Up to 70 Sqft)" },
      { name: "Curtain - XL (Up to 70 Sqft)" },
      { name: "Blind Curtain - XXL (Up to 100 Sqft)" },
      { name: "Blind Curtain - XXXL (Up to 140 Sqft)" },
      { name: "Curtain - XXL (Up to 100 Sqft)" },
      { name: "Curtain - XXXL (Up to 140 Sqft)" },
    ],
  },
  {
    name: "Solar Panel Cleaning",
    slug: "solar-panel-cleaning",
    category: "Solar Panel Cleaning",
    description: "Solar panel cleaning options using the row and meter descriptions supplied in the material.",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=900&h=600&fit=crop",
    options: [
      { name: "Single Row - 3 Meter" },
      { name: "Double Row - 4 Meter" },
      { name: "Single Row - 3 Meter to 6 Meter" },
    ],
  },
  {
    name: "Fan Cleaning",
    slug: "fan-cleaning",
    category: "Fan Cleaning",
    description: "Ceiling fan cleaning service listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=900&h=600&fit=crop",
    options: [{ name: "Ceiling Fan Cleaning" }],
  },
  {
    name: "Exhaust Fan Cleaning",
    slug: "exhaust-fan-cleaning",
    category: "Exhaust Fan Cleaning",
    description: "Exhaust fan cleaning service listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&h=600&fit=crop",
    options: [{ name: "Exhaust Fan Cleaning" }],
  },
  {
    name: "Home Deep Cleaning",
    slug: "home-deep-cleaning",
    category: "Home Deep Cleaning",
    description: "Home deep cleaning with the room, bathroom, kitchen, balcony and furniture inclusions listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=900&h=600&fit=crop",
    options: [{ name: "Home Deep Cleaning" }],
    included: [
      "Room floor scrubbing",
      "Ceiling & fan dusting",
      "Cabinet exterior & interior",
      "Bathroom floor scrubbing",
      "Toilet seat & fixtures",
      "Washbasin & fixtures",
      "Kitchen tiles & slabs",
      "Kitchen sink & under the sink",
      "Stove & kitchen appliances",
      "Balcony",
      "Doors, windows & mirrors",
      "Switch board & fixtures",
      "Doors wiping & shining",
      "Table-chair wiping & shining",
      "Other furniture wiping & shining",
      "Storage unit wiping & shining",
      "Sofa & mattress",
    ],
  },
  {
    name: "Full Home Deep Cleaning",
    slug: "full-home-deep-cleaning",
    category: "Full Home Deep Cleaning",
    description: "Premium furnished home/flat deep-cleaning packages by BHK as listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&h=600&fit=crop",
    options: [
      { name: "Premium Furnished Home/Flat - 1 BHK" },
      { name: "Premium Furnished Home/Flat - 2 BHK" },
      { name: "Premium Furnished Home/Flat - 3 BHK" },
      { name: "Premium Furnished Home/Flat - 4 BHK" },
    ],
  },
  {
    name: "Cleaning Subscriptions",
    slug: "cleaning-subscriptions",
    category: "Cleaning Subscriptions",
    description: "Recurring home-cleaning subscription options listed in the supplied material.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&h=600&fit=crop",
    options: [
      { name: "3 Months" },
      { name: "6 Months" },
      { name: "12 Months" },
      { name: "1 Visit / Month" },
    ],
  },
];

export const referenceServiceSlugs = new Set(referenceServices.map((service) => service.slug));

export function getReferenceService(slug: string) {
  return referenceServices.find((service) => service.slug === slug);
}
