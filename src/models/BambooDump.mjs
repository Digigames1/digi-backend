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

// ensure we always expose a real model with deleteOne
let BambooDumpModel = mongoose.models?.BambooDump;
if (BambooDumpModel && typeof BambooDumpModel.deleteOne !== "function") {
  // remove broken registration and recompile
  delete mongoose.models.BambooDump;
  BambooDumpModel = undefined;
}
if (!BambooDumpModel) {
  BambooDumpModel = mongoose.model("BambooDump", BambooDumpSchema);
}
export const BambooDump = BambooDumpModel;

// sanity log (once) + safe fallback
if (typeof BambooDump?.deleteOne !== "function") {
  console.error("[BambooDump] exported value is not a real Mongoose Model");
  // fallback to a no-op to keep callers safe
  BambooDump.deleteOne = async () => ({ acknowledged: true, deletedCount: 0 });
  console.warn("[BambooDump] using no-op deleteOne fallback");
} else {
  console.log("[model] BambooDump registered (has deleteOne)");
}
