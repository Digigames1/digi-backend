export type Product = {
  id: string;
  name: string;
  img?: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  platform?: string;   // e.g. STEAM/PLAYSTATION
  instant?: boolean;
  discount?: number;   // %
  region?: string;     // e.g. US
};

export type ProductsResponse = {
  products: Product[];
  total: number;
};
