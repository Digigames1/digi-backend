// src/models/BambooPage.mjs
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

// IMPORTANT: compile once on the singleton mongoose instance
const Model =
  (mongoose.models && mongoose.models.BambooPage) ||
  mongoose.model("BambooPage", BambooPageSchema);

// Named + default exports MUST point to the SAME object
export const BambooPage = Model;
export default Model;

// Log AFTER model is created so modelName is not null
console.log("[model] BambooPage ready:", {
  modelName: BambooPage?.modelName || null,
  hasFind: typeof BambooPage?.find === "function",
  hasF1U: typeof BambooPage?.findOneAndUpdate === "function",
});
