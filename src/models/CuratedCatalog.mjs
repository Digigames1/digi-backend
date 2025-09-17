import { mongoose } from "../db/mongoose.mjs";

const Schema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    payload: {},
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "curated_catalog" }
);

Schema.index({ key: 1 }, { unique: true });

const _Model =
  (mongoose.models?.CuratedCatalog) || mongoose.model("CuratedCatalog", Schema);

export const CuratedCatalog = _Model;
export default _Model;

console.log("[model] CuratedCatalog registered (has findOne)", {
  hasFindOne: typeof CuratedCatalog?.findOne === "function",
});
