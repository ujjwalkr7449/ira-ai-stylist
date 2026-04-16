export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: "men" | "women" | "streetwear" | "formal";
  sizes: string[];
  colors: { name: string; hex: string }[];
  description: string;
  rating: number;
  reviews: number;
  tags: string[];
}

// Categories and testimonials are now fetched from the API.
// These are kept only for type compatibility with existing components.
export const products: Product[] = [];

export const categories = [
  { id: "men", label: "Men", image: "" },
  { id: "women", label: "Women", image: "" },
  { id: "streetwear", label: "Streetwear", image: "" },
  { id: "formal", label: "Formal", image: "" },
];

export const testimonials = [
  { name: "Priya S.", text: "IRA's AI stylist recommended the perfect outfit for my interview. Landed the job!", rating: 5 },
  { name: "Arjun M.", text: "The quality is unmatched. Every piece feels premium without breaking the bank.", rating: 5 },
  { name: "Sarah L.", text: "Love the minimalist aesthetic. My entire wardrobe is now IRA.", rating: 4 },
];
