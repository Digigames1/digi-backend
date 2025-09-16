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
    raw: {},
  },
  { _id: false }
);

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    updatedAt: { type: Date, default: Date.now, index: true },
    items: { type: [CuratedItemSchema], default: [] },
    currencies: { type: [String], default: [] },
    source: { type: Object, default: {} },
  },
  { collection: "curated_catalog" }
);

const _Model =
  (mongoose.models?.CuratedCatalog) || mongoose.model("CuratedCatalog", CuratedSchema);

export const CuratedCatalog = _Model;
export default _Model;

if (typeof CuratedCatalog?.findOne !== "function") {
  console.error("[CuratedCatalog] exported value is not a real Mongoose Model");
} else {
  console.log("[model] CuratedCatalog registered (has findOne)");
}
