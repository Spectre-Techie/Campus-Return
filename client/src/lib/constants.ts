export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export const ITEM_CATEGORIES = [
  { id: "electronics", name: "Electronics", icon: "Smartphone" },
  { id: "books", name: "Books & Notes", icon: "BookOpen" },
  { id: "clothing", name: "Clothing", icon: "Shirt" },
  { id: "accessories", name: "Accessories", icon: "Watch" },
  { id: "keys", name: "Keys", icon: "Key" },
  { id: "bags", name: "Bags & Wallets", icon: "Briefcase" },
  { id: "id-cards", name: "ID Cards & Documents", icon: "CreditCard" },
  { id: "other", name: "Other", icon: "Package" },
] as const;

export const TIME_RANGES = [
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
] as const;

export const MAX_DESCRIPTION_LENGTH = 500;
export const MIN_DESCRIPTION_LENGTH = 10;

export const ANALYTICS_STATUS_COLORS = {
  active: "#5B9D99",
  claimed: "#3F6E9E",
  returned: "#78B061",
} as const;

export const ANALYTICS_CHART_STYLE = {
  tooltipBorder: "#cfdae0",
  tooltipRadius: 10,
} as const;
