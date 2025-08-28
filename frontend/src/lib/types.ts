export type Product = {
  id: string;
  name: string;
  img?: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  platform?: "XBOX"|"PLAYSTATION"|"STEAM"|string;
  instant?: boolean;
  discount?: number;
  region?: string;
  denomination?: number;
};

export type Facets = {
  platforms?: string[];
  regions?: string[];
  denominations?: number[];
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  facets?: Facets;
};
