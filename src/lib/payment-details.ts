export const PAYMENT_DETAILS = {
  bank: {
    accountName: "SARATHKUMAR THANGAPANDI",
    accountNumber: "20287415792",
    ifsc: "SBIN0000839",
    bankName: "STATE BANK OF INDIA",
  },

  gpay: {
    number: "8903043400",
  },

  qr: {
    image: "/images/ziffix-gpay-qr.png.jpeg",
    alt: "Ziffix GPay payment QR code",
  },

  instructions: [
    "Choose Bank Transfer or Google Pay.",
    "Pay the exact booking amount shown on this page.",
    "Keep your UTR or transaction reference number after payment.",
    "Ziffix will verify the payment before confirming the booking.",
  ],
} as const;