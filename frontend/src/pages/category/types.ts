export type Product = {
  id: string;
  name: string;
  img?: string;
  price: number;
  oldPrice?: number;
  rating: number;          // 0..5
  reviews?: number;
  platform?: "XBOX"|"PLAYSTATION"|"STEAM"|"US"|"GLOBAL"|"APPLE"|"GOOGLE";
  instant?: boolean;
  discount?: number;       // у %
  region?: string;         // US/EU/UA/...
};
export type CategoryKey = "gaming"|"streaming"|"shopping"|"music"|"fooddrink"|"travel";
