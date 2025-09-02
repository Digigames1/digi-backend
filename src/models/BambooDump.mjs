// src/models/BambooDump.mjs
import { mongoose } from "../db/mongoose.mjs";

const DumpItemSchema = new mongoose.Schema(
  {
    brandId: Number,
    brandName: String,
    productId: Number,
    productName: String,
    countryCode: String,
    currencyCode: String,
    priceMin: Number,
    priceMax: Number,
    raw: Object,             // сирі дані з Bamboo на випадок потреби
  },
  { _id: false }
);

const BambooDumpSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // наприклад "catalog:v2:page:0"
    pageIndex: { type: Number, default: 0 },
    pageSize: { type: Number, default: 100 },
    count: { type: Number, default: 0 },
    items: [DumpItemSchema],
    fetchedAt: { type: Date, default: Date.now },
    meta: { type: Object },
  },
  { timestamps: true }
);

// ЕКСПОРТУЄМО САМЕ МОДЕЛЬ!
export const BambooDump =
  mongoose.models.BambooDump ||
  mongoose.model("BambooDump", BambooDumpSchema);

export default BambooDump;

