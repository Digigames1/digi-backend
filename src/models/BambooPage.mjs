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
    key: { type: String, required: true, index: true },
    pageIndex: { type: Number, required: true, index: true },
    items: { type: [BambooProductSchema], default: [] },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_pages" }
);

BambooPageSchema.index({ key: 1, pageIndex: 1 }, { unique: true });

// SINGLE SOURCE OF TRUTH: named + default посилаються на той самий _Model
const _Model =
  (mongoose.models && mongoose.models.BambooPage) ||
  mongoose.model("BambooPage", BambooPageSchema);

export const BambooPage = _Model;
export default _Model;

// sanity log
console.log("[model] BambooPage ready:", {
  modelName: BambooPage?.modelName || null,
  hasFind: typeof BambooPage?.find === "function",
  hasFindOneAndUpdate: typeof BambooPage?.findOneAndUpdate === "function",
});
