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

const BambooPageSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, required: true },
    pageIndex: { type: Number, required: true, index: true },
    items: { type: [BambooProductSchema], default: [] },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_pages" }
);

BambooPageSchema.index({ key: 1, pageIndex: 1 }, { unique: true });

const _Model =
  mongoose.models?.BambooPage || mongoose.model("BambooPage", BambooPageSchema);

export const BambooPage = _Model;
export default _Model;

console.log("[model] BambooPage ready:", {
  hasFindOneAndUpdate: typeof BambooPage?.findOneAndUpdate === "function",
});
