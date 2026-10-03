"use client";

import { motion } from "motion/react";

const offers = [
  {
    id: "offer1",
    title: "Deep Home Cleaning",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop",
    originalPrice: 3000,
    offerPrice: 2000,
    discount: "33% OFF",
  },
  {
    id: "offer2",
    title: "Full Kitchen Cleaning",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
    originalPrice: 2500,
    offerPrice: 1800,
    discount: "28% OFF",
  },
  {
    id: "offer3",
    title: "AC Service & Repair",
    image: "https://images.unsplash.com/photo-1631545806609-3c480b4c2986?w=600&h=400&fit=crop",
    originalPrice: 4000,
    offerPrice: 2999,
    discount: "25% OFF",
  },
  {
    id: "offer4",
    title: "Car Wash Package",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&h=400&fit=crop",
    originalPrice: 1500,
    offerPrice: 999,
    discount: "33% OFF",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function Offers() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Offers for You
        </h2>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {offers.map((offer) => (
          <motion.div
            key={offer.id}
            variants={item}
            whileHover={{ y: -2 }}
          >
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[3/2] overflow-hidden">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {offer.discount}
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground">
                  {offer.title}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    ₹{offer.offerPrice}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ₹{offer.originalPrice}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
