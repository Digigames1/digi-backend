// src/models/BambooDump.mjs
import * as mg from "../db/mongoose.mjs";

const mongoose = mg.default || mg.mongoose || mg;
if (!mongoose || typeof mongoose.Schema !== "function") {
  throw new Error("Mongoose import failed in BambooDump.mjs");
}
if (!mongoose.models) mongoose.models = {};

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
    raw: Object,
  },
  { _id: false }
);

const BambooDumpSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    pageIndex: { type: Number, default: 0 },
    pageSize: { type: Number, default: 100 },
    count: { type: Number, default: 0 },
    items: [DumpItemSchema],
    fetchedAt: { type: Date, default: Date.now },
    meta: Object,
  },
  { timestamps: true, collection: "bamboo_dump" }
);

const BambooDump =
  mongoose.models.BambooDump ||
  mongoose.model("BambooDump", BambooDumpSchema);

export default BambooDump;
export { BambooDump };
