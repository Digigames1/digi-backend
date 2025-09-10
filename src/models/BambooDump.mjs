// src/models/BambooDump.mjs
import { mongoose } from "../db/mongoose.mjs";

const BambooDumpItemSchema = new mongoose.Schema(
  {
    brand: String,
    id: { type: Number, index: true },
    name: String,
    countryCode: String,
    currencyCode: String,
    priceMin: Number,
    priceMax: Number,
    modifiedDate: Date,
    raw: {},
  },
  { _id: false }
);

const BambooDumpSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    items: [BambooDumpItemSchema],
    pagesFetched: Number,
    total: Number,
    updatedAt: { type: Date, default: Date.now, index: true },
    query: {},
  },
  { collection: "bamboo_dump" }
);

export const BambooDump =
  (mongoose.models?.BambooDump) ||
  mongoose.model("BambooDump", BambooDumpSchema);
console.log('[model] BambooDump registered');

