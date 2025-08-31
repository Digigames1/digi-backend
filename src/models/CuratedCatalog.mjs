import mongoose from "mongoose";

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    data: { type: Object, required: true }, // { categories, meta, updatedAt }
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "curated_catalog" }
);

const existing =
  (mongoose.connection?.models?.CuratedCatalog) ||
  (mongoose.models?.CuratedCatalog) ||
  null;

export const CuratedCatalog = existing || mongoose.model("CuratedCatalog", CuratedSchema);
export default CuratedCatalog;
