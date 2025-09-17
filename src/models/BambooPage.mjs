import { mongoose } from "../db/mongoose.mjs";

const ItemSchema = new mongoose.Schema(
  {
    id: Number,
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

const Schema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    pageIndex: { type: Number, required: true, index: true },
    items: { type: [ItemSchema], default: [] },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_pages" }
);

Schema.index({ key: 1, pageIndex: 1 }, { unique: true });

const _Model =
  (mongoose.models?.BambooPage) || mongoose.model("BambooPage", Schema);

export const BambooPage = _Model;
export default _Model;

console.log("[model] BambooPage ready:", {
  modelName: BambooPage?.modelName || null,
  hasFind: typeof BambooPage?.find === "function",
  hasFindOneAndUpdate: typeof BambooPage?.findOneAndUpdate === "function",
});
