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
    lastPage: { type: Number, default: null },
    pageSize: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_dump" }
);

let existing = mongoose.models?.BambooDump;
if (existing && typeof existing.deleteOne !== "function") {
  delete mongoose.models.BambooDump;
  existing = undefined;
}

const _Model = existing || mongoose.model("BambooDump", BambooDumpSchema);

export const BambooDump = _Model;
export default _Model;

// sanity log (once) + safe fallback
if (typeof BambooDump?.deleteOne !== "function") {
  console.error("[BambooDump] exported value is not a real Mongoose Model");
  // fallback to a no-op to keep callers safe
  BambooDump.deleteOne = async () => ({ acknowledged: true, deletedCount: 0 });
  console.warn("[BambooDump] using no-op deleteOne fallback");
} else {
  console.log("[model] BambooDump registered (has deleteOne)");
}
