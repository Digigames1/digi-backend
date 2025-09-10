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
    raw: {},
  },
  { _id: false }
);

const BambooDumpSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true, unique: true },
    query: { type: Object, default: {} },
    items: { type: [BambooProductSchema], default: [] },
    pagesFetched: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_dump" }
);

export const BambooDump =
  (mongoose.models?.BambooDump) || mongoose.model("BambooDump", BambooDumpSchema);

// sanity log (once)
if (typeof BambooDump?.deleteOne !== "function") {
  console.error("[BambooDump] exported value is not a real Mongoose Model");
} else {
  console.log("[model] BambooDump registered (has deleteOne)");
}
