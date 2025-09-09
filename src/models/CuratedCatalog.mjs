// src/models/CuratedCatalog.mjs
import { mongoose } from "../db/mongoose.mjs";

const CuratedItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, index: true },
    name: String,
    brand: String,
    countryCode: String,
    currencyCode: String,
    price: Number,
    logos: [String],
    raw: {} // повний сирий bamboo item
  },
  { _id: false }
);

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // наприклад "gaming"
    updatedAt: { type: Date, default: Date.now, index: true },
    items: [CuratedItemSchema]
  },
  { collection: "curated_catalog" }
);

export const CuratedCatalog =
  (mongoose.models?.CuratedCatalog) ||
  mongoose.model("CuratedCatalog", CuratedSchema);
console.log('[model] CuratedCatalog registered');

