// src/models/BambooDump.mjs
import { mongoose } from "../db/mongoose.mjs";

const BambooProductSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true },
    name: String,
    brand: String,
    countryCode: String,
    currencyCode: String,
    priceMin: Number,
    priceMax: Number,
    modifiedDate: Date,
    raw: {}
  },
  { _id: false }
);

const BambooDumpSchema = new mongoose.Schema(
  {
    page: { type: Number, index: true },
    pageSize: Number,
    count: Number,
    fetchedAt: { type: Date, default: Date.now, index: true },
    products: [BambooProductSchema]
  },
  { collection: "bamboo_dump" }
);

export const BambooDump =
  (mongoose.models?.BambooDump) ||
  mongoose.model("BambooDump", BambooDumpSchema);
console.log('[model] BambooDump registered');

