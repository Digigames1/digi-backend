// src/models/CuratedCatalog.mjs
import { mongoose } from "../db/mongoose.mjs";

const PriceSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true },   // USD/EUR/...
    amount: { type: Number, required: true },     // з маркапом/без — як зручно
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    countryCode: { type: String },               // US/DE/...
    currencyCode: { type: String },              // базова валюта товару
    logoUrl: { type: String },
    prices: [PriceSchema],                        // перераховані валюти
    raw: { type: Object },                        // ориг дані з Bamboo (на всяк)
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },        // gaming / streaming / shopping / music / food / travel ...
    brands: [
      {
        brand: { type: String, required: true },  // Playstation / Xbox / Steam / Nintendo / ...
        items: [ProductSchema],
      },
    ],
  },
  { _id: false }
);

const CuratedSchema = new mongoose.Schema(
  {
    slug: { type: String, default: "default", unique: true, index: true },
    currencies: [{ type: String }],               // наприклад ["USD","EUR","CAD","AUD"]
    categories: [CategorySchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ЕКСПОРТУЄМО САМЕ МОДЕЛЬ!
export const CuratedCatalog =
  mongoose.models.CuratedCatalog ||
  mongoose.model("CuratedCatalog", CuratedSchema);

export default CuratedCatalog;

